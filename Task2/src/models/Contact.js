const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Name is required' },
      len: { args: [2, 100], msg: 'Name must be between 2 and 100 characters' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'A contact with this email already exists',
    },
    validate: {
      isEmail: { msg: 'Please provide a valid email address' },
      notEmpty: { msg: 'Email is required' },
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'unique_phone',
      msg: 'A contact with this phone number already exists',
    },
    validate: {
      notEmpty: { msg: 'Phone number is required' },
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '',
  },
});

module.exports = Contact;
