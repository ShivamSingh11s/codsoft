const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const {
  createCourseValidation,
  updateCourseValidation,
  courseIdValidation
} = require('../middleware/validators/courseValidator');

// GET /api/courses - List all courses (search, filter, sort, paginate)
router.get('/', courseController.getAllCourses);

// GET /api/courses/:id - Get single course by ID
router.get('/:id', courseIdValidation, courseController.getCourseById);

// POST /api/courses - Create new course
router.post('/', createCourseValidation, courseController.createCourse);

// PUT /api/courses/:id - Update course
router.put('/:id', updateCourseValidation, courseController.updateCourse);

// DELETE /api/courses/:id - Delete course
router.delete('/:id', courseIdValidation, courseController.deleteCourse);

module.exports = router;
