const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const {
  createEnrollmentValidation,
  updateEnrollmentValidation,
  enrollmentIdValidation
} = require('../middleware/validators/enrollmentValidator');

// GET /api/enrollments - List all enrollments (search, filter, sort, paginate)
router.get('/', enrollmentController.getAllEnrollments);

// GET /api/enrollments/:id - Get single enrollment record
router.get('/:id', enrollmentIdValidation, enrollmentController.getEnrollmentById);

// POST /api/enrollments - Create enrollment (enroll student in course)
router.post('/', createEnrollmentValidation, enrollmentController.createEnrollment);

// PATCH /api/enrollments/:id - Update enrollment status / grade
router.patch('/:id', updateEnrollmentValidation, enrollmentController.updateEnrollment);

// DELETE /api/enrollments/:id - Delete enrollment (drop student)
router.delete('/:id', enrollmentIdValidation, enrollmentController.deleteEnrollment);

module.exports = router;
