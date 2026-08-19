const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  questionType: {
    type: DataTypes.ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE'),
    defaultValue: 'MULTIPLE_CHOICE',
  },
  marks: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
    allowNull: false,
  },
  negativeMarks: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0, // Specific question-level negative mark override
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = Question;
