const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

function comparePassword(plain, hash) {
  if (!hash) return Promise.resolve(false); // OAuth-only user has no password_hash
  return bcrypt.compare(plain, hash);
}

// Minimum bar: 8+ chars, at least one letter and one number.
// Keep this in sync with any client-side validation.
function isPasswordStrongEnough(plain) {
  return typeof plain === 'string' && /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(plain);
}

module.exports = { hashPassword, comparePassword, isPasswordStrongEnough };
