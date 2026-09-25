"""
Optional JWT authentication for the stat-models API.

When REQUIRE_AUTH=true (env), every request (except /health, /docs, /redoc, /openapi.json)
must carry a valid `Authorization: Bearer <token>` header issued by the
auth-service. The decoded token's `sub` field is the user UUID, which
doubles as the student_id in the statmodels schema.

When REQUIRE_AUTH is unset or false (the default), all requests pass
through unauthenticated — this preserves the zero-friction dev experience
and doesn't break demo_trace.py, seeds, tests, or Swagger "Try it out".
"""
import os
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

REQUIRE_AUTH = os.environ.get("REQUIRE_AUTH", "false").lower() == "true"
JWT_SECRET = os.environ.get("JWT_ACCESS_SECRET") or os.environ.get("JWT_SECRET", "dev-jwt-secret-change-in-prod")
JWT_ALGORITHM = "HS256"

PUBLIC_PATHS = {"/health", "/docs", "/redoc", "/openapi.json"}


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    Starlette middleware that optionally validates Bearer JWTs.
    When active, sets request.state.user_id and request.state.user_email
    from the decoded token so downstream endpoints can use them.
    """

    async def dispatch(self, request: Request, call_next):
        # Skip auth entirely when not required
        if not REQUIRE_AUTH:
            return await call_next(request)

        # Public paths are always open
        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Missing or invalid Authorization header",
            )

        token = auth_header[7:]
        try:
            import jwt  # lazy-imported so dev runs without PyJWT when REQUIRE_AUTH=false
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
        except ImportError:
            raise HTTPException(status_code=500, detail="PyJWT package is required when REQUIRE_AUTH=true")
        except Exception as exc:
            # Handles jwt.ExpiredSignatureError, jwt.InvalidTokenError, etc.
            if "expired" in str(exc).lower():
                raise HTTPException(status_code=401, detail="Token has expired")
            raise HTTPException(status_code=401, detail="Invalid token")

        return await call_next(request)
