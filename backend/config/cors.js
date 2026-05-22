const cors = require('cors');
const env = require('./env');

/** Allow any local Vite/webpack port during development (e.g. 5173, 5174). */
const LOCAL_DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const isLocalDevOrigin = (origin) => {
  if (!origin) {
    return false;
  }

  if (env.nodeEnv !== 'development' && env.nodeEnv !== 'test') {
    return false;
  }

  return LOCAL_DEV_ORIGIN_PATTERN.test(origin);
};

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (env.clientUrls.includes(origin)) {
    return true;
  }

  return isLocalDevOrigin(origin);
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, origin || true);
    }

    const error = new Error(`Origin is not allowed by CORS: ${origin}`);
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  optionsSuccessStatus: 204,
};

const corsMiddleware = cors(corsOptions);

module.exports = {
  corsOptions,
  corsMiddleware,
  isAllowedOrigin,
  isLocalDevOrigin,
};
