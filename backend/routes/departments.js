const express = require('express');
const { Department, Position } = require('../models');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all departments
router.get('/', adminAuth, async (req, res) => {
  try {
    const departments = await Department.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get department by ID with positions
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [{
        model: Position,
        as: 'positions',
        where: { isActive: true },
        required: false
      }]
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create department
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    const department = await Department.create({
      name,
      description
    });
    
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update department
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    await department.update({
      name,
      description,
      isActive
    });
    
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete department
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Soft delete by setting isActive to false
    await department.update({ isActive: false });
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;