const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./src/config/database');
const contactRoutes = require('./src/routes/contactRoutes');
const { notFoundHandler, globalErrorHandler } = require('./src/middlewares/errorHandler');
const { successResponse } = require('./src/utils/apiResponse');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend dashboard
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  return successResponse(res, 200, 'Contact Management API is running smoothly', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/contacts', contactRoutes);

// Catch 404 endpoints
app.use(notFoundHandler);

// Global Error Handler
app.use(globalErrorHandler);

// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    const startServer = (portToUse) => {
      const serverInstance = app
        .listen(portToUse, () => {
          console.log(`🚀 Server running on http://localhost:${portToUse}`);
          console.log(`📊 Interactive API Dashboard live at http://localhost:${portToUse}`);
        })
        .on('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ Port ${portToUse} is in use. Trying port ${portToUse + 1}...`);
            startServer(portToUse + 1);
          } else {
            console.error('❌ Server error:', err);
          }
        });
    };

    startServer(PORT);
  });
}

module.exports = app;
