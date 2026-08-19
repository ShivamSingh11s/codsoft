/**
 * Helper to parse pagination, sorting, and filter params from query string
 */

const getPaginationOptions = (query, allowedSortFields = ['createdAt']) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  // Sorting
  const sortBy = allowedSortFields.includes(query.sortBy) ? query.sortBy : allowedSortFields[0];
  const order = query.order && query.order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  return {
    page,
    limit,
    offset,
    sortBy,
    order,
    orderOption: [[sortBy, order]]
  };
};

module.exports = {
  getPaginationOptions
};
