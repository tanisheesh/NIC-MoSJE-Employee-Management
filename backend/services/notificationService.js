const cron = require('node-cron');
const { Employee, Notification, NotificationRecipient, User } = require('../models');

class NotificationService {
  static init() {
    console.log('Notification service initialized');
    this.startCronJobs();
  }

  static startCronJobs() {
    // Run daily at 9 AM to check for upcoming events
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily notification check...');
      await this.checkUpcomingEvents();
    });

    console.log('✅ Notification cron jobs started');
  }

  static async checkUpcomingEvents() {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get ALL employees regardless of status
      const employees = await Employee.findAll();
      
      const adminUsers = await User.findAll({ 
        where: { role: 'admin' }
      });

      for (const employee of employees) {
        // Check birthday - for ALL employees
        if (employee.dateOfBirth) {
          if (this.isDateMatch(employee.dateOfBirth, tomorrow)) {
            await this.createNotification({
              type: 'birthday',
              employeeId: employee.id,
              title: `Birthday Tomorrow: ${employee.firstName} ${employee.lastName}`,
              message: `${employee.firstName} ${employee.lastName} has a birthday tomorrow (${this.formatDateOnly(employee.dateOfBirth)})`,
              date: tomorrow,
              recipients: adminUsers
            });
          }
        }

        // Check marriage anniversary - for ALL employees
        if (employee.marriageAnniversary) {
          if (this.isDateMatch(employee.marriageAnniversary, tomorrow)) {
            await this.createNotification({
              type: 'anniversary',
              employeeId: employee.id,
              title: `Anniversary Tomorrow: ${employee.firstName} ${employee.lastName}`,
              message: `${employee.firstName} ${employee.lastName} has a marriage anniversary tomorrow (${this.formatDateOnly(employee.marriageAnniversary)})`,
              date: tomorrow,
              recipients: adminUsers
            });
          }
        }

        // Check joining anniversary - for ALL employees
        if (employee.joiningDate) {
          if (this.isDateMatch(employee.joiningDate, tomorrow)) {
            const yearsCompleted = this.calculateYears(employee.joiningDate, tomorrow);
            if (yearsCompleted >= 1) {
              await this.createNotification({
                type: 'joining_anniversary',
                employeeId: employee.id,
                title: `Work Anniversary Tomorrow: ${employee.firstName} ${employee.lastName}`,
                message: `${employee.firstName} ${employee.lastName} completes ${yearsCompleted} years with the organization tomorrow (${this.formatDateOnly(employee.joiningDate)})`,
                date: tomorrow,
                recipients: adminUsers
              });
            }
          }
        }

        // Check leaving anniversary - for ALL employees who have left
        if (employee.leavingDate) {
          if (this.isDateMatch(employee.leavingDate, tomorrow)) {
            const yearsSinceLeaving = this.calculateYears(employee.leavingDate, tomorrow);
            if (yearsSinceLeaving >= 1) {
              await this.createNotification({
                type: 'leaving_anniversary',
                employeeId: employee.id,
                title: `Leaving Anniversary Tomorrow: ${employee.firstName} ${employee.lastName}`,
                message: `It's been ${yearsSinceLeaving} years since ${employee.firstName} ${employee.lastName} left the organization (${this.formatDateOnly(employee.leavingDate)})`,
                date: tomorrow,
                recipients: adminUsers
              });
            }
          }

          // Check leaving reminder (7 days before)
          const reminderDate = new Date(employee.leavingDate);
          reminderDate.setDate(reminderDate.getDate() - 7);
          
          if (this.isSameDay(reminderDate, today)) {
            await this.createNotification({
              type: 'leaving_reminder',
              employeeId: employee.id,
              title: `Leaving Reminder: ${employee.firstName} ${employee.lastName}`,
              message: `${employee.firstName} ${employee.lastName} is scheduled to leave in 7 days (${this.formatDateOnly(employee.leavingDate)})`,
              date: today,
              recipients: adminUsers
            });
          }
          
          // Check actual leaving date
          if (this.isSameDay(employee.leavingDate, tomorrow)) {
            await this.createNotification({
              type: 'leaving_date',
              employeeId: employee.id,
              title: `Last Day Tomorrow: ${employee.firstName} ${employee.lastName}`,
              message: `Tomorrow is ${employee.firstName} ${employee.lastName}'s last day with the organization (${this.formatDateOnly(employee.leavingDate)})`,
              date: tomorrow,
              recipients: adminUsers
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking upcoming events:', error);
    }
  }

  static async createNotification(notificationData) {
    try {
      // Check if notification already exists for today
      const existingNotification = await Notification.findOne({
        where: {
          type: notificationData.type,
          employeeId: notificationData.employeeId,
          date: {
            [require('sequelize').Op.gte]: new Date(notificationData.date.getFullYear(), notificationData.date.getMonth(), notificationData.date.getDate()),
            [require('sequelize').Op.lt]: new Date(notificationData.date.getFullYear(), notificationData.date.getMonth(), notificationData.date.getDate() + 1)
          }
        }
      });

      if (!existingNotification) {
        const notification = await Notification.create({
          type: notificationData.type,
          employeeId: notificationData.employeeId,
          title: notificationData.title,
          message: notificationData.message,
          date: notificationData.date
        });

        // Create recipient records
        for (const user of notificationData.recipients) {
          await NotificationRecipient.create({
            notificationId: notification.id,
            userId: user.id,
            isRead: false
          });
        }

        console.log(`Created notification: ${notificationData.title}`);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  // Simple date matching - only check day and month
  static isDateMatch(dateToCheck, targetDate) {
    const checkDate = new Date(dateToCheck);
    return checkDate.getDate() === targetDate.getDate() &&
           checkDate.getMonth() === targetDate.getMonth();
  }

  static isSameDay(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  }

  // Simple year calculation
  static calculateYears(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return to.getFullYear() - from.getFullYear();
  }

  // Format date as DD/MM only
  static formatDateOnly(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }
}

module.exports = NotificationService;