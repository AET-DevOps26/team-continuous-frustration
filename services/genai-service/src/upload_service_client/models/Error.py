from __future__ import annotations


from ..base.base_model import BaseModel


class Error(BaseModel):
    """
    Strongly-typed model class for Error

    Generated from OpenAPI/Swagger specification
    """

    @property
    def message(self) -> str:
        """Get message"""
        return self._data.get("message")

    @message.setter
    def message(self, value: str):
        """Set message"""
        self._data["message"] = value

    @property
    def code(self) -> str:
        """Get code"""
        return self._data.get("code")

    @code.setter
    def code(self, value: str):
        """Set code"""
        self._data["code"] = value
