from __future__ import annotations

import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Keep auth errors consistent across endpoints.
UNAUTHORIZED_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

security_scheme = HTTPBearer(auto_error=False)


def _scrypt_digest(password: str, salt: bytes) -> bytes:
    return hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=2**14,
        r=8,
        p=1,
        dklen=32,
    )


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = _scrypt_digest(password, salt)
    encoded_salt = base64.b64encode(salt).decode("ascii")
    encoded_digest = base64.b64encode(digest).decode("ascii")
    return f"scrypt${encoded_salt}${encoded_digest}"


def verify_password(plain_password: str, stored_password: str) -> bool:
    if stored_password.startswith("scrypt$"):
        parts = stored_password.split("$")
        if len(parts) != 3:
            return False

        try:
            salt = base64.b64decode(parts[1])
            expected = base64.b64decode(parts[2])
        except Exception:
            return False

        actual = _scrypt_digest(plain_password, salt)
        return hmac.compare_digest(actual, expected)

    # Backward compatibility for legacy plaintext rows.
    return hmac.compare_digest(plain_password, stored_password)


def create_access_token(
    *,
    subject_email: str,
    role: str,
    extra_claims: dict | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    now = datetime.now(timezone.utc)
    expire_at = now + (expires_delta or timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES))

    payload: dict = {
        "sub": subject_email.strip().lower(),
        "role": role.strip().upper(),
        "iat": int(now.timestamp()),
        "exp": int(expire_at.timestamp()),
    }

    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UNAUTHORIZED_EXCEPTION

    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except Exception as exc:
        raise UNAUTHORIZED_EXCEPTION from exc

    email = payload.get("sub")
    role = payload.get("role")

    if not isinstance(email, str) or not email.strip() or not isinstance(role, str) or not role.strip():
        raise UNAUTHORIZED_EXCEPTION

    return {
        "email": email.strip().lower(),
        "role": role.strip().upper(),
        "claims": payload,
    }
