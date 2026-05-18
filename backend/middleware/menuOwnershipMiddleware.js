const menuService = require('../services/pocketbase/menu.service');
const { validatePocketBaseId } = require('../validations/menu.validation');

const verifyMenuOwnership = async (req, res, next) => {
  try {
    const validationResult = validatePocketBaseId('id', req.params.id);

    if (!validationResult.valid) {
      const error = new Error('Request validation failed.');
      error.statusCode = 400;
      error.details = validationResult.errors;
      throw error;
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
