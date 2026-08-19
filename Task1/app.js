const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./src/routes');
const errorHandler = require('./src/middleware/errorHandler');
const { errorResponse } = require('./src/utils/apiResponse');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve Static Frontend Dashboard
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routes
app.use('/api', apiRoutes);

// Root route redirect to frontend dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle 404 Routes
app.use((req, res) => {
  return errorResponse(res, 404, `Route '${req.originalUrl}' not found on this server`);
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
