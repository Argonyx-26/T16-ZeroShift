# Kalpavikas Auth Service

Standalone Express auth service: email/password + Google OAuth, JWT access tokens,
rotating httpOnly-cookie refresh tokens, Postgres for storage.

## 1. Install

```bash
cd auth-service
npm install
```

## 2. Configure

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` to point at the same Postgres DB used by the project
(`argonyx` is the default in the repo), plus `JWT_ACCESS_SECRET` /
`JWT_REFRESH_SECRET` (any long random strings — `openssl rand -hex 32` works),
and the `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from the
[Google Cloud Console](https://console.cloud.google.com/apis/credentials)
(OAuth client type: "Web application", authorized redirect URI matching
`GOOGLE_CALLBACK_URL`).

## 3. Apply the schema

```bash
npm run migrate
```

This runs the auth schema in `db/schema.sql` against the same Postgres DB used
by the app. The project-level table set is bootstrapped separately from the repo
root via `db/postgres/scripts/init_db.sh`, so the auth service only creates the
`users` and `refresh_tokens` tables it owns.

## 4. Run

```bash
npm run dev      # with nodemon
# or
npm start
```

Service comes up on `http://localhost:4000` (health check at `/health`).

---

## How the tokens work

- **Access token**: short-lived JWT (15 min default), returned in the JSON
  response body. Store it in memory on the frontend (e.g. a React context /
  store) — **not** localStorage, to limit XSS exposure. Send it as
  `Authorization: Bearer <token>` on protected requests.
- **Refresh token**: opaque random string, set as an `httpOnly`, `sameSite=lax`
  cookie scoped to `/api/auth`. Its hash (not the raw value) is stored in the
  `refresh_tokens` table, so a token can be individually revoked without
  needing a JWT blocklist. Each call to `/api/auth/refresh` rotates it
  (old one is revoked, a new one issued) to limit replay if one ever leaks.
- Because the refresh token lives in a cookie, `credentials: true` /
  `withCredentials: true` must be set on both the CORS config (already done)
  and every `fetch`/`axios` call from the frontend.

## API

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | – | `{ email, password, name }` | Creates user, sets refresh cookie, returns `{ user, accessToken }` |
| POST | `/api/auth/login` | – | `{ email, password }` | Same response shape as register |
| POST | `/api/auth/refresh` | refresh cookie | – | Rotates the refresh token, returns a new `{ user, accessToken }` |
| POST | `/api/auth/logout` | refresh cookie | – | Revokes the refresh token, clears the cookie |
| GET | `/api/auth/me` | `Authorization: Bearer` | – | Returns the current user |
| GET | `/api/auth/google` | – | – | Redirects to Google's consent screen |
| GET | `/api/auth/google/callback` | – | – | Google redirects here; service then redirects to `FRONTEND_URL/oauth/callback?accessToken=...` |

### Frontend integration sketch (for when we build the auth page)

- **Email/password**: `POST` to `/register` or `/login` with `credentials: 'include'`, keep `accessToken` in memory/context.
- **Google button**: just `<a href="http://localhost:4000/api/auth/google">Continue with Google</a>` — no client-side OAuth library needed, the redirect flow does the work.
- **`/oauth/callback` page**: reads `?accessToken=` from the URL, stores it, strips it from the URL, redirects to the app.
- **Silent refresh**: on app load (and on a 401 with `code: TOKEN_EXPIRED`), call `POST /api/auth/refresh` with `credentials: 'include'` to get a fresh access token — the cookie makes this work without the user re-entering anything.
- **Logout**: `POST /api/auth/logout` with `credentials: 'include'`, then drop the in-memory access token.

## Security notes / what's deliberately included

- Passwords hashed with bcrypt (cost 12), never stored or logged raw.
- Refresh tokens stored as SHA-256 hashes — a DB leak doesn't hand out usable tokens.
- Refresh token rotation on every `/refresh` call.
- Rate limiting on `/register` and `/login` (20 requests / 15 min per IP).
- Generic "Invalid email or password" message — doesn't reveal whether an email is registered.
- `users_has_login_method` DB constraint prevents a user row with neither a password nor a Google ID.
- Google-first signups get auto-linked to an existing password account with the same email, rather than creating a duplicate user.

## Not included yet (flag if you need these before the demo)

- Email verification / password reset flow (needs an email provider — SendGrid, Resend, etc.)
- "Log out of all devices" endpoint (the DB model supports it — `refreshTokenModel.revokeAllForUser` — just needs a route)
- Refresh token reuse detection (if a revoked/old refresh token is presented, that's a signal of theft — worth alerting/revoking the whole session family before a real deployment)
