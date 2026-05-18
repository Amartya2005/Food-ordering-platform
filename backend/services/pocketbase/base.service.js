const { getPocketBase } = require('../../config/pocketbase');
const { normalizePocketBaseError } = require('../../utils/pocketbaseHelpers');

class BasePocketBaseService {
  constructor(collectionName) {
    if (!collectionName) {
      throw new Error('A PocketBase collection name is required.');
    }

    this.collectionName = collectionName;
  }

  get client() {
    return getPocketBase();
  }

  get collection() {
    return this.client.collection(this.collectionName);
  }

  async list(page = 1, perPage = 30, options = {}) {
    try {
      return await this.collection.getList(page, perPage, options);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getById(recordId, options = {}) {
    try {
      return await this.collection.getOne(recordId, options);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async create(data, options = {}) {
    try {
      return await this.collection.create(data, options);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(recordId, data, options = {}) {
    try {
      return await this.collection.update(recordId, data, options);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(recordId, options = {}) {
    try {
      return await this.collection.delete(recordId, options);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    const normalizedError = normalizePocketBaseError(error);
    const serviceError = new Error(normalizedError.message);

    serviceError.statusCode = normalizedError.status;
    serviceError.details = normalizedError.details;
    serviceError.isAbort = normalizedError.isAbort;

    return serviceError;
  }
}

module.exports = BasePocketBaseService;
