const BaseService = require('./base.service');
const generateToken = require('../../utils/generateToken');
const {
  normalizeEmail,
  sanitizeUser,
  createAuthError,
  hashPassword,
  comparePassword,
} = require('../../utils/authHelpers');

class AuthService extends BaseService {
  constructor() {
    super('users');
  }

  async register(payload) {
    const email = normalizeEmail(payload.email);

    const existing = await this.queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email],
    );

    if (existing) {
      throw createAuthError('An account with this email already exists.', 409);
    }

    const passwordHash = await hashPassword(payload.password);

    try {
      await this.execute(
        `INSERT INTO users (name, email, password, role, address)
         VALUES (?, ?, ?, ?, ?)`,
        [
          payload.name.trim(),
          email,
          passwordHash,
          payload.role,
          payload.address.trim(),
        ],
      );

      const user = await this.queryOne('SELECT * FROM users WHERE email = ?', [email]);
      const sanitized = sanitizeUser(user);

      return {
        token: generateToken(sanitized),
        user: sanitized,
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw createAuthError('An account with this email already exists.', 409);
      }

      throw this.handleError(error, 'Unable to register user.');
    }
  }

  async login(payload) {
    const email = normalizeEmail(payload.email);

    const user = await this.queryOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      throw createAuthError('Invalid email or password.', 401);
    }

    const passwordMatch = await comparePassword(payload.password, user.password);

    if (!passwordMatch) {
      throw createAuthError('Invalid email or password.', 401);
    }

    const sanitized = sanitizeUser(user);

    return {
      token: generateToken(sanitized),
      user: sanitized,
    };
  }

  async getCurrentUser(authenticatedUser) {
    if (!authenticatedUser || !authenticatedUser.id) {
      throw createAuthError('Authentication is required.', 401);
    }

    const user = await this.queryOne('SELECT * FROM users WHERE id = ?', [authenticatedUser.id]);

    if (!user) {
      throw createAuthError('Authenticated user no longer exists.', 401);
    }

    return sanitizeUser(user);
  }
}

module.exports = new AuthService();
