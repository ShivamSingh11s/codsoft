const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentIdCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  enrollmentYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2000,
      max: 2100
    }
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive', 'Graduated', 'Suspended'),
    defaultValue: 'Active'
  }
}, {
  tableName: 'students',
  getterMethods: {
    fullName() {
      return `${this.firstName} ${this.lastName}`;
    }
  }
});

module.exports = Student;
