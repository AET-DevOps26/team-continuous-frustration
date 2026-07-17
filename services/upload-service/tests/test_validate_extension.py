"""Unit tests for the file-extension validation logic."""

import pytest
from fastapi import HTTPException

from openapi_server.storage import validate_extension


@pytest.mark.parametrize("filename,expected", [
    ("notes.txt", ".txt"),
    ("slides.pdf", ".pdf"),
    ("report.DOCX", ".docx"),
    ("readme.md", ".md"),
])
def test_allowed_extensions_are_returned_lowercased(filename, expected):
    assert validate_extension(filename) == expected


def test_missing_filename_returns_empty():
    assert validate_extension(None) == ""
    assert validate_extension("") == ""


def test_unsupported_extension_raises_415():
    with pytest.raises(HTTPException) as exc:
        validate_extension("malware.exe")
    assert exc.value.status_code == 415
