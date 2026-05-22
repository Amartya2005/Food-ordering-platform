const sanitizeMenuItem = (menuItem) => {
  if (!menuItem) return null;

  return {
    id: menuItem.id,
    restaurantId: menuItem.restaurant_id,
    itemName: menuItem.item_name,
    price: Number(menuItem.price),
    imageUrl: menuItem.image_url || null,
    availability: Boolean(menuItem.availability),
    created: menuItem.created_at,
    updated: menuItem.updated_at,
  };
};

const sanitizeMenuItemList = (menuItems) => {
  return menuItems.map(sanitizeMenuItem);
};

module.exports = {
  sanitizeMenuItem,
  sanitizeMenuItemList,
};
