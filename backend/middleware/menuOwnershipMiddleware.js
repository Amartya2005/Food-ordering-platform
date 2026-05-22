const menuService = require('../services/mysql/menu.service');
const validateRequest = require('./validateRequest');
const { validateRecordId } = require('../validations/menu.validation');

const verifyMenuOwnership = async (req, res, next) => {
  try {
    const validationResult = validateRecordId('id', req.params.id);

    if (!validationResult.valid) {
      throw validateRequest.buildValidationError(validationResult.errors);
    }

    const menuItem = await menuService.verifyMenuOwnership(req.params.id, req.user);

    req.menuItem = menuItem;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verifyMenuOwnership,
};
