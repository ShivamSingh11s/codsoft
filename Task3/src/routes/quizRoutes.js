const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const questionController = require('../controllers/questionController');
const submissionController = require('../controllers/submissionController');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin, requireUser } = require('../middleware/auth');

// Quiz routes
router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuizById);
router.post('/', authenticate, requireAdmin, quizController.createQuiz);
router.put('/:id', authenticate, requireAdmin, quizController.updateQuiz);
router.delete('/:id', authenticate, requireAdmin, quizController.deleteQuiz);

// Quiz execution
router.get('/:id/start', authenticate, quizController.startQuiz);
router.post('/:id/submit', authenticate, submissionController.submitQuiz);

// Nested question route
router.post('/:quizId/questions', authenticate, requireAdmin, questionController.addQuestion);

// Leaderboard for a quiz
router.get('/:id/leaderboard', analyticsController.getQuizLeaderboard);

module.exports = router;
