from __future__ import annotations

from typing import List

from ..base.base_model import BaseModel


class ValidationError(BaseModel):
    """
    Strongly-typed model class for ValidationError

    Generated from OpenAPI/Swagger specification
    """

    @property
    def loc(self) -> List[str]:
        """Get loc"""
        return self._data.get("loc")

    @loc.setter
    def loc(self, value: List[str]):
        """Set loc"""
        self._data["loc"] = value

    @property
    def msg(self) -> str:
        """Get msg"""
        return self._data.get("msg")

    @msg.setter
    def msg(self, value: str):
        """Set msg"""
        self._data["msg"] = value

    @property
    def type(self) -> str:
        """Get type"""
        return self._data.get("type")

    @type.setter
    def type(self, value: str):
        """Set type"""
        self._data["type"] = value
