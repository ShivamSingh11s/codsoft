const { Op } = require('sequelize');
const Contact = require('../models/Contact');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * @desc    Create a new contact record
 * @route   POST /api/contacts
 * @access  Public
 */
const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, address, company } = req.body;

    const newContact = await Contact.create({
      name,
      email,
      phone,
      address: address || '',
      company: company || '',
    });

    return successResponse(
      res,
      201,
      'Contact created successfully',
      newContact
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Retrieve all contacts with search, sorting, and pagination
 * @route   GET /api/contacts
 * @access  Public
 */
const getContacts = async (req, res, next) => {
  try {
    const {
      search,
      name,
      email,
      phone,
      company,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = req.query;

    // Build dynamic search/filter query
    const whereConditions = [];

    // Search query matches name, email, OR phone
    if (search && search.trim() !== '') {
      const searchPattern = `%${search.trim()}%`;
      whereConditions.push({
        [Op.or]: [
          { name: { [Op.like]: searchPattern } },
          { email: { [Op.like]: searchPattern } },
          { phone: { [Op.like]: searchPattern } },
          { company: { [Op.like]: searchPattern } },
        ],
      });
    }

    // Specific field filters if provided
    if (name) whereConditions.push({ name: { [Op.like]: `%${name.trim()}%` } });
    if (email) whereConditions.push({ email: { [Op.like]: `%${email.trim()}%` } });
    if (phone) whereConditions.push({ phone: { [Op.like]: `%${phone.trim()}%` } });
    if (company) whereConditions.push({ company: { [Op.like]: `%${company.trim()}%` } });

    const whereClause = whereConditions.length > 0 ? { [Op.and]: whereConditions } : {};

    // Validate allowed sort fields to prevent SQL injection
    const allowedSortFields = ['id', 'name', 'email', 'phone', 'company', 'createdAt', 'updatedAt'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Execute query with pagination and count
    const { count: totalItems, rows: contacts } = await Contact.findAndCountAll({
      where: whereClause,
      order: [[validSortBy, validSortOrder]],
      limit: limitNum,
      offset,
    });

    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const meta = {
      totalItems,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      sortBy: validSortBy,
      sortOrder: validSortOrder,
      searchQuery: search || null,
    };

    return successResponse(
      res,
      200,
      'Contacts retrieved successfully',
      contacts,
      meta
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single contact by ID
 * @route   GET /api/contacts/:id
 * @access  Public
 */
const getContactById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return errorResponse(res, 404, `Contact with ID ${id} not found`);
    }

    return successResponse(res, 200, 'Contact details retrieved', contact);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a contact record
 * @route   PUT /api/contacts/:id
 * @access  Public
 */
const updateContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, company } = req.body;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return errorResponse(res, 404, `Contact with ID ${id} not found`);
    }

    // Update properties if provided
    if (name !== undefined) contact.name = name;
    if (email !== undefined) contact.email = email;
    if (phone !== undefined) contact.phone = phone;
    if (address !== undefined) contact.address = address;
    if (company !== undefined) contact.company = company;

    await contact.save();

    return successResponse(
      res,
      200,
      'Contact updated successfully',
      contact
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a contact record
 * @route   DELETE /api/contacts/:id
 * @access  Public
 */
const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await Contact.findByPk(id);

    if (!contact) {
      return errorResponse(res, 404, `Contact with ID ${id} not found`);
    }

    await contact.destroy();

    return successResponse(
      res,
      200,
      `Contact with ID ${id} deleted successfully`,
      { id: parseInt(id, 10) }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
};
