import requests
import logging
from typing import Dict, Any
from .models.Body_documents_upload_post_api_v1_documents_upload_post import (
    Body_documents_upload_post_api_v1_documents_upload_post,
)
from .models.UploadResponse import UploadResponse


class UploadServiceClientAPIs:
    """
    Strongly-typed API client for upload-service-client

    This class provides methods to interact with the upload-service-client API endpoints.
    All methods are strongly-typed with automatic model serialization/deserialization.
    """

    def __init__(
        self, base_url: str = None, auth_token: str = None, tenant: str = None
    ):
        """
        Initialize the API client

        Args:
            base_url: Base URL for the API service (default: not specified)
            auth_token: Authentication token for API requests
            tenant: Tenant ID for multi-tenant APIs
        """
        self.logger = logging.getLogger(__name__)
        self._tenant = tenant or ""
        self._base_url = base_url or ""
        self._headers = {
            "Content-Type": "application/json",
            "User-Agent": "GeneratedApiClient/upload-service-client",
        }

        if auth_token:
            self.set_auth_token(auth_token)

    def set_base_url(self, base_url: str):
        """Set the base URL for API requests"""
        self._base_url = base_url.rstrip("/")
        self.logger.info(f"Base URL set to: {self._base_url}")

    def set_tenant(self, tenant: str):
        """Set the tenant ID"""
        self._tenant = tenant
        self.logger.info(f"Tenant set to: {tenant}")

    def get_tenant(self) -> str:
        """Get the current tenant ID"""
        return self._tenant

    def set_auth_token(self, token: str):
        """Set the authentication token"""
        self._headers["Authorization"] = f"Bearer {token}"
        self.logger.info("Authentication token updated")

    def get_headers(self) -> Dict[str, str]:
        """Get the current headers"""
        return self._headers.copy()

    def _make_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """
        Make an HTTP request with error handling and logging

        Args:
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            url: Request URL
            **kwargs: Additional arguments for requests

        Returns:
            requests.Response: The response object

        Raises:
            requests.exceptions.RequestException: For request errors
        """
        try:
            self.logger.debug(f"Making {method} request to: {url}")

            # Ensure headers are included
            if "headers" not in kwargs:
                kwargs["headers"] = self.get_headers()

            response = requests.request(method, url, **kwargs)

            # Log response details
            self.logger.debug(f"Response status: {response.status_code}")

            if not response.ok:
                self.logger.error(
                    f"Request failed: {response.status_code} - {response.text}"
                )
                response.raise_for_status()

            return response

        except requests.exceptions.RequestException as e:
            self.logger.error(f"Request error: {e}")
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error: {e}")
            raise

    def health_documents_health_get(self) -> Dict[str, Any]:
        """Health"""
        url = f"{self._base_url}/api/v1/documents/health"
        response = self._make_request("GET", url, headers=self.get_headers())
        return response.json()

    def documents_upload_post_documents_upload_post(
        self, payload: Body_documents_upload_post_api_v1_documents_upload_post
    ) -> UploadResponse:
        """Upload a document for processing"""
        url = f"{self._base_url}/api/v1/documents/upload"
        response = self._make_request(
            "POST", url, headers=self.get_headers(), data=payload
        )
        return UploadResponse.from_dict(response.json())

    def documents_get_documents_upload_id_get(self, upload_id: str) -> str:
        """Get a document"""
        url = f"{self._base_url}/api/v1/documents/{upload_id}"
        response = self._make_request("GET", url, headers=self.get_headers())
        return response.text
