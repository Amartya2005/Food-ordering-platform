const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { validateRegisterPayload, validateLoginPayload } = require('../validations/auth.validation');

const router = express.Router();

router.post(
  '/register',
  validateRequest((req) => validateRegisterPayload(req.body), {
    applyData: (req, data) => {
      req.body = data;
    },
  }),
  authController.register,
);
router.post(
  '/login',
  validateRequest((req) => validateLoginPayload(req.body), {
    applyData: (req, data) => {
      req.body = data;
    },
  }),
  authController.login,
);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
