const dotenv = require('dotenv');

dotenv.config({ quiet: true });

const requiredEnvVars = ['POCKETBASE_URL', 'JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'development-jwt-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  pocketbase: {
    url: process.env.POCKETBASE_URL || 'http://127.0.0.1:8090',
    connectionCheckOnStartup: process.env.POCKETBASE_CHECK_ON_STARTUP !== 'false',
    superuserEmail: process.env.POCKETBASE_SUPERUSER_EMAIL || '',
    superuserPassword: process.env.POCKETBASE_SUPERUSER_PASSWORD || '',
  },
};

module.exports = env;
