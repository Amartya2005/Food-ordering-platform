const env = require('../../config/env');
const { COLLECTION_NAMES } = require('../../config/collections');
const { createPocketBaseClient } = require('../../config/pocketbase');
const generateToken = require('../../utils/generateToken');
const {
  normalizeEmail,
  sanitizeUser,
  createAuthError,
} = require('../../utils/authHelpers');
const { normalizePocketBaseError } = require('../../utils/pocketbaseHelpers');

class AuthService {
  constructor() {
    this.internalClient = null;
  }

  async register(payload) {
    const email = normalizeEmail(payload.email);

    await this.ensureEmailIsAvailable(email);

    try {
      const client = createPocketBaseClient();
      const user = await client.collection(COLLECTION_NAMES.users).create(
        {
          name: payload.name.trim(),
          email,
          password: payload.password,
          passwordConfirm: payload.password,
          role: payload.role,
          address: payload.address.trim(),
          emailVisibility: false,
        },
        {
          requestKey: null,
        },
      );

      const sanitizedUser = sanitizeUser(user);

      return {
        token: generateToken(sanitizedUser),
        user: sanitizedUser,
      };
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw createAuthError('An account with this email already exists.', 409);
      }

      throw this.handlePocketBaseError(error, 'Unable to register user.');
    }
  }

  async login(payload) {
    const email = normalizeEmail(payload.email);
    const client = createPocketBaseClient();

    try {
      const authData = await client
        .collection(COLLECTION_NAMES.users)
        .authWithPassword(email, payload.password, {
          requestKey: null,
        });

      const sanitizedUser = sanitizeUser(authData.record);

      return {
        token: generateToken(sanitizedUser),
        user: sanitizedUser,
      };
    } catch (error) {
      throw createAuthError('Invalid email or password.', 401);
    } finally {
      client.authStore.clear();
    }
  }

  async getCurrentUser(authenticatedUser) {
    if (!authenticatedUser || !authenticatedUser.id) {
      throw createAuthError('Authentication is required.', 401);
    }

    if (!this.hasInternalCredentials()) {
      return sanitizeUser(authenticatedUser);
    }

    try {
      const client = await this.getInternalClient();
      const user = await client.collection(COLLECTION_NAMES.users).getOne(authenticatedUser.id, {
        requestKey: null,
      });

      return sanitizeUser(user);
    } catch (error) {
      const normalizedError = normalizePocketBaseError(error);

      if (normalizedError.status === 404) {
        throw createAuthError('Authenticated user no longer exists.', 401);
      }

      throw this.handlePocketBaseError(error, 'Unable to retrieve current user.');
    }
  }

  async ensureEmailIsAvailable(email) {
    if (!this.hasInternalCredentials()) {
      return;
    }

    const existingUser = await this.findUserByEmail(email);

    if (existingUser) {
      throw createAuthError('An account with this email already exists.', 409);
    }
  }

  async findUserByEmail(email) {
    const client = await this.getInternalClient();

    try {
      return await client.collection(COLLECTION_NAMES.users).getFirstListItem(
        client.filter('email = {:email}', { email }),
        {
          requestKey: null,
        },
      );
    } catch (error) {
      const normalizedError = normalizePocketBaseError(error);

      if (normalizedError.status === 404) {
        return null;
      }

      throw this.handlePocketBaseError(error, 'Unable to check email availability.');
    }
  }

  async getInternalClient() {
    if (this.internalClient && this.internalClient.authStore.isValid) {
      return this.internalClient;
    }

    if (!this.hasInternalCredentials()) {
      throw createAuthError('PocketBase internal authentication is not configured.', 500);
    }

    this.internalClient = createPocketBaseClient();

    await this.internalClient
      .collection('_superusers')
      .authWithPassword(env.pocketbase.superuserEmail, env.pocketbase.superuserPassword, {
        requestKey: null,
      });

    return this.internalClient;
  }

  hasInternalCredentials() {
    return Boolean(env.pocketbase.superuserEmail && env.pocketbase.superuserPassword);
  }

  isDuplicateEmailError(error) {
    const normalizedError = normalizePocketBaseError(error);
    const serializedDetails = JSON.stringify(normalizedError.details || {});

    return (
      normalizedError.status === 400 &&
      serializedDetails.includes('email') &&
      (serializedDetails.includes('validation_not_unique') ||
        serializedDetails.includes('already exists') ||
        serializedDetails.includes('must be unique'))
    );
  }

  handlePocketBaseError(error, fallbackMessage) {
    const normalizedError = normalizePocketBaseError(error);
    const serviceError = new Error(fallbackMessage);

    serviceError.statusCode = normalizedError.status >= 500 ? 502 : normalizedError.status;
    serviceError.details = normalizedError.details;

    return serviceError;
  }
}

module.exports = new AuthService();
