import tempfile
import os
from markitdown import MarkItDown


def convert_to_markdown(file_bytes: bytes, file_extension: str) -> str:
    """
    Writes file bytes to a temporary file, converts to markdown using MarkItDown,
    and returns the markdown string.
    """
    md = MarkItDown()

    # Needs a temp file because MarkItDown works with file paths
    # Use extension to hint MarkItDown of the file type
    fd, temp_path = tempfile.mkstemp(suffix=file_extension)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(file_bytes)

        result = md.convert(temp_path)
        return result.text_content
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
