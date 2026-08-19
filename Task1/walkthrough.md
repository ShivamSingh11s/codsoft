# Walkthrough - Student Record Management API

We have developed a complete backend REST API using **Express.js**, **Node.js**, **SQLite**, and **Sequelize ORM** for managing Students, Courses, and Enrollments, accompanied by a visual interactive Web Dashboard UI.

---

## 🎯 Accomplished Requirements

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Backend Server** | Built with Express.js (Node.js), structured with clean modular architecture (Controllers, Routes, Models, Middleware, Utils). | ✅ Completed |
| **Relational DB Models** | [Student](file:///c:/Users/Simal/Desktop/CodeSoft/Task1/public/app.js#565-576), [Course](file:///c:/Users/Simal/Desktop/CodeSoft/Task1/public/app.js#676-687), and [Enrollment](file:///c:/Users/Simal/Desktop/CodeSoft/Task1/public/app.js#802-859) models defined using Sequelize ORM with foreign keys (`studentId`, `courseId`), unique indexes, cascade rules, and automatic timestamps. | ✅ Completed |
| **Student REST APIs** | Full CRUD (`GET`, `POST`, `PUT`, `DELETE`) at `/api/students`. | ✅ Completed |
| **Course REST APIs** | Full CRUD (`GET`, `POST`, `PUT`, `DELETE`) at `/api/courses` with capacity tracking & duplicate code protection. | ✅ Completed |
| **Enrollment REST APIs** | Full CRUD (`GET`, `POST`, `PATCH`, `DELETE`) at `/api/enrollments` with capacity checking, duplicate enrollment protection, and grade assignment. | ✅ Completed |
| **Data Validation** | Strict request payload validation using `express-validator` middleware for email formatting, date checks, credit range validation, and UUID format enforcement. | ✅ Completed |
| **Search, Filter, Sort & Paginate** | All list endpoints support `search`, `department`, `status`, `grade`, `sortBy`, `order`, `page`, and `limit` query parameters with structured pagination metadata. | ✅ Completed |
| **Error Handling** | Centralized error handler returning proper HTTP status codes (`200`, `201`, `400`, `404`, `409`, `500`) and standard error JSON formats. | ✅ Completed |
| **Seeder Script & Dashboard UI** | Includes `npm run seed` command to populate database with realistic mock data and a web interface at `http://localhost:5000`. | ✅ Completed |

---

## 📁 Key Project Files

- **[server.js](file:///c:/Users/Simal/Desktop/CodeSoft/Task1/server.js)**: Application entry point and server setup.
- **[app.js](file:///c:/Users/Simal/Desktop/CodeSoft/Task1/app.js)**: Express configuration, global middleware, static file serving, and error handling.
- **[src/config/database.js](file:///c:/Users/Simal/Desktop/CodeSoft/Task1/src/config/database.js)**: SQLite & Sequelize database connection setup.
- **`src/models/`**: Sequelize models (`Student.js`, `Course.js`, `Enrollment.js`, `index.js`).
- **`src/controllers/`**: Controller functions (`studentController.js`, `courseController.js`, `enrollmentController.js`).
- **`src/middleware/validators/`**: Input validation schemas powered by `express-validator`.
- **`src/scripts/seed.js`**: Database initialization and seeder script.
- **`public/`**: Modern visual API testing dashboard UI (`index.html`, `styles.css`, `app.js`).
- **`README.md`**: Full documentation with schema details, API reference, and sample payloads.

---

## 🧪 Verification & Results

1. **Database Seeding (`npm run seed`)**:
   Successfully initialized SQLite tables and inserted sample students, courses, and active enrollment records.
2. **Server Execution (`npm start`)**:
   Server running on `http://localhost:5000`.
3. **HTTP API Verification**:
   - `GET /api` -> `200 OK` (Health & API Info)
   - `GET /api/students` -> `200 OK` (Paginated list of 5 students)
   - `GET /api/courses` -> `200 OK` (Paginated list of 5 courses with capacity metadata)
   - `GET /api/enrollments` -> `200 OK` (Paginated list of enrollments with student and course details populated)

---

## 🚀 How to Run the Application

```bash
# 1. Install dependencies
npm install

# 2. Seed database with initial sample data
npm run seed

# 3. Start server
npm start
```

Access the interactive web dashboard at **`http://localhost:5000`** in your browser!
