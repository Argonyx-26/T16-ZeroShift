const pool = require('../config/db');

const PUBLIC_COLUMNS = 'id, email, name, avatar_url, email_verified, created_at';

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
    email.toLowerCase(),
  ]);
  return rows[0] || null;
}

async function findByGoogleId(googleId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [
    googleId,
  ]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

async function createWithPassword({ email, passwordHash, name }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email.toLowerCase(), passwordHash, name]
  );
  return rows[0];
}

async function createWithGoogle({ email, name, googleId, avatarUrl }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, name, google_id, avatar_url, email_verified)
     VALUES ($1, $2, $3, $4, TRUE)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email.toLowerCase(), name, googleId, avatarUrl]
  );
  return rows[0];
}

// Links a Google identity to an existing email/password account (same email, first Google login).
async function linkGoogleAccount({ userId, googleId, avatarUrl }) {
  const { rows } = await pool.query(
    `UPDATE users
     SET google_id = $1, avatar_url = COALESCE(avatar_url, $2), email_verified = TRUE
     WHERE id = $3
     RETURNING ${PUBLIC_COLUMNS}`,
    [googleId, avatarUrl, userId]
  );
  return rows[0];
}

module.exports = {
  findByEmail,
  findByGoogleId,
  findById,
  createWithPassword,
  createWithGoogle,
  linkGoogleAccount,
};
