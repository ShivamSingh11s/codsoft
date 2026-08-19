const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'test' ? false : console.log,
  define: {
    timestamps: true,
    underscored: false,
  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite Database connected successfully.');
    await sequelize.sync(); // Sync models with DB schema
    console.log('✅ Database models synchronized.');
  } catch (error) {
    console.error('❌ Unable to connect to SQLite database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
