const express = require('express');
const { Position, Department } = require('../models');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all positions
router.get('/', adminAuth, async (req, res) => {
  try {
    const { departmentId } = req.query;
    
    const whereClause = { isActive: true };
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    
    const positions = await Position.findAll({
      where: whereClause,
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }],
      order: [['title', 'ASC']]
    });
    
    res.json(positions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get position by ID
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });
    
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    
    res.json(position);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create position
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, departmentId, description } = req.body;
    
    const position = await Position.create({
      title,
      departmentId: departmentId || null, // null for common positions
      description
    });
    
    const populatedPosition = await Position.findByPk(position.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });
    
    res.status(201).json(populatedPosition);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update position
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, departmentId, description, isActive } = req.body;
    
    const position = await Position.findByPk(req.params.id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    
    await position.update({
      title,
      departmentId: departmentId || null,
      description,
      isActive
    });
    
    const updatedPosition = await Position.findByPk(position.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      }]
    });
    
    res.json(updatedPosition);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete position
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id);
    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }
    
    // Soft delete by setting isActive to false
    await position.update({ isActive: false });
    
    res.json({ message: 'Position deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;