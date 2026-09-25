// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  // Postgres unique-violation (e.g. duplicate email) — surface as 409, not 500
  if (err.code === '23505') {
    return res.status(409).json({ error: 'That email is already registered.' });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Something went wrong.' : err.message;
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
