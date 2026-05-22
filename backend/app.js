const express = require('express');
const { corsMiddleware } = require('./config/cors');
const { UPLOADS_DIR, UPLOADS_URL_PREFIX, ensureUploadsDir } = require('./utils/uploadHelpers');
const { securityMiddleware } = require('./config/security');
const { requestIdMiddleware } = require('./utils/requestIdMiddleware');
const paginationDefaults = require('./middleware/paginationDefaults');
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { apiLimiter, authLimiter, adminLimiter, orderLimiter } = require('./middleware/rateLimiter');
const notFoundHandler = require('./middleware/notFoundHandler');
const globalErrorHandler = require('./middleware/globalErrorHandler');

const app = express();

ensureUploadsDir();
app.use(UPLOADS_URL_PREFIX, express.static(UPLOADS_DIR));

app.use(corsMiddleware);
app.use(...securityMiddleware);
app.use(requestIdMiddleware);
app.use(paginationDefaults);
app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderLimiter, orderRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
