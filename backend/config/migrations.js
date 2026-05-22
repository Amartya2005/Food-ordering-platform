const mysql = require('mysql2/promise');
const { getPool } = require('./database');
const env = require('./env');
const { ALL_TABLES } = require('./schema');
const logger = require('../utils/logger');

const ensureDatabaseExists = async () => {
  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
  });

  const dbName = String(env.db.name).replace(/`/g, '');

  await connection.execute(
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();
};

const runMigrations = async () => {
  await ensureDatabaseExists();

  const pool = getPool();

  logger.info('Running database migrations...');

  for (const sql of ALL_TABLES) {
    await pool.execute(sql);
  }

  logger.info('Database migrations complete.');
};

module.exports = { runMigrations, ensureDatabaseExists };
