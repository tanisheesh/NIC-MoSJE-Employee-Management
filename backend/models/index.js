const sequelize = require('../config/database');
const User = require('./User');
const Employee = require('./Employee');
const { Notification, NotificationRecipient } = require('./Notification');
const Department = require('./Department');
const Position = require('./Position');
const DocumentCategory = require('./DocumentCategory');
const DocumentType = require('./DocumentType');
const Document = require('./Document');
const PendingRegistration = require('./PendingRegistration');

// Define associations
User.hasOne(Employee, { foreignKey: 'userId', as: 'profile' });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Department and Position relationships
Department.hasMany(Position, { foreignKey: 'departmentId', as: 'positions' });
Position.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// Employee relationships with Department and Position
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'departmentInfo' });
Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });

Employee.belongsTo(Position, { foreignKey: 'positionId', as: 'positionInfo' });
Position.hasMany(Employee, { foreignKey: 'positionId', as: 'employees' });

// Document relationships
DocumentCategory.hasMany(DocumentType, { foreignKey: 'categoryId', as: 'documentTypes' });
DocumentType.belongsTo(DocumentCategory, { foreignKey: 'categoryId', as: 'category' });

Employee.hasMany(Document, { foreignKey: 'employeeId', as: 'documents' });
Document.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

DocumentType.hasMany(Document, { foreignKey: 'documentTypeId', as: 'documents' });
Document.belongsTo(DocumentType, { foreignKey: 'documentTypeId', as: 'documentType' });

User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });

User.hasMany(Document, { foreignKey: 'approvedBy', as: 'approvedDocuments' });
Document.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

// Notification relationships
Employee.hasMany(Notification, { foreignKey: 'employeeId', as: 'notifications' });
Notification.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Many-to-many relationship for notification recipients
User.belongsToMany(Notification, { 
  through: NotificationRecipient, 
  foreignKey: 'userId',
  otherKey: 'notificationId',
  as: 'notifications'
});

Notification.belongsToMany(User, { 
  through: NotificationRecipient, 
  foreignKey: 'notificationId',
  otherKey: 'userId',
  as: 'recipients'
});

// PendingRegistration relationships
User.hasMany(PendingRegistration, { foreignKey: 'approvedBy', as: 'approvedRegistrations' });
PendingRegistration.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

module.exports = {
  sequelize,
  User,
  Employee,
  Notification,
  NotificationRecipient,
  Department,
  Position,
  DocumentCategory,
  DocumentType,
  Document,
  PendingRegistration
};