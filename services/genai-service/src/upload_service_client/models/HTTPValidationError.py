from __future__ import annotations

from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from .ValidationError import ValidationError

from ..base.base_model import BaseModel


class HTTPValidationError(BaseModel):
    """
    Strongly-typed model class for HTTPValidationError

    Generated from OpenAPI/Swagger specification
    """

    @property
    def detail(self) -> List["ValidationError"]:
        """Get detail"""
        return self._data.get("detail")

    @detail.setter
    def detail(self, value: List["ValidationError"]):
        """Set detail"""
        self._data["detail"] = value
