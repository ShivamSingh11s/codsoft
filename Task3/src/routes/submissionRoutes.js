const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

router.get('/my-history', authenticate, submissionController.getUserHistory);
router.get('/:id/result', authenticate, submissionController.getAttemptResult);
router.get('/:id/certificate', authenticate, analyticsController.getCertificate);

module.exports = router;
