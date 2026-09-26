require('dotenv').config();

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const userModel = require('../models/user.model');
const pool = require('./db');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName || email;
        const avatarUrl = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error('Google account has no accessible email.'));
        }

        // 1. Already linked to this Google account
        let user = await userModel.findByGoogleId(googleId);
        if (user) return done(null, user);

        // 2. An account with this email already exists (signed up via password) — link it
        const existingByEmail = await userModel.findByEmail(email);
        if (existingByEmail) {
          user = await userModel.linkGoogleAccount({
            userId: existingByEmail.id,
            googleId,
            avatarUrl,
          });
          return done(null, user);
        }

        // 3. Brand new user
        user = await userModel.createWithGoogle({ email, name, googleId, avatarUrl });

        // Bridge to stat-models: create students row for this new OAuth user
        await pool.query(
          `INSERT INTO students (student_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [user.id, user.id]
        );

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// We use JWTs, not sessions, so passport's session serialization is unused —
// but passport requires these to be defined when any strategy is registered.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = passport;
