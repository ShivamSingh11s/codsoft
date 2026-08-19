const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'General',
  },
  timeLimitMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 10, // 0 for no limit, or duration in minutes
    allowNull: false,
  },
  negativeMarking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  negativeMarkValue: {
    type: DataTypes.FLOAT,
    defaultValue: 0.25, // default points deducted per wrong answer if negative marking is enabled
  },
  passPercentage: {
    type: DataTypes.FLOAT,
    defaultValue: 60.0,
  },
  isRandomized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Shuffle questions/options on start
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Quiz;
