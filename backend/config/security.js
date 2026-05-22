const compression = require('compression');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./env');
const logger = require('../utils/logger');

const requestLoggerStream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

const requestLogger = morgan(env.nodeEnv === 'production' ? 'combined' : 'dev', {
  stream: requestLoggerStream,
  skip: (req) => {
    return env.nodeEnv === 'production' && req.path === '/health';
  },
});

const requestContextMiddleware = (req, res, next) => {
  if (req.id) {
    logger.setRequestId(req.id);
  }

  const originalSend = res.send;

  res.send = function (data) {
    logger.clearRequestId();
    return originalSend.call(this, data);
  };

  next();
};

const securityMiddleware = [
  helmet({
    crossOriginResourcePolicy: false,
  }),
  compression(),
  express.json({ limit: env.request.bodyLimit }),
  express.urlencoded({ extended: true, limit: env.request.bodyLimit }),
  requestLogger,
  requestContextMiddleware,
];

module.exports = {
  requestLogger,
  securityMiddleware,
};
