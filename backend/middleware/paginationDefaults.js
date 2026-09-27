const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT = '-created';

const toNonNegativeInteger = (value, fallback, max = Number.MAX_SAFE_INTEGER) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return Math.min(parsed, max);
};

const paginationDefaults = (req, res, next) => {
  const limit = toNonNegativeInteger(req.query.limit, DEFAULT_LIMIT, MAX_LIMIT) || DEFAULT_LIMIT;
  const offset = toNonNegativeInteger(req.query.offset, 0);
  const sort = typeof req.query.sort === 'string' && req.query.sort.trim()
    ? req.query.sort.trim()
    : DEFAULT_SORT;

  req.pagination = {
    limit,
    offset,
    sort,
  };

  next();
};

module.exports = paginationDefaults;
