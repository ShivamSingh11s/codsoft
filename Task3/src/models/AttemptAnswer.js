const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AttemptAnswer = sequelize.define('AttemptAnswer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  attemptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  selectedOptionId: {
    type: DataTypes.INTEGER,
    allowNull: true, // null if user skipped the question
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  marksAwarded: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
}, {
  timestamps: true,
});

module.exports = AttemptAnswer;
