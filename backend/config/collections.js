const COLLECTION_NAMES = Object.freeze({
  users: 'users',
  restaurants: 'restaurants',
  menuItems: 'menu_items',
  orders: 'orders',
});

const COLLECTION_IDS = Object.freeze({
  users: 'users0000000000',
  restaurants: 'rests0000000000',
  menuItems: 'menuitems000000',
  orders: 'orders000000000',
});

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

const ACCESS_RULES = Object.freeze({
  users: {
    listRule: '@request.auth.role = "admin"',
    viewRule: 'id = @request.auth.id || @request.auth.role = "admin"',
    createRule:
      '@request.auth.role = "admin" || (@request.auth.id = "" && (@request.body.role = "customer" || @request.body.role = "restaurant_owner"))',
    updateRule:
      '@request.auth.role = "admin" || (id = @request.auth.id && @request.body.role:changed = false)',
    deleteRule: '@request.auth.role = "admin"',
    manageRule: '@request.auth.role = "admin"',
    authRule: '',
  },
  restaurants: {
    listRule: '',
    viewRule: '',
    createRule:
      '@request.auth.role = "admin" || (@request.auth.role = "restaurant_owner" && @request.body.ownerId = @request.auth.id)',
    updateRule: '@request.auth.role = "admin" || ownerId = @request.auth.id',
    deleteRule: '@request.auth.role = "admin" || ownerId = @request.auth.id',
  },
  menuItems: {
    listRule: '',
    viewRule: '',
    createRule:
      '@request.auth.role = "admin" || (@request.auth.role = "restaurant_owner" && @collection.restaurants.id ?= @request.body.restaurantId && @collection.restaurants.ownerId ?= @request.auth.id)',
    updateRule: '@request.auth.role = "admin" || restaurantId.ownerId = @request.auth.id',
    deleteRule: '@request.auth.role = "admin" || restaurantId.ownerId = @request.auth.id',
  },
  orders: {
    listRule:
      '@request.auth.role = "admin" || customerId = @request.auth.id || restaurantId.ownerId = @request.auth.id',
    viewRule:
      '@request.auth.role = "admin" || customerId = @request.auth.id || restaurantId.ownerId = @request.auth.id',
    createRule:
      '@request.auth.role = "admin" || (@request.auth.role = "customer" && @request.body.customerId = @request.auth.id)',
    updateRule: '@request.auth.role = "admin" || restaurantId.ownerId = @request.auth.id',
    deleteRule: '@request.auth.role = "admin" || customerId = @request.auth.id',
  },
});

const COLLECTION_SCHEMAS = Object.freeze([
  {
    id: COLLECTION_IDS.users,
    name: COLLECTION_NAMES.users,
    type: 'auth',
    ...ACCESS_RULES.users,
    passwordAuth: {
      enabled: true,
      identityFields: ['email'],
    },
    fields: [
      {
        name: 'name',
        type: 'text',
        required: true,
        min: 2,
        max: 80,
      },
      {
        name: 'role',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: Object.values(USER_ROLES),
      },
      {
        name: 'address',
        type: 'text',
        required: true,
        min: 5,
        max: 500,
      },
    ],
    indexes: ['CREATE INDEX idx_users_role ON users (role)'],
  },
  {
    id: COLLECTION_IDS.restaurants,
    name: COLLECTION_NAMES.restaurants,
    type: 'base',
    ...ACCESS_RULES.restaurants,
    fields: [
      {
        name: 'ownerId',
        type: 'relation',
        required: true,
        maxSelect: 1,
        collectionId: COLLECTION_IDS.users,
        targetCollection: COLLECTION_NAMES.users,
        cascadeDelete: false,
      },
      {
        name: 'name',
        type: 'text',
        required: true,
        min: 2,
        max: 120,
      },
      {
        name: 'category',
        type: 'text',
        required: true,
        min: 2,
        max: 60,
      },
      {
        name: 'location',
        type: 'text',
        required: true,
        min: 2,
        max: 255,
      },
      {
        name: 'image',
        type: 'file',
        required: true,
        ...IMAGE_FIELD_OPTIONS,
      },
    ],
    indexes: [
      'CREATE INDEX idx_restaurants_ownerId ON restaurants (ownerId)',
      'CREATE INDEX idx_restaurants_category ON restaurants (category)',
      'CREATE INDEX idx_restaurants_location ON restaurants (location)',
    ],
  },
  {
    id: COLLECTION_IDS.menuItems,
    name: COLLECTION_NAMES.menuItems,
    type: 'base',
    ...ACCESS_RULES.menuItems,
    fields: [
      {
        name: 'restaurantId',
        type: 'relation',
        required: true,
        maxSelect: 1,
        collectionId: COLLECTION_IDS.restaurants,
        targetCollection: COLLECTION_NAMES.restaurants,
        cascadeDelete: true,
      },
      {
        name: 'itemName',
        type: 'text',
        required: true,
        min: 2,
        max: 120,
      },
      {
        name: 'price',
        type: 'number',
        required: true,
        min: 0,
      },
      {
        name: 'image',
        type: 'file',
        required: true,
        ...IMAGE_FIELD_OPTIONS,
      },
      {
        name: 'availability',
        type: 'bool',
        required: true,
      },
    ],
    indexes: [
      'CREATE INDEX idx_menu_items_restaurantId ON menu_items (restaurantId)',
      'CREATE INDEX idx_menu_items_availability ON menu_items (availability)',
      'CREATE INDEX idx_menu_items_restaurant_availability ON menu_items (restaurantId, availability)',
    ],
  },
  {
    id: COLLECTION_IDS.orders,
    name: COLLECTION_NAMES.orders,
    type: 'base',
    ...ACCESS_RULES.orders,
    fields: [
      {
        name: 'customerId',
        type: 'relation',
        required: true,
        maxSelect: 1,
        collectionId: COLLECTION_IDS.users,
        targetCollection: COLLECTION_NAMES.users,
        cascadeDelete: false,
      },
      {
        name: 'restaurantId',
        type: 'relation',
        required: true,
        maxSelect: 1,
        collectionId: COLLECTION_IDS.restaurants,
        targetCollection: COLLECTION_NAMES.restaurants,
        cascadeDelete: false,
      },
      {
        name: 'items',
        type: 'json',
        required: true,
      },
      {
        name: 'totalPrice',
        type: 'number',
        required: true,
        min: 0,
      },
      {
        name: 'status',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: Object.values(ORDER_STATUSES),
      },
      {
        name: 'paymentStatus',
        type: 'select',
        required: true,
        maxSelect: 1,
        values: Object.values(PAYMENT_STATUSES),
      },
    ],
    indexes: [
      'CREATE INDEX idx_orders_customerId ON orders (customerId)',
      'CREATE INDEX idx_orders_restaurantId ON orders (restaurantId)',
      'CREATE INDEX idx_orders_status ON orders (status)',
      'CREATE INDEX idx_orders_paymentStatus ON orders (paymentStatus)',
      'CREATE INDEX idx_orders_restaurant_status ON orders (restaurantId, status)',
    ],
  },
]);

const stripInternalFieldMetadata = (field) => {
  const { targetCollection, ...pocketBaseField } = field;
  return pocketBaseField;
};

const toPocketBaseCollectionPayload = (schema) => {
  return {
    ...schema,
    fields: schema.fields.map(stripInternalFieldMetadata),
  };
};

module.exports = {
  COLLECTION_NAMES,
  COLLECTION_IDS,
  USER_ROLES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  IMAGE_FIELD_OPTIONS,
  ACCESS_RULES,
  COLLECTION_SCHEMAS,
  toPocketBaseCollectionPayload,
};
