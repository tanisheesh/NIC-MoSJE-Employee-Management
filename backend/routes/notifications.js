const express = require('express');
const { Op } = require('sequelize');
const { Notification, NotificationRecipient, Employee, User } = require('../models');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Helper functions for consistent date handling
function isDateMatch(dateToCheck, targetDate) {
  const checkDate = new Date(dateToCheck);
  const target = new Date(targetDate);
  return checkDate.getDate() === target.getDate() &&
         checkDate.getMonth() === target.getMonth();
}

function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear();
}

function calculateYears(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return to.getFullYear() - from.getFullYear();
}

function formatDateOnly(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

function getNextAnniversary(originalDate, fromDate) {
  const original = new Date(originalDate);
  const from = new Date(fromDate);
  
  // Create anniversary for current year
  const anniversary = new Date(from.getFullYear(), original.getMonth(), original.getDate());
  
  // If anniversary has passed this year, get next year's
  if (anniversary < from) {
    anniversary.setFullYear(from.getFullYear() + 1);
  }
  
  return anniversary;
}

function getEventStatus(eventDate, today) {
  const event = new Date(eventDate);
  const todayDate = new Date(today);
  
  // Reset time to compare only dates
  event.setHours(0, 0, 0, 0);
  todayDate.setHours(0, 0, 0, 0);
  
  if (event.getTime() === todayDate.getTime()) {
    return 'today';
  } else if (event < todayDate) {
    return 'passed';
  } else {
    return 'upcoming';
  }
}

// Get notifications for current user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    const whereClause = {};
    const includeClause = [
      {
        model: Employee,
        as: 'employee',
        attributes: ['firstName', 'lastName', 'employeeId']
      }
    ];

    // For regular users, filter by recipients or global notifications
    if (req.user.role !== 'admin') {
      includeClause.push({
        model: User,
        as: 'recipients',
        where: { id: req.user.id },
        through: {
          attributes: ['isRead'],
          where: unreadOnly === 'true' ? { isRead: false } : {}
        },
        required: false
      });
    }

    const offset = (page - 1) * limit;
    
    const { count, rows: notifications } = await Notification.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', auth, async (req, res) => {
  try {
    // Get all notifications for the user
    const notifications = await Notification.findAll();
    
    // Mark all as read for this user
    for (const notification of notifications) {
      await NotificationRecipient.findOrCreate({
        where: {
          notificationId: notification.id,
          userId: req.user.id
        },
        defaults: {
          isRead: true
        }
      }).then(([recipient, created]) => {
        if (!created) {
          recipient.isRead = true;
          return recipient.save();
        }
      });
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Update or create recipient record
    const [recipient, created] = await NotificationRecipient.findOrCreate({
      where: {
        notificationId: req.params.id,
        userId: req.user.id
      },
      defaults: {
        isRead: true
      }
    });

    if (!created) {
      recipient.isRead = true;
      await recipient.save();
    }

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming events (Admin only)
router.get('/upcoming', adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());

    // Get ALL employees regardless of status
    const employees = await Employee.findAll({
      include: [{
        model: User,
        as: 'user',
        where: {
          role: 'employee' // Only include employees, exclude admin and superadmin
        }
      }]
    });
    
    const upcomingEvents = [];

    employees.forEach(employee => {
      // Birthday - for ALL employees
      if (employee.dateOfBirth) {
        const eventDate = getNextAnniversary(employee.dateOfBirth, today);
        if (eventDate >= today && eventDate <= nextMonth) {
          upcomingEvents.push({
            type: 'birthday',
            employee: employee,
            date: eventDate,
            title: `${employee.firstName} ${employee.lastName}'s Birthday`,
            dateOnly: formatDateOnly(employee.dateOfBirth),
            daysUntil: Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24)),
            status: getEventStatus(eventDate, today)
          });
        }
      }

      // Marriage Anniversary - for ALL employees
      if (employee.marriageAnniversary) {
        const eventDate = getNextAnniversary(employee.marriageAnniversary, today);
        if (eventDate >= today && eventDate <= nextMonth) {
          upcomingEvents.push({
            type: 'anniversary',
            employee: employee,
            date: eventDate,
            title: `${employee.firstName} ${employee.lastName}'s Marriage Anniversary`,
            dateOnly: formatDateOnly(employee.marriageAnniversary),
            daysUntil: Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24)),
            status: getEventStatus(eventDate, today)
          });
        }
      }

      // Joining Anniversary - for ALL employees
      if (employee.joiningDate) {
        const eventDate = getNextAnniversary(employee.joiningDate, today);
        const yearsCompleted = calculateYears(employee.joiningDate, eventDate);
        
        if (eventDate >= today && eventDate <= nextMonth && yearsCompleted >= 1) {
          upcomingEvents.push({
            type: 'joining_anniversary',
            employee: employee,
            date: eventDate,
            title: `${employee.firstName} ${employee.lastName}'s ${yearsCompleted} Year Work Anniversary`,
            dateOnly: formatDateOnly(employee.joiningDate),
            daysUntil: Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24)),
            status: getEventStatus(eventDate, today)
          });
        }
      }

      // Leaving Anniversary - for ALL employees who have left
      if (employee.leavingDate) {
        const eventDate = getNextAnniversary(employee.leavingDate, today);
        const yearsSinceLeaving = calculateYears(employee.leavingDate, eventDate);
        
        if (eventDate >= today && eventDate <= nextMonth && yearsSinceLeaving >= 1) {
          upcomingEvents.push({
            type: 'leaving_anniversary',
            employee: employee,
            date: eventDate,
            title: `${yearsSinceLeaving} Years Since ${employee.firstName} ${employee.lastName} Left`,
            dateOnly: formatDateOnly(employee.leavingDate),
            daysUntil: Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24)),
            status: getEventStatus(eventDate, today)
          });
        }
      }
    });

    upcomingEvents.sort((a, b) => a.date - b.date);
    res.json(upcomingEvents);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if there are notifications for today (Admin only)
router.get('/today', adminAuth, async (req, res) => {
  try {
    const today = new Date();

    // Get ALL employees regardless of status
    const employees = await Employee.findAll({
      include: [{
        model: User,
        as: 'user',
        where: {
          role: 'employee'
        }
      }]
    });
    
    const todayEvents = [];

    employees.forEach(employee => {
      // Check birthday - for ALL employees
      if (employee.dateOfBirth && isDateMatch(employee.dateOfBirth, today)) {
        todayEvents.push({
          type: 'birthday',
          employee: employee,
          title: `${employee.firstName} ${employee.lastName}'s Birthday`,
          dateOnly: formatDateOnly(employee.dateOfBirth),
          status: 'today'
        });
      }

      // Check marriage anniversary - for ALL employees
      if (employee.marriageAnniversary && isDateMatch(employee.marriageAnniversary, today)) {
        todayEvents.push({
          type: 'anniversary',
          employee: employee,
          title: `${employee.firstName} ${employee.lastName}'s Marriage Anniversary`,
          dateOnly: formatDateOnly(employee.marriageAnniversary),
          status: 'today'
        });
      }

      // Check joining anniversary - for ALL employees
      if (employee.joiningDate && isDateMatch(employee.joiningDate, today)) {
        const yearsCompleted = calculateYears(employee.joiningDate, today);
        if (yearsCompleted >= 1) {
          todayEvents.push({
            type: 'joining_anniversary',
            employee: employee,
            title: `${employee.firstName} ${employee.lastName}'s ${yearsCompleted} Year Work Anniversary`,
            dateOnly: formatDateOnly(employee.joiningDate),
            status: 'today'
          });
        }
      }

      // Check leaving anniversary - for ALL employees who have left
      if (employee.leavingDate && isDateMatch(employee.leavingDate, today)) {
        const yearsSinceLeaving = calculateYears(employee.leavingDate, today);
        if (yearsSinceLeaving >= 1) {
          todayEvents.push({
            type: 'leaving_anniversary',
            employee: employee,
            title: `${yearsSinceLeaving} Years Since ${employee.firstName} ${employee.lastName} Left`,
            dateOnly: formatDateOnly(employee.leavingDate),
            status: 'today'
          });
        }
      }

      // Check leaving date (for employees leaving today)
      if (employee.leavingDate && isSameDay(employee.leavingDate, today)) {
        todayEvents.push({
          type: 'leaving_date',
          employee: employee,
          title: `${employee.firstName} ${employee.lastName}'s Last Day`,
          dateOnly: formatDateOnly(employee.leavingDate),
          status: 'today'
        });
      }
    });

    res.json({
      hasNotifications: todayEvents.length > 0,
      count: todayEvents.length,
      events: todayEvents
    });
  } catch (error) {
    console.error('Today notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create manual notification (Admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { type, employeeId, title, message, date } = req.body;

    const employee = await Employee.findByPk(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const notification = await Notification.create({
      type,
      employeeId,
      title,
      message,
      date: date || new Date()
    });
    
    const populatedNotification = await Notification.findByPk(notification.id, {
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['firstName', 'lastName', 'employeeId']
      }]
    });

    res.status(201).json(populatedNotification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;