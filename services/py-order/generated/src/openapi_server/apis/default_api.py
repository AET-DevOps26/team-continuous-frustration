# coding: utf-8

from typing import Dict, List  # noqa: F401
import importlib
import pkgutil

from openapi_server.apis.default_api_base import BaseDefaultApi
import openapi_server.impl

from fastapi import (  # noqa: F401
    APIRouter,
    Body,
    Cookie,
    Depends,
    Form,
    Header,
    HTTPException,
    Path,
    Query,
    Response,
    Security,
    status,
)

from openapi_server.models.extra_models import TokenModel  # noqa: F401
from openapi_server.models.auth_response import AuthResponse
from openapi_server.models.login_request import LoginRequest
from openapi_server.models.register_request import RegisterRequest


router = APIRouter()

ns_pkg = openapi_server.impl
for _, name, _ in pkgutil.iter_modules(ns_pkg.__path__, ns_pkg.__name__ + "."):
    importlib.import_module(name)


@router.post(
    "/api/v1/auth/register",
    responses={
        200: {"model": AuthResponse, "description": "User registered successfully"},
    },
    tags=["default"],
    summary="Register new user",
    response_model_by_alias=True,
)
async def api_v1_auth_register_post(
    register_request: RegisterRequest = Body(None, description=""),
) -> AuthResponse:
    if not BaseDefaultApi.subclasses:
        raise HTTPException(status_code=500, detail="Not implemented")
    return await BaseDefaultApi.subclasses[0]().api_v1_auth_register_post(register_request)


@router.post(
    "/api/v1/auth/login",
    responses={
        200: {"model": AuthResponse, "description": "Login successful"},
    },
    tags=["default"],
    summary="Login user",
    response_model_by_alias=True,
)
async def api_v1_auth_login_post(
    login_request: LoginRequest = Body(None, description=""),
) -> AuthResponse:
    if not BaseDefaultApi.subclasses:
        raise HTTPException(status_code=500, detail="Not implemented")
    return await BaseDefaultApi.subclasses[0]().api_v1_auth_login_post(login_request)
