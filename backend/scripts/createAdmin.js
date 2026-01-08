const { sequelize, User, Employee } = require('../models');
require('dotenv').config();

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL database');
    
    // Sync models
    await sequelize.sync();
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'admin@company.com',
      username: 'admin',
      password: 'AdminPassword123!',
      role: 'admin'
    });

    // Create admin employee profile
    const adminEmployee = await Employee.create({
      employeeId: '001',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@company.com',
      username: 'admin',
      phone: '1234567890',
      dateOfBirth: '1990-01-01',
      joiningDate: new Date().toISOString().split('T')[0],
      department: 'Information Technology',
      position: 'System Administrator',
      address: '123 Admin Street',
      city: 'Admin City',
      state: 'Delhi',
      pincode: '110001',
      status: 'active',
      userId: adminUser.id
    });

    console.log('Admin user created successfully');
    console.log('Email: admin@company.com');
    console.log('Username: admin');
    console.log('Password: AdminPassword123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();