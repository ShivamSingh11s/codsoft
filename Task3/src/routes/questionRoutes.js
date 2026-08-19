const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.put('/:id', authenticate, requireAdmin, questionController.updateQuestion);
router.delete('/:id', authenticate, requireAdmin, questionController.deleteQuestion);

module.exports = router;
