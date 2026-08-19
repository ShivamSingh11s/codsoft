const app = require('./app');
const { connectDB, sequelize } = require('./src/config/database');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const startServer = async (portToUse = PORT) => {
  try {
    // Authenticate database
    await connectDB();

    // Sync database models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ Database models synchronized.');

    // Start Express Server
    const server = app.listen(portToUse, () => {
      console.log(`🚀 Student Record Management API server running on http://localhost:${portToUse}`);
      console.log(`📊 Visual API Dashboard accessible at http://localhost:${portToUse}`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${portToUse} is already in use. Trying port ${Number(portToUse) + 1}...`);
        startServer(Number(portToUse) + 1);
      } else {
        console.error('❌ Server error:', error);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
