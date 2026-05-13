# coding: utf-8

from fastapi.testclient import TestClient


from openapi_server.models.auth_response import AuthResponse  # noqa: F401
from openapi_server.models.login_request import LoginRequest  # noqa: F401
from openapi_server.models.register_request import RegisterRequest  # noqa: F401


def test_api_v1_auth_register_post(client: TestClient):
    """Test case for api_v1_auth_register_post

    Register new user
    """
    register_request = {"password":"password","email":"email","username":"username"}

    headers = {
    }
    # uncomment below to make a request
    #response = client.request(
    #    "POST",
    #    "/api/v1/auth/register",
    #    headers=headers,
    #    json=register_request,
    #)

    # uncomment below to assert the status code of the HTTP response
    #assert response.status_code == 200


def test_api_v1_auth_login_post(client: TestClient):
    """Test case for api_v1_auth_login_post

    Login user
    """
    login_request = {"password":"password","email":"email"}

    headers = {
    }
    # uncomment below to make a request
    #response = client.request(
    #    "POST",
    #    "/api/v1/auth/login",
    #    headers=headers,
    #    json=login_request,
    #)

    # uncomment below to assert the status code of the HTTP response
    #assert response.status_code == 200

