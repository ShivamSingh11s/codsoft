const { body, param } = require('express-validator');
const validate = require('../validate');

const createCourseValidation = [
  body('code')
    .trim()
    .notEmpty().withMessage('Course code is required')
    .isLength({ min: 2, max: 20 }).withMessage('Course code must be between 2 and 20 characters')
    .toUpperCase(),
  body('title')
    .trim()
    .notEmpty().withMessage('Course title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('credits')
    .notEmpty().withMessage('Credits is required')
    .isInt({ min: 1, max: 10 }).withMessage('Credits must be an integer between 1 and 10'),
  body('instructor')
    .trim()
    .notEmpty().withMessage('Instructor name is required'),
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required'),
  body('maxCapacity')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('Max capacity must be between 1 and 500'),
  validate
];

const updateCourseValidation = [
  param('id')
    .isUUID(4).withMessage('Invalid course ID format'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 }).withMessage('Course code must be between 2 and 20 characters')
    .toUpperCase(),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage('Credits must be an integer between 1 and 10'),
  body('instructor')
    .optional()
    .trim()
    .notEmpty().withMessage('Instructor name cannot be empty'),
  body('department')
    .optional()
    .trim()
    .notEmpty().withMessage('Department cannot be empty'),
  body('maxCapacity')
    .optional()
    .isInt({ min: 1, max: 500 }).withMessage('Max capacity must be between 1 and 500'),
  validate
];

const courseIdValidation = [
  param('id')
    .isUUID(4).withMessage('Invalid course ID format'),
  validate
];

module.exports = {
  createCourseValidation,
  updateCourseValidation,
  courseIdValidation
};
