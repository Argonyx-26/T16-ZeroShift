const pool = require('../config/db');

async function store({ userId, tokenHash, expiresAt, userAgent, ipAddress }) {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, userAgent || null, ipAddress || null]
  );
}

// Returns the token row only if it is present, unexpired, and not revoked.
async function findValid(tokenHash) {
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return rows[0] || null;
}

async function revoke(tokenHash) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`,
    [tokenHash]
  );
}

// Used on password change / "log out everywhere".
async function revokeAllForUser(userId) {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
}

module.exports = { store, findValid, revoke, revokeAllForUser };
