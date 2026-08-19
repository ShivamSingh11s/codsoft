const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_STORAGE 
  ? path.resolve(process.env.DB_STORAGE)
  : path.resolve(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: true
  }
});

// Enable SQLite foreign key enforcement
sequelize.beforeConnect(async (config) => {
  // SQLite enables foreign keys per-connection
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // Enable PRAGMA foreign_keys = ON;
    await sequelize.query('PRAGMA foreign_keys = ON;');
    console.log('✅ SQLite Database connected successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
