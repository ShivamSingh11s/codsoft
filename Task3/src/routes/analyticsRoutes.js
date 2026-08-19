const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/user', authenticate, analyticsController.getUserStats);
router.get('/admin', authenticate, requireAdmin, analyticsController.getAdminStats);

module.exports = router;
