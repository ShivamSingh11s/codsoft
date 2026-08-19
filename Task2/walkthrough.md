# Walkthrough - Contact Management System

The **Contact Management System** backend is fully built, tested, and running locally. It provides a secure, scalable RESTful API with SQLite persistence, input validation, duplicate entry prevention, multi-field search, dynamic sorting, pagination, global error handling, and an interactive Web API Dashboard.

---

## 🌟 Accomplished Features

1. **Express.js & SQLite Architecture**:
   - Scalable, modular folder structure dividing concerns (`models`, `controllers`, `routes`, `middlewares`, `utils`, `config`).
   - SQLite database managed via Sequelize ORM with automatic schema synchronization.

2. **Complete RESTful CRUD APIs**:
   - `POST /api/contacts`: Create new contact.
   - `GET /api/contacts`: Retrieve contacts with search, sorting, and pagination.
   - `GET /api/contacts/:id`: Retrieve single contact by primary key.
   - `PUT /api/contacts/:id`: Update existing contact.
   - `DELETE /api/contacts/:id`: Delete contact record.
   - `GET /api/health`: Health status endpoint.

3. **Advanced Search, Sort & Pagination**:
   - **Search**: `?search=keyword` matches `name`, `email`, `phone`, or `company`.
   - **Sorting**: `?sortBy=field&sortOrder=ASC|DESC` supports sorting by `name`, `email`, `company`, or `createdAt`.
   - **Pagination**: `?page=1&limit=10` calculates `totalItems`, `totalPages`, `hasNextPage`, `hasPrevPage`.

4. **Validation & Duplicate Prevention**:
   - Strict format validation for email addresses, required fields, and phone numbers via `express-validator`.
   - Duplicate prevention middleware ([checkDuplicateContact](file:///c:/Users/Simal/Desktop/CodeSoft/Task2/src/middlewares/validationMiddleware.js#90-136)) checks existing DB entries and returns `409 Conflict` if duplicate email or phone is submitted.

5. **Centralized Error Handling**:
   - Formatted JSON error responses for `400 Bad Request`, `404 Not Found`, `409 Conflict`, and `500 Internal Server Error`.

6. **Interactive Web Dashboard**:
   - Live visual interface served at `http://localhost:5000/`.
   - Real-time search, sorting, pagination, stats counters, contact form modals, and toast alerts.

---

## 🧪 Validation & Automated Test Results

The automated API test suite (`node test-api.js`) executed 12 HTTP assertions against all endpoints and scenarios with **100% PASS rate**:

```bash
🧪 Starting Automated API Verification Test Suite...

✅ SQLite Database connected successfully.
✅ Database models synchronized.
 ✅ PASS: GET /api/health returns 200 OK
 ✅ PASS: POST /api/contacts creates contact record (201 Created)
 ✅ PASS: POST /api/contacts creates second contact (201 Created)
 ✅ PASS: POST /api/contacts prevents duplicate email entry (409 Conflict)
 ✅ PASS: POST /api/contacts prevents duplicate phone entry (409 Conflict)
 ✅ PASS: POST /api/contacts validates invalid email format (400 Bad Request)
 ✅ PASS: GET /api/contacts retrieves contact list with metadata
 ✅ PASS: GET /api/contacts?search=John filters contacts correctly
 ✅ PASS: GET /api/contacts?sortBy=name&sortOrder=ASC sorts alphabetically
 ✅ PASS: GET /api/contacts?page=1&limit=1 paginates properly
 ✅ PASS: PUT /api/contacts/:id updates existing contact
 ✅ PASS: DELETE /api/contacts/:id removes contact

📊 Test Results: 12 Passed, 0 Failed.
🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY!
```

---

## 📁 Directory Structure

```
Task2/
├── package.json               # Dependencies & NPM scripts
├── server.js                  # Express application entry point
├── test-api.js                # Automated HTTP assertion test suite
├── database.sqlite            # SQLite database file
└── src/
    ├── config/
    │   └── database.js        # Sequelize SQLite database connection
    ├── models/
    │   └── Contact.js         # Contact Sequelize model definition
    ├── controllers/
    │   └── contactController.js # CRUD, Search, Sort & Pagination controllers
    ├── routes/
    │   └── contactRoutes.js   # Express routing endpoints
    ├── middlewares/
    │   ├── validationMiddleware.js # Input validation & duplicate checks
    │   └── errorHandler.js    # 404 & Global error handlers
    ├── utils/
    │   └── apiResponse.js     # Standardized JSON response formatting
    └── public/                # Interactive API Web Dashboard
        ├── index.html
        ├── styles.css
        └── app.js
```

---

## 🚀 How to Run the Application

1. **Start the Server**:
   ```bash
   npm start
   ```
2. **Access Web Dashboard**:
   Open [http://localhost:5000](http://localhost:5000) in your web browser.

3. **Run Automated Test Suite**:
   ```bash
   npm test
   ```
