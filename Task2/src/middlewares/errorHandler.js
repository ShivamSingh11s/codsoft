const { errorResponse } = require('../utils/apiResponse');

// 404 Route Not Found Middleware
const notFoundHandler = (req, res, next) => {
  return errorResponse(res, 404, `Endpoint not found - ${req.originalUrl}`);
};

// Global Error Handling Middleware
const globalErrorHandler = (err, req, res, next) => {
  console.error('🔥 Error caught in Global Handler:', err);

  // Handle Sequelize Validation Errors
  if (err.name === 'SequelizeValidationError') {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return errorResponse(res, 400, 'Validation Error', formattedErrors);
  }

  // Handle Sequelize Unique Constraint Errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path,
      message: `${e.path} must be unique. Record already exists.`,
    }));
    return errorResponse(res, 409, 'Duplicate Record Conflict', formattedErrors);
  }

  // Handle Express Syntax/JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 400, 'Invalid JSON payload format');
  }

  // Fallback Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(
    res,
    statusCode,
    message,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
