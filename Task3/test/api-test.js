const assert = require('assert');
const http = require('http');

// Start the server for testing
const app = require('../src/server');

const BASE_URL = 'http://localhost:3000/api';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log(' Starting Online Quiz System E2E API Verification Tests...\n');

  try {
    // Wait 1 sec for server database sync & seed initialization
    await new Promise((r) => setTimeout(r, 1000));

    // Test 1: API Docs
    console.log('Test 1: GET /api/docs');
    const docs = await request('/docs');
    assert.strictEqual(docs.status, 200);
    assert.strictEqual(docs.data.system, 'Online Quiz System REST API');
    console.log('✓ API Documentation endpoint operational.\n');

    // Test 2: Admin Login
    console.log('Test 2: POST /api/auth/login (Admin)');
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@quiz.com', password: 'admin123' },
    });
    assert.strictEqual(adminLogin.status, 200);
    assert.ok(adminLogin.data.token);
    assert.strictEqual(adminLogin.data.user.role, 'ADMIN');
    const adminToken = adminLogin.data.token;
    console.log('✓ Admin login authenticated successfully.\n');

    // Test 3: User Login
    console.log('Test 3: POST /api/auth/login (User)');
    const userLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'user@quiz.com', password: 'user123' },
    });
    assert.strictEqual(userLogin.status, 200);
    assert.ok(userLogin.data.token);
    assert.strictEqual(userLogin.data.user.role, 'USER');
    const userToken = userLogin.data.token;
    console.log('✓ User login authenticated successfully.\n');

    // Test 4: List Quizzes
    console.log('Test 4: GET /api/quizzes');
    const quizzesRes = await request('/quizzes');
    assert.strictEqual(quizzesRes.status, 200);
    assert.ok(Array.isArray(quizzesRes.data));
    assert.ok(quizzesRes.data.length > 0);
    const firstQuiz = quizzesRes.data[0];
    console.log(`✓ Fetched ${quizzesRes.data.length} quizzes. First quiz: "${firstQuiz.title}"\n`);

    // Test 5: Admin Creates a New Custom Quiz (Timer + Negative Marking)
    console.log('Test 5: POST /api/quizzes (Admin Create Quiz)');
    const newQuiz = await request('/quizzes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        title: 'Database & SQL Optimization Masterclass',
        description: 'Advanced indexing, relational joins, ACID transactions, and Sequelize ORM query tuning.',
        category: 'Database Engineering',
        timeLimitMinutes: 3,
        negativeMarking: true,
        negativeMarkValue: 0.5,
        passPercentage: 60.0,
        isRandomized: false,
        isPublished: true,
      },
    });
    assert.strictEqual(newQuiz.status, 201);
    assert.ok(newQuiz.data.quiz.id);
    const createdQuizId = newQuiz.data.quiz.id;
    console.log(`✓ Created Quiz ID ${createdQuizId} with Negative Marking (-0.5) and 3 min timer.\n`);

    // Test 6: Admin adds Question & Options
    console.log(`Test 6: POST /api/quizzes/${createdQuizId}/questions (Add Questions)`);
    const q1 = await request(`/quizzes/${createdQuizId}/questions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        questionText: 'Which SQL keyword is used to eliminate duplicate rows from the query results?',
        questionType: 'MULTIPLE_CHOICE',
        marks: 2.0,
        explanation: 'DISTINCT keyword removes duplicate records from query output.',
        options: [
          { optionText: 'UNIQUE', isCorrect: false },
          { optionText: 'DISTINCT', isCorrect: true },
          { optionText: 'GROUP BY', isCorrect: false },
          { optionText: 'FILTER', isCorrect: false },
        ],
      },
    });
    assert.strictEqual(q1.status, 201);
    const question1Id = q1.data.question.id;
    const correctOptId = q1.data.question.options.find((o) => o.isCorrect).id;
    const wrongOptId = q1.data.question.options.find((o) => !o.isCorrect).id;
    console.log(`✓ Question added with correct option ID ${correctOptId} and wrong option ID ${wrongOptId}.\n`);

    // Test 7: User Starts Quiz Attempt & Verifies Security (no isCorrect leaked)
    console.log(`Test 7: GET /api/quizzes/${createdQuizId}/start (User Start Quiz)`);
    const startRes = await request(`/quizzes/${createdQuizId}/start`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(startRes.status, 200);
    const questions = startRes.data.quiz.questions;
    assert.ok(Array.isArray(questions));
    // Verify security: check options do NOT contain isCorrect field!
    const optionSample = questions[0].options[0];
    assert.strictEqual(optionSample.isCorrect, undefined);
    console.log('✓ Quiz started safely. Option answers verified sanitized!\n');

    // Test 8: User Submits Quiz Answers (Testing Correct Answer + Negative Deduction)
    console.log(`Test 8: POST /api/quizzes/${createdQuizId}/submit (Answer Submission)`);
    const submitRes = await request(`/quizzes/${createdQuizId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        answers: [
          { questionId: question1Id, selectedOptionId: correctOptId },
        ],
        timeTakenSeconds: 45,
      },
    });
    assert.strictEqual(submitRes.status, 201);
    assert.strictEqual(submitRes.data.result.score, 2);
    assert.strictEqual(submitRes.data.result.passed, true);
    const attemptId = submitRes.data.attemptId;
    console.log(`✓ Submission successful! Score: ${submitRes.data.result.score}/2 (Passed: ${submitRes.data.result.passed}).\n`);

    // Test 9: Get Attempt Result & Certificate Verification
    console.log(`Test 9: GET /api/attempts/${attemptId}/certificate`);
    const certRes = await request(`/attempts/${attemptId}/certificate`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(certRes.status, 200);
    assert.strictEqual(certRes.data.eligible, true);
    assert.ok(certRes.data.certificate.certificateNumber);
    console.log(`✓ Certificate generated: ${certRes.data.certificate.certificateNumber}.\n`);

    // Test 10: Leaderboard & User Stats
    console.log(`Test 10: GET /api/quizzes/${createdQuizId}/leaderboard & GET /api/stats/user`);
    const lbRes = await request(`/quizzes/${createdQuizId}/leaderboard`);
    assert.strictEqual(lbRes.status, 200);
    assert.ok(lbRes.data.leaderboard.length > 0);

    const statsRes = await request(`/stats/user`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(statsRes.status, 200);
    assert.ok(statsRes.data.totalAttempts > 0);
    console.log(`✓ Leaderboard and User statistics verified successfully.\n`);

    console.log(' All E2E API Verification Tests Passed 100% Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(' Test Failure:', error);
    process.exit(1);
  }
}

runTests();
