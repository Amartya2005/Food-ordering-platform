const normalizePocketBaseError = (error) => {
  return {
    status: error.status || 500,
    message: error.message || 'PocketBase request failed.',
    details: error.response || null,
    isAbort: Boolean(error.isAbort),
  };
};

const buildFilter = (client, expression, params = {}) => {
  return client.filter(expression, params);
};

module.exports = {
  normalizePocketBaseError,
  buildFilter,
};
