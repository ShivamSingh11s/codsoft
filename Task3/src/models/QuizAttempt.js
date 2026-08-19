const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  score: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  totalMarks: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  passed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  timeTakenSeconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  completedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
});

module.exports = QuizAttempt;
