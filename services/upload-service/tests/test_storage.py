from unittest.mock import patch

from openapi_server.storage import convert_to_markdown

# ----------------------------------------------------------------------
# 1. Tests for storage.py
# ----------------------------------------------------------------------

def test_convert_to_markdown():
    with patch("openapi_server.storage.MarkItDown") as MockMarkItDown:
        mock_instance = MockMarkItDown.return_value
        mock_instance.convert.return_value.text_content = "# Sample Markdown Output"

        result = convert_to_markdown(b"mock file content", ".txt")
        assert result == "# Sample Markdown Output"
        MockMarkItDown.assert_called_once()
        mock_instance.convert.assert_called_once()