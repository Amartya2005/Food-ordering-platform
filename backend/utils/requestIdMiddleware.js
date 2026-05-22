const crypto = require('crypto');

const generateRequestId = () => {
  return crypto.randomBytes(8).toString('hex');
};

const requestIdMiddleware = (req, res, next) => {
  const requestId = req.get('X-Request-ID') || generateRequestId();
  req.id = requestId;
  req.requestId = requestId;

  res.setHeader('X-Request-ID', requestId);

  next();
};

module.exports = {
  requestIdMiddleware,
  generateRequestId,
};
