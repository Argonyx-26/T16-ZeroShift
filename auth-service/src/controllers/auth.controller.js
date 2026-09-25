const userModel = require('../models/user.model');
const refreshTokenModel = require('../models/refreshToken.model');
const { hashPassword, comparePassword, isPasswordStrongEnough } = require('../utils/password');
const {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  refreshTokenExpiryDate,
} = require('../utils/jwt');

const REFRESH_COOKIE_NAME = 'refresh_token';

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/api/auth', // only sent to auth endpoints
    maxAge: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000,
  };
}

// Issues an access token in the JSON body and sets the refresh token as an httpOnly cookie.
async function issueTokens(res, user, req) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();

  await refreshTokenModel.store({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshTokenExpiryDate(),
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return accessToken;
}

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required.' });
    }
    if (!isPasswordStrongEnough(password)) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters and include a letter and a number.' });
    }

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'That email is already registered.' });
    }

    const passwordHash = await hashPassword(password);
    const user = await userModel.createWithPassword({ email, passwordHash, name });

    // Bridge to stat-models: create a students row so BKT/diagnosis/onboarding
    // endpoints can immediately accept this user's UUID as student_id.
    const pool = require('../config/db');
    await pool.query(
      `INSERT INTO students (student_id, user_id) VALUES ($1, $2) ON CONFLICT (student_id) DO NOTHING`,
      [user.id, user.id]
    );

    const accessToken = await issueTokens(res, user, req);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await userModel.findByEmail(email);
    const valid = user && (await comparePassword(password, user.password_hash));
    if (!valid) {
      // Same message whether the email doesn't exist or the password is wrong —
      // don't leak which one it was.
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      email_verified: user.email_verified,
      created_at: user.created_at,
    };

    const accessToken = await issueTokens(res, publicUser, req);
    res.json({ user: publicUser, accessToken });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    const tokenHash = hashToken(rawToken);
    const tokenRow = await refreshTokenModel.findValid(tokenHash);
    if (!tokenRow) {
      res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
      return res.status(401).json({ error: 'Refresh token invalid or expired.' });
    }

    // Rotate: revoke the used token and issue a brand new one (mitigates replay).
    await refreshTokenModel.revoke(tokenHash);

    const user = await userModel.findById(tokenRow.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    const accessToken = await issueTokens(res, user, req);
    res.json({ user, accessToken });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawToken) {
      await refreshTokenModel.revoke(hashToken(rawToken));
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

// Called after passport's Google strategy has already found/created the user (req.user).
async function googleCallback(req, res, next) {
  try {
    const user = req.user;
    const accessToken = await issueTokens(res, user, req);

    // Redirect back to the frontend with the access token as a query param.
    // The frontend grabs it, stores it in memory, and drops it from the URL.
    const redirectUrl = new URL('/oauth/callback', process.env.FRONTEND_URL);
    redirectUrl.searchParams.set('accessToken', accessToken);
    res.redirect(redirectUrl.toString());
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me, googleCallback };
