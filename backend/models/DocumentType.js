const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DocumentType = sequelize.define('DocumentType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'document_categories',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  allowedExtensions: {
    type: DataTypes.JSON,
    defaultValue: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
  },
  maxFileSize: {
    type: DataTypes.INTEGER,
    defaultValue: 5242880 // 5MB in bytes
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'document_types'
});

module.exports = DocumentType;