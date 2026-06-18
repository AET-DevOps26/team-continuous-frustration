# coding: utf-8

import os
from typing import Optional

import httpx
from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from openapi_server.models.extra_models import TokenModel

# auto_error=False so missing Bearer header doesn't auto-reject cookie-based sessions
bearer_auth = HTTPBearer(auto_error=False)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8081")


def get_token_bearerAuth(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_auth),
    session_id: Optional[str] = Cookie(None),
) -> TokenModel:
    """Validate the request against the auth-service using the session cookie."""
    if not session_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        response = httpx.get(
            f"{AUTH_SERVICE_URL}/api/v1/auth/me",
            cookies={"session_id": session_id},
            timeout=5.0,
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )

    user = response.json()
    return TokenModel(sub=user.get("id", ""))
