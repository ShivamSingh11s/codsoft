const { body, param } = require('express-validator');
const validate = require('../validate');

const createStudentValidation = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage('Invalid phone number format'),
  body('dateOfBirth')
    .notEmpty().withMessage('Date of birth is required')
    .isISO8601().withMessage('Date of birth must be a valid date format (YYYY-MM-DD)'),
  body('department')
    .trim()
    .notEmpty().withMessage('Department is required'),
  body('enrollmentYear')
    .notEmpty().withMessage('Enrollment year is required')
    .isInt({ min: 2000, max: 2100 }).withMessage('Enrollment year must be a 4-digit year between 2000 and 2100'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Graduated', 'Suspended']).withMessage('Status must be Active, Inactive, Graduated, or Suspended'),
  validate
];

const updateStudentValidation = [
  param('id')
    .isUUID(4).withMessage('Invalid student ID format'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/).withMessage('Invalid phone number format'),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('Date of birth must be a valid date format (YYYY-MM-DD)'),
  body('department')
    .optional()
    .trim()
    .notEmpty().withMessage('Department cannot be empty'),
  body('enrollmentYear')
    .optional()
    .isInt({ min: 2000, max: 2100 }).withMessage('Enrollment year must be between 2000 and 2100'),
  body('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Graduated', 'Suspended']).withMessage('Status must be Active, Inactive, Graduated, or Suspended'),
  validate
];

const studentIdValidation = [
  param('id')
    .isUUID(4).withMessage('Invalid student ID format'),
  validate
];

module.exports = {
  createStudentValidation,
  updateStudentValidation,
  studentIdValidation
};
