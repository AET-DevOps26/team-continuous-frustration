from __future__ import annotations


from ..base.base_model import BaseModel


class UploadResponse(BaseModel):
    """
    Strongly-typed model class for UploadResponse

    Generated from OpenAPI/Swagger specification
    """

    @property
    def upload_id(self) -> str:
        """Get upload_id"""
        return self._data.get("upload_id")

    @upload_id.setter
    def upload_id(self, value: str):
        """Set upload_id"""
        self._data["upload_id"] = value
