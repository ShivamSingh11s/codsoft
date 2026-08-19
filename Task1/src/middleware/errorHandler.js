const { errorResponse } = require('../utils/apiResponse');

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error caught in middleware:', err);

  // Sequelize Unique Constraint Error (e.g. Email or Course Code already exists)
  if (err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: `${e.path} must be unique. '${e.value}' is already taken.`
    }));
    return errorResponse(res, 409, 'Conflict: Record already exists', errors);
  }

  // Sequelize Foreign Key Constraint Error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, 400, 'Foreign key constraint error. Referenced record does not exist or cannot be deleted.');
  }

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return errorResponse(res, 400, 'Database Validation Error', errors);
  }

  // Custom thrown errors with statusCode
  if (err.statusCode) {
    return errorResponse(res, err.statusCode, err.message, err.errors || null);
  }

  // Generic 500 Internal Server Error
  return errorResponse(res, 500, err.message || 'Internal Server Error');
};

module.exports = errorHandler;
