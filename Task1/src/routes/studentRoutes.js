const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const {
  createStudentValidation,
  updateStudentValidation,
  studentIdValidation
} = require('../middleware/validators/studentValidator');

// GET /api/students - List all students (search, filter, sort, paginate)
router.get('/', studentController.getAllStudents);

// GET /api/students/:id - Get single student by ID
router.get('/:id', studentIdValidation, studentController.getStudentById);

// POST /api/students - Create new student
router.post('/', createStudentValidation, studentController.createStudent);

// PUT /api/students/:id - Update student
router.put('/:id', updateStudentValidation, studentController.updateStudent);

// DELETE /api/students/:id - Delete student
router.delete('/:id', studentIdValidation, studentController.deleteStudent);

module.exports = router;
