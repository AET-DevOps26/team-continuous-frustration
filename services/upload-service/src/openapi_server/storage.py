# coding: utf-8

import os
from typing import Optional

import tempfile
import psycopg2
from markitdown import MarkItDown

from fastapi import HTTPException, status


ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx", ".pptx"}
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB", "uploaddocumentdb")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")

DSN = f"dbname='{POSTGRES_DB}' user='{POSTGRES_USER}' host='{POSTGRES_HOST}' password='{POSTGRES_PASSWORD}'"

try:
    conn = psycopg2.connect(DSN)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents
        (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            filename VARCHAR(255),
            content TEXT,
            date_uploaded VARCHAR(255)
        )
    """)
    conn.commit()
    cursor.close()
    conn.close()
except Exception as e:
    print("Database is not ready:", e)


def store_markdown(markdown_content: str, filename: str, date_uploaded: str) -> str:
    with psycopg2.connect(DSN) as conn:
        with conn.cursor() as curs:
            curs.execute(
                """
                INSERT INTO documents (filename, content, date_uploaded)
                VALUES (%s, %s, %s)
                RETURNING id
            """,
                (filename, markdown_content, date_uploaded),
            )
            result = curs.fetchone()
            conn.commit()
    return result[0]


def get_document(id: str) -> Optional[str]:
    with psycopg2.connect(DSN) as conn:
        with conn.cursor() as curs:
            curs.execute("SELECT content FROM documents WHERE id = %s", (id,))
            result = curs.fetchone()
            return result[0] if result else None


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


def validate_extension(filename: Optional[str]) -> str:
    if not filename:
        return ""
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type",
        )
    return ext
