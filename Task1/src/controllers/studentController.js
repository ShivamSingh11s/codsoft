const { Op } = require('sequelize');
const { Student, Course, Enrollment } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationOptions } = require('../utils/pagination');

/**
 * GET /api/students
 * Retrieve all students with search, filtering, sorting, and pagination
 */
const getAllStudents = async (req, res, next) => {
  try {
    const { search, department, status, enrollmentYear } = req.query;
    const allowedSortFields = ['firstName', 'lastName', 'studentIdCode', 'email', 'department', 'enrollmentYear', 'createdAt'];
    const { page, limit, offset, orderOption } = getPaginationOptions(req.query, allowedSortFields);

    const where = {};

    // Search term across firstName, lastName, email, studentIdCode
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { studentIdCode: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by department
    if (department) {
      where.department = department;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by enrollment year
    if (enrollmentYear) {
      where.enrollmentYear = parseInt(enrollmentYear, 10);
    }

    const { count, rows } = await Student.findAndCountAll({
      where,
      limit,
      offset,
      order: orderOption,
      attributes: { exclude: [] }
    });

    const totalPages = Math.ceil(count / limit);

    return paginatedResponse(res, 200, 'Students fetched successfully', rows, {
      totalItems: count,
      totalPages,
      currentPage: page,
      itemsPerPage: limit
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/students/:id
 * Get single student by ID with enrolled courses
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'code', 'title', 'credits', 'instructor', 'department']
            }
          ]
        }
      ]
    });

    if (!student) {
      return errorResponse(res, 404, `Student with ID '${id}' not found`);
    }

    return successResponse(res, 200, 'Student details fetched successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/students
 * Create a new student
 */
const createStudent = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, dateOfBirth, department, enrollmentYear, status, studentIdCode } = req.body;

    // Check if email already exists
    const existingEmail = await Student.findOne({ where: { email } });
    if (existingEmail) {
      return errorResponse(res, 409, `Student with email '${email}' already exists`);
    }

    // Generate studentIdCode if not provided (e.g., STU2026-XXXX)
    let generatedIdCode = studentIdCode;
    if (!generatedIdCode) {
      const count = await Student.count();
      const year = enrollmentYear || new Date().getFullYear();
      generatedIdCode = `STU${year}${String(count + 1).padStart(4, '0')}`;
    } else {
      const existingIdCode = await Student.findOne({ where: { studentIdCode: generatedIdCode } });
      if (existingIdCode) {
        return errorResponse(res, 409, `Student ID Code '${generatedIdCode}' already exists`);
      }
    }

    const student = await Student.create({
      studentIdCode: generatedIdCode,
      firstName,
      lastName,
      email,
      phone: phone || null,
      dateOfBirth,
      department,
      enrollmentYear,
      status: status || 'Active'
    });

    return successResponse(res, 201, 'Student created successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/students/:id
 * Update student record
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, dateOfBirth, department, enrollmentYear, status, studentIdCode } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return errorResponse(res, 404, `Student with ID '${id}' not found`);
    }

    // Check email uniqueness if email is changed
    if (email && email !== student.email) {
      const existingEmail = await Student.findOne({ where: { email } });
      if (existingEmail) {
        return errorResponse(res, 409, `Email '${email}' is already taken by another student`);
      }
    }

    // Check studentIdCode uniqueness if changed
    if (studentIdCode && studentIdCode !== student.studentIdCode) {
      const existingIdCode = await Student.findOne({ where: { studentIdCode } });
      if (existingIdCode) {
        return errorResponse(res, 409, `Student ID Code '${studentIdCode}' is already taken`);
      }
    }

    await student.update({
      firstName: firstName !== undefined ? firstName : student.firstName,
      lastName: lastName !== undefined ? lastName : student.lastName,
      email: email !== undefined ? email : student.email,
      phone: phone !== undefined ? phone : student.phone,
      dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : student.dateOfBirth,
      department: department !== undefined ? department : student.department,
      enrollmentYear: enrollmentYear !== undefined ? enrollmentYear : student.enrollmentYear,
      status: status !== undefined ? status : student.status,
      studentIdCode: studentIdCode !== undefined ? studentIdCode : student.studentIdCode
    });

    return successResponse(res, 200, 'Student updated successfully', student);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/students/:id
 * Delete student record
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return errorResponse(res, 404, `Student with ID '${id}' not found`);
    }

    await student.destroy();

    return successResponse(res, 200, `Student '${student.firstName} ${student.lastName}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
