const { getPool } = require('../../config/database');

class BaseService {
  constructor(tableName) {
    if (!tableName) {
      throw new Error('A table name is required.');
    }

    this.tableName = tableName;
  }

  get pool() {
    return getPool();
  }

  /**
   * Execute a query and return all rows.
   */
  async query(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }

  /**
   * Execute a query and return the first row or null.
   */
  async queryOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows[0] || null;
  }

  /**
   * Execute an INSERT / UPDATE / DELETE and return the result metadata.
   */
  async execute(sql, params = []) {
    const [result] = await this.pool.execute(sql, params);
    return result;
  }

  /**
   * Wrap multiple queries in a transaction.
   * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} fn
   */
  async transaction(fn) {
    const conn = await this.pool.getConnection();

    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Build a standard service error.
   */
  buildError(message, statusCode = 500, details = null) {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (details) error.details = details;
    return error;
  }

  /**
   * Re-throw if already a service error, otherwise wrap.
   */
  handleError(error, fallbackMessage) {
    if (error.statusCode) return error;
    return this.buildError(fallbackMessage, 500);
  }

  /**
   * mysql2 prepared statements reject LIMIT/OFFSET placeholders on some servers.
   */
  buildPaginationClause(limit, offset) {
    const safeLimit = Math.max(1, Number.parseInt(limit, 10) || 1);
    const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);

    return `LIMIT ${safeLimit} OFFSET ${safeOffset}`;
  }
}

module.exports = BaseService;
