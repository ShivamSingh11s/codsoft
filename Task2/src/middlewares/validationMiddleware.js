const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Contact = require('../models/Contact');
const { errorResponse } = require('../utils/apiResponse');

// Middleware to handle validation result errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return errorResponse(res, 400, 'Input validation failed', formattedErrors);
  }
  next();
};

// Validation rules for creating a contact
const validateCreateContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Please enter a valid phone number'),

  body('address')
    .optional()
    .trim(),

  body('company')
    .optional()
    .trim(),

  handleValidationErrors,
];

// Validation rules for updating a contact
const validateUpdateContact = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Phone number cannot be empty')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/)
    .withMessage('Please enter a valid phone number'),

  body('address')
    .optional()
    .trim(),

  body('company')
    .optional()
    .trim(),

  handleValidationErrors,
];

// Middleware to prevent duplicate contact entries by email or phone
const checkDuplicateContact = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    const contactId = req.params.id; // Present during UPDATE, undefined during CREATE

    if (!email && !phone) return next();

    const whereConditions = [];
    if (email) whereConditions.push({ email });
    if (phone) whereConditions.push({ phone });

    let duplicateQuery = {
      [Op.or]: whereConditions,
    };

    // If updating, exclude current contact from duplicate check
    if (contactId) {
      duplicateQuery = {
        [Op.and]: [
          { id: { [Op.ne]: contactId } },
          { [Op.or]: whereConditions },
        ],
      };
    }

    const existingContact = await Contact.findOne({ where: duplicateQuery });

    if (existingContact) {
      if (email && existingContact.email.toLowerCase() === email.toLowerCase()) {
        return errorResponse(res, 409, 'Duplicate Entry', [
          { field: 'email', message: `Contact with email '${email}' already exists.` },
        ]);
      }
      if (phone && existingContact.phone === phone) {
        return errorResponse(res, 409, 'Duplicate Entry', [
          { field: 'phone', message: `Contact with phone number '${phone}' already exists.` },
        ]);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCreateContact,
  validateUpdateContact,
  checkDuplicateContact,
};
