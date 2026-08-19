const { sequelize, Student, Course, Enrollment } = require('../models');

const seedData = async () => {
  try {
    console.log('🔄 Syncing database tables...');
    await sequelize.sync({ force: true });
    console.log('✅ Tables created.');

    console.log('🌱 Seeding Students...');
    const students = await Student.bulkCreate([
      {
        studentIdCode: 'STU20260001',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@university.edu',
        phone: '+1-555-0192',
        dateOfBirth: '2002-04-14',
        department: 'Computer Science',
        enrollmentYear: 2024,
        status: 'Active'
      },
      {
        studentIdCode: 'STU20260002',
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob.smith@university.edu',
        phone: '+1-555-0183',
        dateOfBirth: '2001-11-22',
        department: 'Computer Science',
        enrollmentYear: 2023,
        status: 'Active'
      },
      {
        studentIdCode: 'STU20260003',
        firstName: 'Carol',
        lastName: 'Davis',
        email: 'carol.davis@university.edu',
        phone: '+1-555-0174',
        dateOfBirth: '2003-01-09',
        department: 'Electrical Engineering',
        enrollmentYear: 2025,
        status: 'Active'
      },
      {
        studentIdCode: 'STU20260004',
        firstName: 'David',
        lastName: 'Miller',
        email: 'david.miller@university.edu',
        phone: '+1-555-0165',
        dateOfBirth: '2000-08-30',
        department: 'Mathematics',
        enrollmentYear: 2022,
        status: 'Graduated'
      },
      {
        studentIdCode: 'STU20260005',
        firstName: 'Eva',
        lastName: 'Wilson',
        email: 'eva.wilson@university.edu',
        phone: '+1-555-0156',
        dateOfBirth: '2002-06-18',
        department: 'Business Administration',
        enrollmentYear: 2024,
        status: 'Active'
      }
    ]);
    console.log(`✅ Seeded ${students.length} students.`);

    console.log('🌱 Seeding Courses...');
    const courses = await Course.bulkCreate([
      {
        code: 'CS101',
        title: 'Introduction to Computer Science',
        description: 'Fundamental concepts of programming, algorithms, and data structures using JavaScript and Python.',
        credits: 4,
        instructor: 'Dr. Alan Turing',
        department: 'Computer Science',
        maxCapacity: 30
      },
      {
        code: 'CS302',
        title: 'Database Management Systems',
        description: 'Relational database design, SQL querying, schema normalization, indexing, and ORM usage.',
        credits: 3,
        instructor: 'Prof. Grace Hopper',
        department: 'Computer Science',
        maxCapacity: 25
      },
      {
        code: 'EE201',
        title: 'Digital Electronics & Logic Design',
        description: 'Boolean algebra, logic gates, combinational and sequential circuit design.',
        credits: 4,
        instructor: 'Dr. Nikola Tesla',
        department: 'Electrical Engineering',
        maxCapacity: 20
      },
      {
        code: 'MATH205',
        title: 'Linear Algebra & Calculus III',
        description: 'Vector spaces, matrices, eigenvalues, multi-variable calculus, and differential equations.',
        credits: 3,
        instructor: 'Dr. Emmy Noether',
        department: 'Mathematics',
        maxCapacity: 40
      },
      {
        code: 'BUS110',
        title: 'Principles of Business Management',
        description: 'Introduction to organizational leadership, corporate finance, marketing strategies, and ethics.',
        credits: 3,
        instructor: 'Prof. Peter Drucker',
        department: 'Business Administration',
        maxCapacity: 35
      }
    ]);
    console.log(`✅ Seeded ${courses.length} courses.`);

    console.log('🌱 Seeding Enrollments...');
    const alice = students[0];
    const bob = students[1];
    const carol = students[2];
    const eva = students[4];

    const cs101 = courses[0];
    const cs302 = courses[1];
    const ee201 = courses[2];
    const math205 = courses[3];
    const bus110 = courses[4];

    await Enrollment.bulkCreate([
      {
        studentId: alice.id,
        courseId: cs101.id,
        enrollmentDate: '2026-01-10',
        status: 'Enrolled',
        grade: 'A'
      },
      {
        studentId: alice.id,
        courseId: cs302.id,
        enrollmentDate: '2026-01-12',
        status: 'Enrolled',
        grade: 'Pending'
      },
      {
        studentId: bob.id,
        courseId: cs101.id,
        enrollmentDate: '2026-01-11',
        status: 'Enrolled',
        grade: 'B'
      },
      {
        studentId: bob.id,
        courseId: math205.id,
        enrollmentDate: '2026-01-14',
        status: 'Enrolled',
        grade: 'Pending'
      },
      {
        studentId: carol.id,
        courseId: ee201.id,
        enrollmentDate: '2026-01-15',
        status: 'Enrolled',
        grade: 'Pending'
      },
      {
        studentId: eva.id,
        courseId: bus110.id,
        enrollmentDate: '2026-01-16',
        status: 'Enrolled',
        grade: 'A'
      }
    ]);
    console.log('✅ Seeded enrollments.');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
