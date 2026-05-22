require('dotenv').config({ quiet: true, override: true });

const { initializeDatabase } = require('../config/database');
const { runMigrations } = require('../config/migrations');
const logger = require('../utils/logger');

const main = async () => {
  initializeDatabase();
  await runMigrations();
  logger.info('MySQL tables are ready.');
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error('Migration failed.', { message: error.message });
    process.exit(1);
  });
