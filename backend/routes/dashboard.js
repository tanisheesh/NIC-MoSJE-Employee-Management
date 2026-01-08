const express = require('express');
const { User, Employee, Document, PendingRegistration } = require('../models');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics (Admin only)
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // Get total employees count
    const totalEmployees = await Employee.count({
      include: [{
        model: User,
        as: 'user',
        where: { role: 'employee' }
      }]
    });

    // Get active employees count
    const activeEmployees = await Employee.count({
      where: { status: 'active' },
      include: [{
        model: User,
        as: 'user',
        where: { role: 'employee' }
      }]
    });

    // Get pending documents count
    const pendingDocuments = await Document.count({
      where: { status: 'pending' }
    });

    // Get pending registrations count
    const pendingRegistrations = await PendingRegistration.count({
      where: { status: 'pending' }
    });

    res.json({
      totalEmployees,
      activeEmployees,
      pendingDocuments,
      pendingRegistrations
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard statistics', 
      details: error.message 
    });
  }
});

// Get recent activities (Admin only)
router.get('/activities', adminAuth, async (req, res) => {
  try {
    // Get recent employees (last 5)
    const recentEmployees = await Employee.findAll({
      include: [{
        model: User,
        as: 'user',
        where: { role: 'employee' },
        attributes: ['email', 'role']
      }],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get recent documents (last 5)
    const recentDocuments = await Document.findAll({
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['firstName', 'lastName', 'employeeId']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      recentEmployees,
      recentDocuments
    });
  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard activities', 
      details: error.message 
    });
  }
});

module.exports = router;