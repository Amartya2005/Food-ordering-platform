const { getPocketBase } = require('../config/pocketbase');
const { getPocketBaseFileUrl } = require('./fileHelpers');

const sanitizeMenuItem = (menuItem, client = getPocketBase()) => {
  if (!menuItem) {
    return null;
  }

  return {
    id: menuItem.id,
    restaurantId: menuItem.restaurantId,
    itemName: menuItem.itemName,
    price: menuItem.price,
    image: menuItem.image,
    imageUrl: getPocketBaseFileUrl(client, menuItem, menuItem.image),
    availability: menuItem.availability,
    created: menuItem.created,
    updated: menuItem.updated,
  };
};

const sanitizeMenuItemList = (menuItems, client = getPocketBase()) => {
  return menuItems.map((menuItem) => sanitizeMenuItem(menuItem, client));
};

module.exports = {
  sanitizeMenuItem,
  sanitizeMenuItemList,
};
