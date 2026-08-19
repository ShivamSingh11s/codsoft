const sequelize = require('../config/database');
const User = require('./User');
const Quiz = require('./Quiz');
const Question = require('./Question');
const Option = require('./Option');
const QuizAttempt = require('./QuizAttempt');
const AttemptAnswer = require('./AttemptAnswer');

// User & Quiz
User.hasMany(Quiz, { foreignKey: 'createdById', as: 'createdQuizzes' });
Quiz.belongsTo(User, { foreignKey: 'createdById', as: 'creator' });

// Quiz & Question
Quiz.hasMany(Question, { foreignKey: 'quizId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Quiz, { foreignKey: 'quizId' });

// Question & Option
Question.hasMany(Option, { foreignKey: 'questionId', as: 'options', onDelete: 'CASCADE' });
Option.belongsTo(Question, { foreignKey: 'questionId' });

// User & QuizAttempt
User.hasMany(QuizAttempt, { foreignKey: 'userId', as: 'attempts' });
QuizAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Quiz & QuizAttempt
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

// QuizAttempt & AttemptAnswer
QuizAttempt.hasMany(AttemptAnswer, { foreignKey: 'attemptId', as: 'answers', onDelete: 'CASCADE' });
AttemptAnswer.belongsTo(QuizAttempt, { foreignKey: 'attemptId' });

// Question & AttemptAnswer
Question.hasMany(AttemptAnswer, { foreignKey: 'questionId' });
AttemptAnswer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

// Option & AttemptAnswer
Option.hasMany(AttemptAnswer, { foreignKey: 'selectedOptionId' });
AttemptAnswer.belongsTo(Option, { foreignKey: 'selectedOptionId', as: 'selectedOption' });

module.exports = {
  sequelize,
  User,
  Quiz,
  Question,
  Option,
  QuizAttempt,
  AttemptAnswer,
};
