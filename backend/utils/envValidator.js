const dotenv = require('dotenv');

dotenv.config({ quiet: true, override: true });

const ALLOWED_NODE_ENVS = ['development', 'test', 'production'];

const parseInteger = (value, fallback) => {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return parsedValue;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined) {
    return fallback;
  }

  return String(value).trim().toLowerCase() === 'true';
};

const splitOrigins = (...values) => {
  return values
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const ensureRequiredString = (errors, key, value) => {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    errors.push(`${key} is required.`);
  }
};

const ensureValidUrl = (errors, key, value) => {
  try {
    new URL(value);
  } catch (error) {
    errors.push(`${key} must be a valid URL.`);
  }
};

const ensureValidInteger = (errors, key, value, options = {}) => {
  const parsedValue = Number(value);
  const { min = 1 } = options;

  if (!Number.isInteger(parsedValue) || parsedValue < min) {
    errors.push(`${key} must be an integer greater than or equal to ${min}.`);
  }
};

const validateEnvironment = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const clientOrigins = splitOrigins(process.env.CLIENT_URL, process.env.CLIENT_URLS);
  const errors = [];

  if (!ALLOWED_NODE_ENVS.includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of: ${ALLOWED_NODE_ENVS.join(', ')}.`);
  }

  ensureValidInteger(errors, 'PORT', process.env.PORT || '5000');
  ensureRequiredString(errors, 'JWT_SECRET', process.env.JWT_SECRET);
  ensureRequiredString(errors, 'DB_HOST', process.env.DB_HOST);
  ensureRequiredString(errors, 'DB_USER', process.env.DB_USER);
  ensureRequiredString(errors, 'DB_NAME', process.env.DB_NAME);

  if (clientOrigins.length === 0) {
    errors.push('CLIENT_URL is required.');
  } else {
    clientOrigins.forEach((origin, index) => {
      ensureValidUrl(errors, `CLIENT_URL[${index}]`, origin);
    });
  }

  if (nodeEnv === 'production') {
    ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'].forEach((key) => {
      ensureRequiredString(errors, key, process.env[key]);
    });
  }

  if (errors.length > 0) {
    const error = new Error(`Environment validation failed: ${errors.join(' ')}`);
    error.statusCode = 500;
    throw error;
  }

  return {
    nodeEnv,
    port: parseInteger(process.env.PORT, 5000),
    clientUrl: clientOrigins[0],
    clientUrls: clientOrigins,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptSaltRounds: parseInteger(process.env.BCRYPT_SALT_ROUNDS, 12),
    request: {
      bodyLimit: process.env.REQUEST_BODY_LIMIT || '1mb',
    },
    rateLimit: {
      windowMs: parseInteger(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      max: parseInteger(process.env.RATE_LIMIT_MAX, 200),
      authMax: parseInteger(process.env.AUTH_RATE_LIMIT_MAX, 20),
      adminMax: parseInteger(process.env.ADMIN_RATE_LIMIT_MAX, 50),
      orderMax: parseInteger(process.env.ORDER_RATE_LIMIT_MAX, 120),
    },
    db: {
      host: process.env.DB_HOST,
      port: parseInteger(process.env.DB_PORT, 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      name: process.env.DB_NAME,
      connectionCheckOnStartup: parseBoolean(process.env.DB_CHECK_ON_STARTUP, true),
    },
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },
  };
};

module.exports = {
  validateEnvironment,
  parseBoolean,
  parseInteger,
  splitOrigins,
};
