const { body, param } = require('express-validator');
const validate = require('../validate');

const createEnrollmentValidation = [
  body('studentId')
    .notEmpty().withMessage('Student ID is required')
    .isUUID(4).withMessage('Student ID must be a valid UUID'),
  body('courseId')
    .notEmpty().withMessage('Course ID is required')
    .isUUID(4).withMessage('Course ID must be a valid UUID'),
  body('status')
    .optional()
    .isIn(['Enrolled', 'Completed', 'Dropped']).withMessage('Status must be Enrolled, Completed, or Dropped'),
  body('grade')
    .optional()
    .isIn(['A', 'B', 'C', 'D', 'F', 'Pending']).withMessage('Grade must be A, B, C, D, F, or Pending'),
  validate
];

const updateEnrollmentValidation = [
  param('id')
    .isUUID(4).withMessage('Invalid enrollment ID format'),
  body('status')
    .optional()
    .isIn(['Enrolled', 'Completed', 'Dropped']).withMessage('Status must be Enrolled, Completed, or Dropped'),
  body('grade')
    .optional()
    .isIn(['A', 'B', 'C', 'D', 'F', 'Pending']).withMessage('Grade must be A, B, C, D, F, or Pending'),
  validate
];

const enrollmentIdValidation = [
  param('id')
    .isUUID(4).withMessage('Invalid enrollment ID format'),
  validate
];

module.exports = {
  createEnrollmentValidation,
  updateEnrollmentValidation,
  enrollmentIdValidation
};
