const { Op } = require('sequelize');
const { Course, Student, Enrollment } = require('../models');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/apiResponse');
const { getPaginationOptions } = require('../utils/pagination');

/**
 * GET /api/courses
 * Retrieve all courses with search, filtering, sorting, and pagination
 */
const getAllCourses = async (req, res, next) => {
  try {
    const { search, department, credits } = req.query;
    const allowedSortFields = ['code', 'title', 'credits', 'instructor', 'department', 'createdAt'];
    const { page, limit, offset, orderOption } = getPaginationOptions(req.query, allowedSortFields);

    const where = {};

    // Search term across code, title, instructor, description
    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { title: { [Op.like]: `%${search}%` } },
        { instructor: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter by department
    if (department) {
      where.department = department;
    }

    // Filter by credits
    if (credits) {
      where.credits = parseInt(credits, 10);
    }

    const { count, rows } = await Course.findAndCountAll({
      where,
      limit,
      offset,
      order: orderOption,
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          attributes: ['id', 'status']
        }
      ],
      distinct: true
    });

    // Attach active enrolled count to each course object
    const coursesData = rows.map(course => {
      const plain = course.toJSON();
      const enrolledCount = plain.enrollments 
        ? plain.enrollments.filter(e => e.status === 'Enrolled').length 
        : 0;
      return {
        ...plain,
        enrolledCount,
        availableSeats: Math.max(0, plain.maxCapacity - enrolledCount)
      };
    });

    const totalPages = Math.ceil(count / limit);

    return paginatedResponse(res, 200, 'Courses fetched successfully', coursesData, {
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
 * GET /api/courses/:id
 * Get single course details by ID including enrolled students
 */
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id, {
      include: [
        {
          model: Enrollment,
          as: 'enrollments',
          include: [
            {
              model: Student,
              as: 'student',
              attributes: ['id', 'studentIdCode', 'firstName', 'lastName', 'email', 'department']
            }
          ]
        }
      ]
    });

    if (!course) {
      return errorResponse(res, 404, `Course with ID '${id}' not found`);
    }

    const plain = course.toJSON();
    const enrolledCount = plain.enrollments 
      ? plain.enrollments.filter(e => e.status === 'Enrolled').length 
      : 0;

    const responseData = {
      ...plain,
      enrolledCount,
      availableSeats: Math.max(0, plain.maxCapacity - enrolledCount)
    };

    return successResponse(res, 200, 'Course details fetched successfully', responseData);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/courses
 * Create a new course
 */
const createCourse = async (req, res, next) => {
  try {
    const { code, title, description, credits, instructor, department, maxCapacity } = req.body;

    const upperCode = code.toUpperCase();
    const existingCourse = await Course.findOne({ where: { code: upperCode } });
    if (existingCourse) {
      return errorResponse(res, 409, `Course with code '${upperCode}' already exists`);
    }

    const course = await Course.create({
      code: upperCode,
      title,
      description: description || null,
      credits,
      instructor,
      department,
      maxCapacity: maxCapacity || 30
    });

    return successResponse(res, 201, 'Course created successfully', course);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/courses/:id
 * Update course details
 */
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, title, description, credits, instructor, department, maxCapacity } = req.body;

    const course = await Course.findByPk(id);
    if (!course) {
      return errorResponse(res, 404, `Course with ID '${id}' not found`);
    }

    if (code && code.toUpperCase() !== course.code) {
      const upperCode = code.toUpperCase();
      const existingCourse = await Course.findOne({ where: { code: upperCode } });
      if (existingCourse) {
        return errorResponse(res, 409, `Course code '${upperCode}' is already taken`);
      }
    }

    await course.update({
      code: code ? code.toUpperCase() : course.code,
      title: title !== undefined ? title : course.title,
      description: description !== undefined ? description : course.description,
      credits: credits !== undefined ? credits : course.credits,
      instructor: instructor !== undefined ? instructor : course.instructor,
      department: department !== undefined ? department : course.department,
      maxCapacity: maxCapacity !== undefined ? maxCapacity : course.maxCapacity
    });

    return successResponse(res, 200, 'Course updated successfully', course);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/courses/:id
 * Delete course
 */
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByPk(id);
    if (!course) {
      return errorResponse(res, 404, `Course with ID '${id}' not found`);
    }

    const activeEnrollmentCount = await Enrollment.count({
      where: {
        courseId: id,
        status: 'Enrolled'
      }
    });

    if (activeEnrollmentCount > 0) {
      return errorResponse(res, 400, `Cannot delete course '${course.code}' because it has ${activeEnrollmentCount} active student enrollment(s). Please drop or transfer students first.`);
    }

    // Delete associated past/completed enrollments if any
    await Enrollment.destroy({ where: { courseId: id } });
    await course.destroy();

    return successResponse(res, 200, `Course '${course.code} - ${course.title}' deleted successfully`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
