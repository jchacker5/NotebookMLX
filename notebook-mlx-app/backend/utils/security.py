"""
Security utilities for input sanitization and validation
"""
import bleach
import re
from typing import Optional


def sanitize_text(text: str, max_length: int = 5000) -> str:
    """
    Sanitize user text input by removing HTML tags and limiting length

    Args:
        text: The input text to sanitize
        max_length: Maximum allowed length for the text

    Returns:
        Sanitized text string
    """
    if not text:
        return ""

    # Truncate to max length
    truncated = text[:max_length]

    # Remove all HTML tags and scripts
    clean_text = bleach.clean(truncated, tags=[], strip=True)

    return clean_text


def sanitize_filename(filename: str, max_length: int = 255) -> str:
    """
    Sanitize filename to prevent path traversal and invalid characters

    Args:
        filename: The input filename
        max_length: Maximum allowed length

    Returns:
        Sanitized filename
    """
    if not filename:
        return "unnamed_file"

    # Remove path separators
    name = filename.replace('/', '_').replace('\\', '_')

    # Remove any null bytes
    name = name.replace('\x00', '')

    # Only allow alphanumeric, dash, underscore, dot
    name = re.sub(r'[^a-zA-Z0-9._-]', '_', name)

    # Prevent directory traversal attempts
    name = name.replace('..', '_')

    # Truncate to max length while preserving extension
    if len(name) > max_length:
        parts = name.rsplit('.', 1)
        if len(parts) == 2:
            ext = parts[1][:10]  # Limit extension length
            base = parts[0][:max_length - len(ext) - 1]
            name = f"{base}.{ext}"
        else:
            name = name[:max_length]

    return name


def validate_email(email: str) -> bool:
    """
    Validate email format

    Args:
        email: Email address to validate

    Returns:
        True if valid, False otherwise
    """
    if not email:
        return False

    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email)) and len(email) <= 254


def validate_username(username: str, min_length: int = 3, max_length: int = 32) -> bool:
    """
    Validate username format

    Args:
        username: Username to validate
        min_length: Minimum allowed length
        max_length: Maximum allowed length

    Returns:
        True if valid, False otherwise
    """
    if not username:
        return False

    # Only alphanumeric, dash, underscore
    pattern = r'^[a-zA-Z0-9_-]+$'
    return (
        bool(re.match(pattern, username)) and
        min_length <= len(username) <= max_length
    )


def sanitize_url(url: str, allowed_schemes: Optional[list] = None) -> Optional[str]:
    """
    Sanitize and validate URL

    Args:
        url: URL to sanitize
        allowed_schemes: List of allowed URL schemes (default: http, https)

    Returns:
        Sanitized URL or None if invalid
    """
    if not url:
        return None

    if allowed_schemes is None:
        allowed_schemes = ['http', 'https']

    # Basic URL validation
    url = url.strip()

    # Check scheme
    for scheme in allowed_schemes:
        if url.startswith(f"{scheme}://"):
            return url

    return None


def sanitize_chat_message(message: str) -> str:
    """
    Sanitize chat messages while preserving some formatting

    Args:
        message: Chat message to sanitize

    Returns:
        Sanitized message
    """
    if not message:
        return ""

    # Limit length
    message = message[:10000]

    # Allow basic formatting tags but strip everything else
    allowed_tags = ['b', 'i', 'u', 'code', 'pre']
    clean = bleach.clean(
        message,
        tags=allowed_tags,
        strip=True
    )

    return clean


def sanitize_voice_name(name: str) -> str:
    """
    Sanitize voice model names

    Args:
        name: Voice name to sanitize

    Returns:
        Sanitized voice name
    """
    if not name:
        return "unnamed_voice"

    # Only allow alphanumeric, dash, underscore
    clean = re.sub(r'[^a-zA-Z0-9_-]', '_', name)

    # Limit length
    clean = clean[:64]

    # Ensure it doesn't start with dash or underscore
    clean = clean.lstrip('-_')

    if not clean:
        return "unnamed_voice"

    return clean
