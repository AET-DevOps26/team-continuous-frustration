from __future__ import annotations


from ..base.base_model import BaseModel


class Body_documents_upload_post_api_v1_documents_upload_post(BaseModel):
    """
    Strongly-typed model class for Body_documents_upload_post_api_v1_documents_upload_post

    Generated from OpenAPI/Swagger specification
    """

    @property
    def file(self) -> str:
        """Get file"""
        return self._data.get("file")

    @file.setter
    def file(self, value: str):
        """Set file"""
        self._data["file"] = value
