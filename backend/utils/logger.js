const LEVELS = Object.freeze({
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  http: 'HTTP',
  debug: 'DEBUG',
});

let currentRequestId = null;

const getEnvironment = () => {
  return process.env.NODE_ENV || 'development';
};

const shouldLog = (level) => {
  if (getEnvironment() !== 'production') {
    return true;
  }

  return [LEVELS.error, LEVELS.warn, LEVELS.info, LEVELS.http].includes(level);
};

const setRequestId = (requestId) => {
  currentRequestId = requestId;
};

const clearRequestId = () => {
  currentRequestId = null;
};

const formatMessage = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const requestIdStr = currentRequestId ? ` [REQ:${currentRequestId}]` : '';
  const baseMessage = `[${timestamp}]${requestIdStr} ${level} ${message}`;

  if (meta === undefined) {
    return baseMessage;
  }

  const serializedMeta =
    typeof meta === 'string' ? meta : JSON.stringify(meta, null, getEnvironment() === 'production' ? 0 : 2);

  return `${baseMessage} ${serializedMeta}`;
};

const writeLog = (level, message, meta) => {
  if (!shouldLog(level)) {
    return;
  }

  const formattedMessage = formatMessage(level, message, meta);

  if (level === LEVELS.error) {
    console.error(formattedMessage);
    return;
  }

  if (level === LEVELS.warn) {
    console.warn(formattedMessage);
    return;
  }

  console.log(formattedMessage);
};

const logger = {
  error: (message, meta) => writeLog(LEVELS.error, message, meta),
  warn: (message, meta) => writeLog(LEVELS.warn, message, meta),
  info: (message, meta) => writeLog(LEVELS.info, message, meta),
  http: (message, meta) => writeLog(LEVELS.http, message, meta),
  debug: (message, meta) => writeLog(LEVELS.debug, message, meta),
  setRequestId,
  clearRequestId,
};

module.exports = logger;
