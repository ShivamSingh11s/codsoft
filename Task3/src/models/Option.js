const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Option = sequelize.define('Option', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  optionText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = Option;
