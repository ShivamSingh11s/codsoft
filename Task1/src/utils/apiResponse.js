/**
 * Standard API Response Structure
 */

const successResponse = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

const paginatedResponse = (res, statusCode = 200, message = 'Success', data = [], pagination = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination: {
      totalItems: pagination.totalItems || 0,
      totalPages: pagination.totalPages || 0,
      currentPage: pagination.currentPage || 1,
      itemsPerPage: pagination.itemsPerPage || 10,
      hasNextPage: pagination.currentPage < pagination.totalPages,
      hasPrevPage: pagination.currentPage > 1
    }
  });
};

const errorResponse = (res, statusCode = 500, message = 'An error occurred', errors = null) => {
  const response = {
    success: false,
    message
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  successResponse,
  paginatedResponse,
  errorResponse
};
