const { Op } = require('sequelize');
const { Enrollment, Student, Course } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationOptions } = require('../utils/pagination');

/**
 * GET /api/enrollments
 * Retrieve all enrollments with search, filtering, sorting, and pagination
 */
const getAllEnrollments = async (req, res, next) => {
  try {
    const { studentId, courseId, status, grade, search } = req.query;
    const allowedSortFields = ['enrollmentDate', 'status', 'grade', 'createdAt'];
    const { page, limit, offset, orderOption } = getPaginationOptions(req.query, allowedSortFields);

    const where = {};

    if (studentId) where.studentId = studentId;
    if (courseId) where.courseId = courseId;
    if (status) where.status = status;
    if (grade) where.grade = grade;

    const studentWhere = {};
    const courseWhere = {};

    if (search) {
      studentWhere[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { studentIdCode: { [Op.like]: `%${search}%` } }
      ];
      courseWhere[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Enrollment.findAndCountAll({
      where,
      limit,
      offset,
      order: orderOption,
      include: [
        {
          model: Student,
          as: 'student',
          where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,
          attributes: ['id', 'studentIdCode', 'firstName', 'lastName', 'email', 'department', 'status']
        },
        {
          model: Course,
          as: 'course',
          where: Object.keys(courseWhere).length > 0 ? courseWhere : undefined,
          attributes: ['id', 'code', 'title', 'credits', 'instructor', 'department']
        }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    return paginatedResponse(res, 200, 'Enrollments fetched successfully', rows, {
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
 * GET /api/enrollments/:id
 * Get single enrollment by ID
 */
const getEnrollmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id, {
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'studentIdCode', 'firstName', 'lastName', 'email', 'department', 'status']
        },
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'code', 'title', 'credits', 'instructor', 'department']
        }
      ]
    });

    if (!enrollment) {
      return errorResponse(res, 404, `Enrollment record with ID '${id}' not found`);
    }

    return successResponse(res, 200, 'Enrollment details fetched successfully', enrollment);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/enrollments
 * Create a new enrollment (Enroll a student in a course)
 */
const createEnrollment = async (req, res, next) => {
  try {
    const { studentId, courseId, status, grade } = req.body;

    // 1. Verify Student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return errorResponse(res, 404, `Student with ID '${studentId}' does not exist`);
    }

    if (student.status !== 'Active') {
      return errorResponse(res, 400, `Cannot enroll student '${student.firstName} ${student.lastName}' because student status is '${student.status}'. Student must be Active.`);
    }

    // 2. Verify Course exists
    const course = await Course.findByPk(courseId);
    if (!course) {
      return errorResponse(res, 404, `Course with ID '${courseId}' does not exist`);
    }

    // 3. Check for existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      where: { studentId, courseId }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'Enrolled') {
        return errorResponse(res, 409, `Student '${student.firstName} ${student.lastName}' is already actively enrolled in course '${course.code} - ${course.title}'`);
      }
      // Re-enroll if previously dropped
      await existingEnrollment.update({
        status: status || 'Enrolled',
        grade: grade || 'Pending',
        enrollmentDate: new Date()
      });
      return successResponse(res, 200, `Student re-enrolled in course '${course.code}' successfully`, existingEnrollment);
    }

    // 4. Check Course Capacity
    const activeEnrolledCount = await Enrollment.count({
      where: {
        courseId,
        status: 'Enrolled'
      }
    });

    if (activeEnrolledCount >= course.maxCapacity) {
      return errorResponse(res, 400, `Cannot enroll. Course '${course.code}' has reached maximum capacity (${course.maxCapacity}/${course.maxCapacity})`);
    }

    // 5. Create Enrollment
    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      status: status || 'Enrolled',
      grade: grade || 'Pending',
      enrollmentDate: new Date()
    });

    const populatedEnrollment = await Enrollment.findByPk(enrollment.id, {
      include: [
        { model: Student, as: 'student', attributes: ['id', 'studentIdCode', 'firstName', 'lastName', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'code', 'title', 'credits'] }
      ]
    });

    return successResponse(res, 201, 'Student enrolled in course successfully', populatedEnrollment);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/enrollments/:id
 * Update enrollment status and/or grade
 */
const updateEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, grade } = req.body;

    const enrollment = await Enrollment.findByPk(id, {
      include: [
        { model: Student, as: 'student', attributes: ['id', 'firstName', 'lastName'] },
        { model: Course, as: 'course', attributes: ['id', 'code', 'title'] }
      ]
    });

    if (!enrollment) {
      return errorResponse(res, 404, `Enrollment record with ID '${id}' not found`);
    }

    await enrollment.update({
      status: status !== undefined ? status : enrollment.status,
      grade: grade !== undefined ? grade : enrollment.grade
    });

    return successResponse(res, 200, 'Enrollment updated successfully', enrollment);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/enrollments/:id
 * Delete / drop enrollment
 */
const deleteEnrollment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const enrollment = await Enrollment.findByPk(id);
    if (!enrollment) {
      return errorResponse(res, 404, `Enrollment record with ID '${id}' not found`);
    }

    await enrollment.destroy();

    return successResponse(res, 200, 'Enrollment record deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment
};
