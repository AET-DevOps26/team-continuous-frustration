import os
from typing import Optional

import jwt
from fastapi import Cookie, HTTPException, status

from openapi_server.models.extra_models import TokenModel

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-min-32-chars!!")
JWT_ALGORITHM = "HS256"


def get_token_bearerAuth(
    access_token: Optional[str] = Cookie(default=None),
) -> TokenModel:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    try:
        payload = jwt.decode(access_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return TokenModel(sub=payload["sub"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )
