const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { 
  addToPasswordHistory, 
  updatePasswordExpiration 
} = require('../utils/passwordValidation');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [1, 255]
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30],
      is: /^[a-zA-Z0-9_]+$/
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [12, 255] // Increased minimum length
    }
  },
  role: {
    type: DataTypes.ENUM('admin', 'employee', 'superadmin'),
    defaultValue: 'employee'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  passwordChangedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  accountLockedUntil: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = 12; // Increased from default
        user.password = await bcrypt.hash(user.password, saltRounds);
        user.passwordChangedAt = new Date();
        
        // Add to password history
        addToPasswordHistory(user.id, user.password);
        updatePasswordExpiration(user.id);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
        user.passwordChangedAt = new Date();
        
        // Add to password history
        addToPasswordHistory(user.id, user.password);
        updatePasswordExpiration(user.id);
        
        // Reset failed login attempts when password is changed
        user.failedLoginAttempts = 0;
        user.accountLockedUntil = null;
      }
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['role']
    },
    {
      fields: ['isActive']
    }
  ]
});

// Instance methods
User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.prototype.isAccountLocked = function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > new Date());
};

User.prototype.incrementFailedAttempts = async function() {
  // If account is already locked and lock has expired, reset
  if (this.accountLockedUntil && this.accountLockedUntil <= new Date()) {
    return await this.update({
      failedLoginAttempts: 1,
      accountLockedUntil: null
    });
  }
  
  const updates = { failedLoginAttempts: this.failedLoginAttempts + 1 };
  
  // Lock account after 5 failed attempts
  if (updates.failedLoginAttempts >= 5) {
    updates.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return await this.update(updates);
};

User.prototype.resetFailedAttempts = async function() {
  return await this.update({
    failedLoginAttempts: 0,
    accountLockedUntil: null,
    lastLogin: new Date()
  });
};

module.exports = User;