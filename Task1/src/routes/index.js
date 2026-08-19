const express = require('express');
const router = express.Router();
const studentRoutes = require('./studentRoutes');
const courseRoutes = require('./courseRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');

// API Health Check & Info
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Student Record Management API',
    version: '1.0.0',
    endpoints: {
      students: '/api/students',
      courses: '/api/courses',
      enrollments: '/api/enrollments'
    }
  });
});

// Mount Routes
router.use('/students', studentRoutes);
router.use('/courses', courseRoutes);
router.use('/enrollments', enrollmentRoutes);

module.exports = router;
