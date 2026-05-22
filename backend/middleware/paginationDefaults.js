const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT = '-created';

const paginationDefaults = (req, res, next) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const sort = req.query.sort || DEFAULT_SORT;

  req.pagination = {
    limit,
    offset,
    sort,
  };

  next();
};

module.exports = paginationDefaults;
