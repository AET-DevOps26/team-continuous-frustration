# coding: utf-8

from typing import ClassVar, Dict, List, Tuple  # noqa: F401

from openapi_server.models.auth_response import AuthResponse
from openapi_server.models.login_request import LoginRequest
from openapi_server.models.register_request import RegisterRequest


class BaseDefaultApi:
    subclasses: ClassVar[Tuple] = ()

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        BaseDefaultApi.subclasses = BaseDefaultApi.subclasses + (cls,)
    async def api_v1_auth_register_post(
        self,
        register_request: RegisterRequest,
    ) -> AuthResponse:
        ...


    async def api_v1_auth_login_post(
        self,
        login_request: LoginRequest,
    ) -> AuthResponse:
        ...
