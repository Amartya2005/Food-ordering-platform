const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initializeDatabase, testDatabaseConnection } = require('./config/database');
const { runMigrations } = require('./config/migrations');
const { initializeSocket } = require('./config/socket');
const logger = require('./utils/logger');

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection.', {
    message: reason && reason.message ? reason.message : String(reason),
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception.', {
    message: error.message,
  });
  process.exit(1);
});

let server = null;

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  if (server) {
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Graceful shutdown timeout. Force exiting.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const startServer = async () => {
  try {
    initializeDatabase();

    if (env.db.connectionCheckOnStartup) {
      const connection = await testDatabaseConnection();

      if (!connection.connected && env.nodeEnv === 'production') {
        throw new Error(`MySQL connection failed: ${connection.message}`);
      }

      if (!connection.connected) {
        logger.warn('MySQL connection warning.', connection);
      } else {
        logger.info('MySQL connection healthy.');
      }
    }

    await runMigrations();

    server = http.createServer(app);

    initializeSocket(server);

    server.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });

    server.on('error', (error) => {
      logger.error('HTTP server error.', {
        message: error.message,
        code: error.code,
      });
    });
  } catch (error) {
    logger.error('Failed to start server.', {
      message: error.message,
    });
    process.exit(1);
  }
};

startServer();
