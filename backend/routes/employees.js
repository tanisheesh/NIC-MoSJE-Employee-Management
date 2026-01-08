const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User, Employee, Department, Position } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');
const { createEmployeeDirectories, deleteEmployeeDirectory } = require('../utils/secureFileUpload');
const { validatePassword } = require('../utils/passwordValidation');

const router = express.Router();

// Get all employees (Admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', department = '', status = '' } = req.query;
    
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { employeeId: { [Op.like]: `%${search.replace('NIC-', '')}%` } }
      ];
    }
    if (department) whereClause.department = department;
    if (status) whereClause.status = status;

    const offset = (page - 1) * limit;
    
    const { count, rows: employees } = await Employee.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role'],
          where: {
            role: 'employee' // Only show employees, exclude admin and superadmin
          }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Add department and position info to each employee
    const employeesWithInfo = await Promise.all(employees.map(async (employee) => {
      const empData = employee.toJSON();
      
      if (employee.departmentId) {
        empData.departmentInfo = await Department.findByPk(employee.departmentId);
      }
      
      if (employee.positionId) {
        empData.positionInfo = await Position.findByPk(employee.positionId);
      }
      
      return empData;
    }));

    res.json({
      employees: employeesWithInfo,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees', details: error.message });
  }
});

// Get employee by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({
      where: { userId: req.params.userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role', 'username']
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && employee.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Get employee by user ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role', 'username']
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Employees can only view their own profile, admins can view any
    if (req.user.role !== 'admin' && employee.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch department and position info if IDs exist
    let departmentInfo = null;
    let positionInfo = null;
    
    if (employee.departmentId) {
      departmentInfo = await Department.findByPk(employee.departmentId);
    }
    
    if (employee.positionId) {
      positionInfo = await Position.findByPk(employee.positionId);
    }

    // Add the info to the response
    const employeeData = employee.toJSON();
    employeeData.departmentInfo = departmentInfo;
    employeeData.positionInfo = positionInfo;

    res.json(employeeData);
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new employee (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const {
      employeeId,
      firstName,
      lastName,
      email,
      personalEmail,
      username,
      password,
      phone,
      dateOfBirth,
      joiningDate,
      marriageAnniversary,
      address,
      landmark,
      city,
      district,
      state,
      pincode,
      department,
      position,
      status = 'active'
    } = req.body;

    // Validate required fields
    if (!employeeId || !firstName || !lastName || !email || !username || !password || !phone || !department || !position) {
      return res.status(400).json({ 
        message: 'Required fields: employeeId, firstName, lastName, email, username, password, phone, department, position'
      });
    }

    // Validate employee ID format
    if (!/^\d{3}$/.test(employeeId)) {
      return res.status(400).json({ 
        message: 'Employee ID must be exactly 3 digits'
      });
    }

    // Validate phone number
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ 
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Check if employee ID already exists
    const existingEmployeeId = await Employee.findOne({ where: { employeeId } });
    if (existingEmployeeId) {
      return res.status(400).json({ 
        message: `Employee ID ${employeeId} already exists`
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ 
        message: 'Email already exists'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ 
        message: 'Username already exists'
      });
    }

    // Validate password
    const personalInfo = { firstName, lastName, email, username };
    const passwordValidation = validatePassword(password, personalInfo);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user account
    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      role: 'employee'
    });

    // Create employee profile
    const employee = await Employee.create({
      employeeId,
      firstName,
      lastName,
      email,
      personalEmail,
      username,
      phone,
      dateOfBirth,
      joiningDate,
      marriageAnniversary,
      address,
      landmark,
      city,
      district,
      state,
      pincode,
      department,
      position,
      status,
      userId: user.id
    });

    // Create employee directory structure
    createEmployeeDirectories(`NIC-${employeeId}`, `${firstName}_${lastName}`);

    // Return employee with user info
    const newEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role', 'username']
        }
      ]
    });

    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update employee profile (Employee can update their own profile)
router.put('/:id/profile', auth, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee is updating their own profile or if user is admin
    if (req.user.role !== 'admin' && employee.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }

    const {
      personalEmail,
      phone,
      dateOfBirth,
      marriageAnniversary,
      address,
      landmark,
      city,
      district,
      state,
      pincode
    } = req.body;

    // Validate phone number if provided
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ 
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Update employee - only allow certain fields for self-update
    const updateData = {};
    if (personalEmail !== undefined) updateData.personalEmail = personalEmail;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (marriageAnniversary !== undefined) updateData.marriageAnniversary = marriageAnniversary;
    if (address !== undefined) updateData.address = address;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;

    await employee.update(updateData);

    // Return updated employee with user info
    const updatedEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role', 'username']
        }
      ]
    });

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update employee (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const {
      firstName,
      lastName,
      personalEmail,
      phone,
      dateOfBirth,
      joiningDate,
      leavingDate,
      marriageAnniversary,
      address,
      landmark,
      city,
      district,
      state,
      pincode,
      department,
      position,
      departmentId,
      positionId,
      status
    } = req.body;

    // Validate phone number if provided
    if (phone && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ 
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Update employee - only update fields that are provided
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (personalEmail !== undefined) updateData.personalEmail = personalEmail;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (joiningDate !== undefined) updateData.joiningDate = joiningDate;
    if (leavingDate !== undefined) updateData.leavingDate = leavingDate;
    if (marriageAnniversary !== undefined) updateData.marriageAnniversary = marriageAnniversary;
    if (address !== undefined) updateData.address = address;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (status !== undefined) updateData.status = status;

    // Handle department update - if departmentId is provided, fetch department name
    if (departmentId !== undefined) {
      updateData.departmentId = departmentId;
      if (departmentId) {
        try {
          const dept = await Department.findByPk(departmentId);
          if (dept) {
            updateData.department = dept.name;
          }
        } catch (error) {
          console.error('Error fetching department:', error);
        }
      } else {
        updateData.department = department || 'General';
      }
    } else if (department !== undefined) {
      updateData.department = department;
    }

    // Handle position update - if positionId is provided, fetch position title
    if (positionId !== undefined) {
      updateData.positionId = positionId;
      if (positionId) {
        try {
          const pos = await Position.findByPk(positionId);
          if (pos) {
            updateData.position = pos.title;
          }
        } catch (error) {
          console.error('Error fetching position:', error);
        }
      } else {
        updateData.position = position || 'Employee';
      }
    } else if (position !== undefined) {
      updateData.position = position;
    }

    await employee.update(updateData);

    // Return updated employee with user info
    const updatedEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role', 'username']
        }
      ]
    });

    res.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete employee (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete employee directory and all uploaded files
    deleteEmployeeDirectory(`NIC-${employee.employeeId}`, `${employee.firstName}_${employee.lastName}`);

    // Delete associated user account
    await employee.user.destroy();
    
    // Delete employee record
    await employee.destroy();

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset employee password (Admin only)
router.put('/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const employee = await Employee.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Validate new password
    const personalInfo = {
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      username: employee.username,
      phone: employee.phone
    };

    const passwordValidation = validatePassword(newPassword, personalInfo);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Hash and update password (skip model hook to avoid double hashing)
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await employee.user.update({
      password: hashedPassword,
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      passwordChangedAt: new Date()
    }, {
      hooks: false // Skip model hooks to avoid double hashing
    });

    res.json({ message: 'Employee password reset successfully' });
  } catch (error) {
    console.error('Reset employee password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;