const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

let pool = null;

const createPool = () => {
  return mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
    charset: 'utf8mb4',
  });
};

const initializeDatabase = () => {
  if (!pool) {
    pool = createPool();
  }

  return pool;
};

const getPool = () => {
  if (!pool) {
    return initializeDatabase();
  }

  return pool;
};

const testDatabaseConnection = async () => {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();

    return {
      connected: true,
      message: 'MySQL connection is healthy.',
    };
  } catch (error) {
    return {
      connected: false,
      message: error.message,
    };
  }
};

module.exports = {
  initializeDatabase,
  getPool,
  testDatabaseConnection,
};
