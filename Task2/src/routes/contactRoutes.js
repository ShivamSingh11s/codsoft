const express = require('express');
const router = express.Router();
const {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
} = require('../controllers/contactController');

const {
  validateCreateContact,
  validateUpdateContact,
  checkDuplicateContact,
} = require('../middlewares/validationMiddleware');

/**
 * Contact API Routes
 * Base path: /api/contacts
 */

// GET all contacts (with search, sort, pagination) & POST create contact
router
  .route('/')
  .get(getContacts)
  .post(validateCreateContact, checkDuplicateContact, createContact);

// GET single contact, PUT update contact, DELETE contact
router
  .route('/:id')
  .get(getContactById)
  .put(validateUpdateContact, checkDuplicateContact, updateContact)
  .delete(deleteContact);

module.exports = router;
