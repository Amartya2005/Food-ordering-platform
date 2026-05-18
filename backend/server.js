const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initializePocketBase, testPocketBaseConnection } = require('./config/pocketbase');
const { initializeSocket } = require('./config/socket');

const startServer = async () => {
  try {
    initializePocketBase();

    if (env.pocketbase.connectionCheckOnStartup) {
      const connection = await testPocketBaseConnection();

      if (!connection.connected && env.nodeEnv === 'production') {
        throw new Error(`PocketBase connection failed: ${connection.message}`);
      }

      if (!connection.connected) {
        console.warn(`PocketBase connection warning: ${connection.message}`);
      }
    }

    const server = http.createServer(app);

    initializeSocket(server);

    server.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
