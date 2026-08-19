const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { sequelize } = require('./models');
const seedData = require('./utils/seedData');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const questionRoutes = require('./routes/questionRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', submissionRoutes);
app.use('/api/stats', analyticsRoutes);

// Interactive API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    system: 'Online Quiz System REST API',
    version: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/api/auth/register', description: 'Register user or admin account' },
      { method: 'POST', path: '/api/auth/login', description: 'Login and get JWT token' },
      { method: 'GET', path: '/api/auth/me', description: 'Get authenticated user profile' },
      { method: 'GET', path: '/api/quizzes', description: 'List published quizzes' },
      { method: 'GET', path: '/api/quizzes/:id', description: 'Get quiz detail' },
      { method: 'POST', path: '/api/quizzes', description: 'Admin: Create new quiz (with timer & negative marking)' },
      { method: 'PUT', path: '/api/quizzes/:id', description: 'Admin: Update quiz' },
      { method: 'DELETE', path: '/api/quizzes/:id', description: 'Admin: Delete quiz' },
      { method: 'POST', path: '/api/quizzes/:quizId/questions', description: 'Admin: Add question & options' },
      { method: 'PUT', path: '/api/questions/:id', description: 'Admin: Update question' },
      { method: 'DELETE', path: '/api/questions/:id', description: 'Admin: Delete question' },
      { method: 'GET', path: '/api/quizzes/:id/start', description: 'User: Start quiz attempt (sanitized questions)' },
      { method: 'POST', path: '/api/quizzes/:id/submit', description: 'User: Submit answers & calculate score' },
      { method: 'GET', path: '/api/attempts/my-history', description: 'User: View quiz attempt history' },
      { method: 'GET', path: '/api/attempts/:id/result', description: 'Get attempt score & question breakdown' },
      { method: 'GET', path: '/api/attempts/:id/certificate', description: 'Download eligibility & certificate payload' },
      { method: 'GET', path: '/api/quizzes/:id/leaderboard', description: 'Get top score leaderboard for quiz' },
      { method: 'GET', path: '/api/stats/user', description: 'Get user performance analytics' },
      { method: 'GET', path: '/api/stats/admin', description: 'Admin: Get platform statistics' },
    ],
  });
});

// Fallback to index.html for SPA single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Database Synchronization & Server Startup
async function startServer(initialPort) {
  try {
    await sequelize.sync({ force: false });
    console.log('Database synced successfully.');

    await seedData();

    let currentPort = initialPort;
    const server = app.listen(currentPort, () => {
      console.log(`====================================================`);
      console.log(` Online Quiz System Server running on port ${currentPort}`);
      console.log(` URL: http://localhost:${currentPort}`);
      console.log(` API Documentation: http://localhost:${currentPort}/api/docs`);
      console.log(`====================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${currentPort} is in use, retrying on port ${currentPort + 1}...`);
        startServer(currentPort + 1);
      } else {
        console.error('Failed to start server:', err);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer(PORT);

module.exports = app;
