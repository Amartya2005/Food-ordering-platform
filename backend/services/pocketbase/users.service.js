const BasePocketBaseService = require('./base.service');

class UsersService extends BasePocketBaseService {
  constructor() {
    super('users');
  }
}

module.exports = new UsersService();
