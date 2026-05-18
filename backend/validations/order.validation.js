const { ORDER_STATUSES, PAYMENT_STATUSES } = require('../config/collections');

const pocketBaseRecordIdPattern = /^[a-z0-9]{15}$/i;
const createBodyFields = ['restaurantId', 'items'];
const statusBodyFields = ['status'];

const validatePocketBaseId = (field, value) => {
  if (!value || typeof value !== 'string' || !pocketBaseRecordIdPattern.test(value)) {
    return {
      field,
      message: `${field} must be a valid PocketBase record id.`,
    };
  }

  return null;
};

const validateUnexpectedFields = (payload, allowedFields) => {
  return Object.keys(payload)
    .filter((field) => !allowedFields.includes(field))
    .map((field) => ({
      field,
      message: `${field} is not allowed.`,
    }));
};

const parseQuantity = (quantity) => {
  if (typeof quantity === 'number') {
    return quantity;
  }

  if (typeof quantity === 'string' && quantity.trim() !== '') {
    return Number(quantity);
  }

  return quantity;
};

const normalizeOrderItems = (items) => {
  if (!Array.isArray(items)) {
    return items;
  }

  return items.map((item) => ({
    menuItemId: typeof item.menuItemId === 'string' ? item.menuItemId.trim() : item.menuItemId,
    quantity: parseQuantity(item.quantity),
  }));
};

const validateOrderItems = (items) => {
  const errors = [];

  if (!Array.isArray(items)) {
    return [
      {
        field: 'items',
        message: 'items must be an array.',
      },
    ];
  }

  if (items.length === 0) {
    return [
      {
        field: 'items',
        message: 'items cannot be empty.',
      },
    ];
  }

  items.forEach((item, index) => {
    const fieldPrefix = `items[${index}]`;

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push({
        field: fieldPrefix,
        message: `${fieldPrefix} must be an object.`,
      });
      return;
    }

    const keys = Object.keys(item);
    const extraKeys = keys.filter((key) => !['menuItemId', 'quantity'].includes(key));

    extraKeys.forEach((key) => {
      errors.push({
        field: `${fieldPrefix}.${key}`,
        message: `${fieldPrefix}.${key} is not allowed.`,
      });
    });

    const menuItemIdError = validatePocketBaseId(`${fieldPrefix}.menuItemId`, item.menuItemId);

    if (menuItemIdError) {
      errors.push(menuItemIdError);
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      errors.push({
        field: `${fieldPrefix}.quantity`,
        message: `${fieldPrefix}.quantity must be an integer greater than or equal to 1.`,
      });
    }
  });

  return errors;
};

const validateOrderCreatePayload = (payload) => {
  const cleanPayload = {
    restaurantId:
      typeof payload.restaurantId === 'string' ? payload.restaurantId.trim() : payload.restaurantId,
    items: normalizeOrderItems(payload.items),
  };

  const errors = [
    ...validateUnexpectedFields(payload, createBodyFields),
    validatePocketBaseId('restaurantId', cleanPayload.restaurantId),
    ...validateOrderItems(cleanPayload.items),
  ].filter(Boolean);

  return {
    valid: errors.length === 0,
    errors,
    data: cleanPayload,
  };
};

const validateOrderStatusPayload = (payload) => {
  const cleanPayload = {
    status: typeof payload.status === 'string' ? payload.status.trim() : payload.status,
  };
  const allowedStatuses = Object.values(ORDER_STATUSES);
  const errors = [...validateUnexpectedFields(payload, statusBodyFields)];

  if (!cleanPayload.status) {
    errors.push({
      field: 'status',
      message: 'status is required.',
    });
  } else if (!allowedStatuses.includes(cleanPayload.status)) {
    errors.push({
      field: 'status',
      message: `status must be one of: ${allowedStatuses.join(', ')}.`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    data: cleanPayload,
  };
};

const validateOrderStatusFilter = (status) => {
  if (status === undefined) {
    return {
      valid: true,
      errors: [],
    };
  }

  const allowedStatuses = Object.values(ORDER_STATUSES);

  if (!allowedStatuses.includes(status)) {
    return {
      valid: false,
      errors: [
        {
          field: 'status',
          message: `status must be one of: ${allowedStatuses.join(', ')}.`,
        },
      ],
    };
  }

  return {
    valid: true,
    errors: [],
  };
};

const validatePaymentStatus = (paymentStatus) => {
  const allowedPaymentStatuses = Object.values(PAYMENT_STATUSES);

  if (!allowedPaymentStatuses.includes(paymentStatus)) {
    return {
      valid: false,
      errors: [
        {
          field: 'paymentStatus',
          message: `paymentStatus must be one of: ${allowedPaymentStatuses.join(', ')}.`,
        },
      ],
    };
  }

  return {
    valid: true,
    errors: [],
  };
};

const validateOrderIdParam = (field, value) => {
  const error = validatePocketBaseId(field, value);

  return {
    valid: !error,
    errors: error ? [error] : [],
  };
};

module.exports = {
  validateOrderCreatePayload,
  validateOrderStatusPayload,
  validateOrderStatusFilter,
  validatePaymentStatus,
  validateOrderIdParam,
  validateOrderItems,
};
