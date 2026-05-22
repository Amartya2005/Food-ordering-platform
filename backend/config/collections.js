const USER_ROLES = Object.freeze({
  customer: 'customer',
  restaurantOwner: 'restaurant_owner',
  admin: 'admin',
});

const ORDER_STATUSES = Object.freeze({
  received: 'Received',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
});

const PAYMENT_STATUSES = Object.freeze({
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
});

const IMAGE_FIELD_OPTIONS = Object.freeze({
  maxSelect: 1,
  maxSize: 5242880,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  thumbs: ['200x200', '600x400'],
  protected: false,
});

module.exports = {
  USER_ROLES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  IMAGE_FIELD_OPTIONS,
};
