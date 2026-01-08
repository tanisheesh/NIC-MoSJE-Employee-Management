const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 3],
      isNumeric: true
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  personalEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmailOrEmpty(value) {
        if (value && value.trim() !== '' && !/.+@.+\..+/.test(value)) {
          throw new Error('Must be a valid email address');
        }
      }
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  leavingDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  marriageAnniversary: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  // Address fields
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  landmark: {
    type: DataTypes.STRING,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  district: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pincode: {
    type: DataTypes.STRING(6),
    allowNull: true,
    validate: {
      len: [6, 6],
      isNumeric: true
    }
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    }
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false
  },
  positionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'positions',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'retired'),
    defaultValue: 'active'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'employees',
  hooks: {
    beforeUpdate: (employee, options) => {
      // Convert empty strings to null for optional fields
      const optionalFields = ['personalEmail', 'dateOfBirth', 'marriageAnniversary', 'address', 'landmark', 'city', 'district', 'state', 'pincode'];
      optionalFields.forEach(field => {
        if (employee.dataValues[field] === '') {
          employee.dataValues[field] = null;
        }
      });
    },
    beforeCreate: (employee, options) => {
      // Convert empty strings to null for optional fields
      const optionalFields = ['personalEmail', 'dateOfBirth', 'marriageAnniversary', 'address', 'landmark', 'city', 'district', 'state', 'pincode'];
      optionalFields.forEach(field => {
        if (employee.dataValues[field] === '') {
          employee.dataValues[field] = null;
        }
      });
    }
  }
});

module.exports = Employee;