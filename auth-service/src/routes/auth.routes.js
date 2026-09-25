const express = require('express');
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const ctrl = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Throttle credential-guessing on the login/register endpoints specifically.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
});

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 8 }),
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty()],
  validate,
  ctrl.login
);

router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  ctrl.googleCallback
);

module.exports = router;
