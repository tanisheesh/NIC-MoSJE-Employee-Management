const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { PendingRegistration, User, Employee } = require('../models');
const { adminAuth } = require('../middleware/auth');
const { validatePassword } = require('../utils/passwordValidation');
const { createEmployeeDirectories } = require('../utils/secureFileUpload');

const router = express.Router();

// Submit registration request
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ 
        message: 'All fields are required'
      });
    }

    // Check if email already exists in users or pending registrations
    const existingEmail = await User.findOne({ where: { email } });
    const pendingEmail = await PendingRegistration.findOne({ where: { email } });
    
    if (existingEmail || pendingEmail) {
      return res.status(400).json({ 
        message: 'Email is already registered or pending approval'
      });
    }

    // Check if username already exists in users or pending registrations
    const existingUsername = await User.findOne({ where: { username } });
    const pendingUsername = await PendingRegistration.findOne({ where: { username } });
    
    if (existingUsername || pendingUsername) {
      return res.status(400).json({ 
        message: 'Username is already taken or pending approval'
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

    // Create pending registration
    const pendingRegistration = await PendingRegistration.create({
      firstName,
      lastName,
      email,
      username,
      password: hashedPassword
    });

    res.status(201).json({ 
      message: 'Registration request submitted successfully. Please wait for admin approval.',
      id: pendingRegistration.id
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending registrations (Admin only)
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const pendingRegistrations = await PendingRegistration.findAll({
      where: { status: 'pending' },
      order: [['createdAt', 'DESC']]
    });

    res.json(pendingRegistrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve registration (Admin only)
router.post('/approve/:id', adminAuth, async (req, res) => {
  try {
    const { employeeId, phone } = req.body;
    const registrationId = req.params.id;

    // Validate required fields
    if (!employeeId || !phone) {
      return res.status(400).json({ 
        message: 'Employee ID and phone number are required'
      });
    }

    // Validate employee ID
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
    const existingEmployee = await Employee.findOne({
      where: { employeeId }
    });
    
    if (existingEmployee) {
      return res.status(400).json({ 
        message: `Employee ID ${employeeId} is already taken. Please choose a different number.`
      });
    }

    // Get pending registration
    const pendingRegistration = await PendingRegistration.findByPk(registrationId);
    if (!pendingRegistration || pendingRegistration.status !== 'pending') {
      return res.status(404).json({ message: 'Pending registration not found' });
    }

    // Create user account
    const user = await User.create({
      email: pendingRegistration.email,
      username: pendingRegistration.username,
      password: pendingRegistration.password, // Already hashed
      role: 'employee'
    });

    // Create employee profile
    const employee = await Employee.create({
      employeeId,
      firstName: pendingRegistration.firstName,
      lastName: pendingRegistration.lastName,
      email: pendingRegistration.email,
      username: pendingRegistration.username,
      phone,
      joiningDate: new Date(), // Set joining date to today
      department: 'General',
      position: 'Employee',
      userId: user.id
    });

    // Create employee directory structure
    createEmployeeDirectories(`NIC-${employeeId}`, `${pendingRegistration.firstName}_${pendingRegistration.lastName}`);

    // Update pending registration status
    await pendingRegistration.update({
      status: 'approved',
      approvedBy: req.user.id
    });

    res.json({ 
      message: 'Registration approved successfully',
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject registration (Admin only)
router.post('/reject/:id', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const registrationId = req.params.id;

    // Get pending registration
    const pendingRegistration = await PendingRegistration.findByPk(registrationId);
    if (!pendingRegistration || pendingRegistration.status !== 'pending') {
      return res.status(404).json({ message: 'Pending registration not found' });
    }

    // Delete the pending registration
    await pendingRegistration.destroy();

    res.json({ message: 'Registration rejected and deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;