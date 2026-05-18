const PocketBase = require('pocketbase/cjs');
const env = require('./env');
const { normalizePocketBaseError } = require('../utils/pocketbaseHelpers');

let pocketBaseClient = null;

const createPocketBaseClient = () => {
  if (!env.pocketbase.url) {
    throw new Error('POCKETBASE_URL is required.');
  }

  const client = new PocketBase(env.pocketbase.url);
  client.autoCancellation(false);

  return client;
};

const initializePocketBase = () => {
  if (!env.pocketbase.url) {
    throw new Error('POCKETBASE_URL is required.');
  }

  if (!pocketBaseClient) {
    pocketBaseClient = createPocketBaseClient();
  }

  return pocketBaseClient;
};

const getPocketBase = () => {
  if (!pocketBaseClient) {
    return initializePocketBase();
  }

  return pocketBaseClient;
};

const testPocketBaseConnection = async () => {
  try {
    const client = getPocketBase();
    const result = await client.health.check({
      requestKey: null,
    });

    return {
      connected: true,
      status: result.code || 200,
      message: result.message || 'PocketBase connection is healthy.',
    };
  } catch (error) {
    const normalizedError = normalizePocketBaseError(error);

    return {
      connected: false,
      status: normalizedError.status,
      message: normalizedError.message,
      details: normalizedError.details,
    };
  }
};

module.exports = {
  createPocketBaseClient,
  initializePocketBase,
  getPocketBase,
  testPocketBaseConnection,
};
