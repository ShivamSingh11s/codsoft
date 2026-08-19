const { User, Quiz, Question, Option } = require('../models');

async function seedData() {
  try {
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('Database already initialized. Skipping seed.');
      return;
    }

    console.log('Seeding initial data...');

    // 1. Create Default Admin & User Accounts
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@quiz.com',
      password: 'admin123', // hashed by User model hook
      role: 'ADMIN',
    });

    const student = await User.create({
      name: 'Alex Rivera',
      email: 'user@quiz.com',
      password: 'user123',
      role: 'USER',
    });

    console.log(`Created accounts:\n Admin: admin@quiz.com / admin123\n User: user@quiz.com / user123`);

    // 2. Create Quiz 1: Full Stack Web Development Challenge
    const quiz1 = await Quiz.create({
      title: 'Full Stack Web Development Challenge',
      description: 'Test your core knowledge of modern HTTP, REST APIs, JavaScript ES6+, React, and Express backend concepts.',
      category: 'Software Engineering',
      timeLimitMinutes: 5,
      negativeMarking: true,
      negativeMarkValue: 0.25,
      passPercentage: 60.0,
      isRandomized: true,
      isPublished: true,
      createdById: admin.id,
    });

    // Questions for Quiz 1
    const q1_1 = await Question.create({
      quizId: quiz1.id,
      questionText: 'Which HTTP status code indicates a successfully created resource on the server?',
      questionType: 'MULTIPLE_CHOICE',
      marks: 1.0,
      negativeMarks: 0.25,
      explanation: 'HTTP 201 Created is the standard response status code indicating that the request has succeeded and led to the creation of a resource.',
    });
    await Option.bulkCreate([
      { questionId: q1_1.id, optionText: '200 OK', isCorrect: false },
      { questionId: q1_1.id, optionText: '201 Created', isCorrect: true },
      { questionId: q1_1.id, optionText: '204 No Content', isCorrect: false },
      { questionId: q1_1.id, optionText: '301 Moved Permanently', isCorrect: false },
    ]);

    const q1_2 = await Question.create({
      quizId: quiz1.id,
      questionText: 'What is the primary function of JSON Web Tokens (JWT) in RESTful APIs?',
      questionType: 'MULTIPLE_CHOICE',
      marks: 1.0,
      negativeMarks: 0.25,
      explanation: 'JWTs are compact, URL-safe tokens used for stateless authentication and authorization between client and server.',
    });
    await Option.bulkCreate([
      { questionId: q1_2.id, optionText: 'Encrypting database passwords', isCorrect: false },
      { questionId: q1_2.id, optionText: 'Stateless user authentication & secure token verification', isCorrect: true },
      { questionId: q1_2.id, optionText: 'Compressing JSON API responses', isCorrect: false },
      { questionId: q1_2.id, optionText: 'Generating frontend CSS stylesheets', isCorrect: false },
    ]);

    const q1_3 = await Question.create({
      quizId: quiz1.id,
      questionText: 'In JavaScript, the Event Loop prioritizes microtasks (e.g., Promises) over macrotasks (e.g., setTimeout).',
      questionType: 'TRUE_FALSE',
      marks: 1.0,
      negativeMarks: 0.25,
      explanation: 'True. Microtasks (Promise resolvers, process.nextTick) are executed immediately after the current task finishes and before processing the next macrotask (setTimeout, setInterval).',
    });
    await Option.bulkCreate([
      { questionId: q1_3.id, optionText: 'True', isCorrect: true },
      { questionId: q1_3.id, optionText: 'False', isCorrect: false },
    ]);

    const q1_4 = await Question.create({
      quizId: quiz1.id,
      questionText: 'Which Express.js middleware is commonly used to enable Cross-Origin Resource Sharing?',
      questionType: 'MULTIPLE_CHOICE',
      marks: 1.0,
      negativeMarks: 0.25,
      explanation: 'cors middleware handles HTTP OPTIONS preflight requests and adds appropriate Access-Control-Allow-Origin headers.',
    });
    await Option.bulkCreate([
      { questionId: q1_4.id, optionText: 'cors', isCorrect: true },
      { questionId: q1_4.id, optionText: 'helmet', isCorrect: false },
      { questionId: q1_4.id, optionText: 'morgan', isCorrect: false },
      { questionId: q1_4.id, optionText: 'body-parser', isCorrect: false },
    ]);

    // 3. Create Quiz 2: Cybersecurity & Protocol Essentials
    const quiz2 = await Quiz.create({
      title: 'Cybersecurity & Web Protocol Essentials',
      description: 'Master network security fundamentals, CORS, SQL injection prevention, and cryptographic hash functions.',
      category: 'Cybersecurity',
      timeLimitMinutes: 10,
      negativeMarking: true,
      negativeMarkValue: 0.5,
      passPercentage: 70.0,
      isRandomized: true,
      isPublished: true,
      createdById: admin.id,
    });

    const q2_1 = await Question.create({
      quizId: quiz2.id,
      questionText: 'What is the most effective method to prevent SQL Injection vulnerabilities in web applications?',
      questionType: 'MULTIPLE_CHOICE',
      marks: 2.0,
      negativeMarks: 0.5,
      explanation: 'Parameterized queries (prepared statements) ensure user input is treated strictly as data parameters rather than executable SQL commands.',
    });
    await Option.bulkCreate([
      { questionId: q2_1.id, optionText: 'Filtering input strings for quotes manually', isCorrect: false },
      { questionId: q2_1.id, optionText: 'Using Parameterized Queries / Prepared Statements or ORMs', isCorrect: true },
      { questionId: q2_1.id, optionText: 'Encrypting all database records with AES-256', isCorrect: false },
      { questionId: q2_1.id, optionText: 'Disabling SQL database ports on firewall', isCorrect: false },
    ]);

    const q2_2 = await Question.create({
      quizId: quiz2.id,
      questionText: 'Bcrypt is a salted password-hashing function designed to be slow and resistant to brute-force GPU attacks.',
      questionType: 'TRUE_FALSE',
      marks: 1.0,
      negativeMarks: 0.5,
      explanation: 'True. Bcrypt incorporates an adjustable work factor (salt rounds) to intentionally slow down hash calculation.',
    });
    await Option.bulkCreate([
      { questionId: q2_2.id, optionText: 'True', isCorrect: true },
      { questionId: q2_2.id, optionText: 'False', isCorrect: false },
    ]);

    console.log('Seed data successfully loaded.');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

module.exports = seedData;
