const { sequelize } = require('../config/database');
const Student = require('./Student');
const Course = require('./Course');
const Enrollment = require('./Enrollment');

// Define Relationships

// 1. Student has many Enrollments
Student.hasMany(Enrollment, {
  foreignKey: 'studentId',
  as: 'enrollments',
  onDelete: 'CASCADE'
});

Enrollment.belongsTo(Student, {
  foreignKey: 'studentId',
  as: 'student'
});

// 2. Course has many Enrollments
Course.hasMany(Enrollment, {
  foreignKey: 'courseId',
  as: 'enrollments',
  onDelete: 'RESTRICT'
});

Enrollment.belongsTo(Course, {
  foreignKey: 'courseId',
  as: 'course'
});

// 3. Many-to-Many Relationship (Student <-> Course)
Student.belongsToMany(Course, {
  through: Enrollment,
  foreignKey: 'studentId',
  otherKey: 'courseId',
  as: 'courses'
});

Course.belongsToMany(Student, {
  through: Enrollment,
  foreignKey: 'courseId',
  otherKey: 'studentId',
  as: 'students'
});

module.exports = {
  sequelize,
  Student,
  Course,
  Enrollment
};
