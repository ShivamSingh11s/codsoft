const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  enrollmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('Enrolled', 'Completed', 'Dropped'),
    defaultValue: 'Enrolled'
  },
  grade: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F', 'Pending'),
    defaultValue: 'Pending'
  }
}, {
  tableName: 'enrollments',
  indexes: [
    {
      unique: true,
      fields: ['student_id', 'course_id'],
      name: 'unique_student_course_enrollment'
    }
  ]
});

module.exports = Enrollment;
