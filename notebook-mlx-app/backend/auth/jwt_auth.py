"""
JWT Authentication for NotebookMLX API

This module provides JWT token-based authentication for API endpoints.
"""
import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel


# Security configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
if not SECRET_KEY:
    # Generate a random key if not set (for development only)
    import secrets
    SECRET_KEY = secrets.token_urlsafe(32)
    print("WARNING: Using auto-generated JWT_SECRET_KEY. Set JWT_SECRET_KEY environment variable for production!")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer token security
security = HTTPBearer(auto_error=False)


class TokenData(BaseModel):
    """Token payload data"""
    user_id: str
    username: Optional[str] = None
    scopes: list[str] = []


class User(BaseModel):
    """User model"""
    user_id: str
    username: str
    email: Optional[str] = None
    disabled: bool = False


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token

    Args:
        data: Dictionary containing token claims (must include 'user_id')
        expires_delta: Optional expiration time delta

    Returns:
        Encoded JWT token
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)

    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> TokenData:
    """
    Decode and validate a JWT token

    Args:
        token: JWT token string

    Returns:
        TokenData object

    Raises:
        HTTPException: If token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

        token_data = TokenData(
            user_id=user_id,
            username=payload.get("username"),
            scopes=payload.get("scopes", [])
        )

        return token_data

    except JWTError:
        raise credentials_exception


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> Optional[str]:
    """
    Get current authenticated user from JWT token

    Args:
        credentials: HTTP Authorization credentials

    Returns:
        user_id string or None if auth is disabled

    Raises:
        HTTPException: If token is invalid
    """
    # Check if authentication is enabled
    auth_enabled = os.getenv("ENABLE_AUTH", "false").lower() == "true"

    if not auth_enabled:
        # Authentication disabled - allow all requests
        return "anonymous"

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    token_data = decode_token(token)

    return token_data.user_id


async def get_current_active_user(
    current_user: str = Depends(get_current_user)
) -> str:
    """
    Get current active user (additional validation can be added here)

    Args:
        current_user: Current user ID from token

    Returns:
        user_id string
    """
    # Additional user validation logic can be added here
    # For example, check if user is disabled in database

    return current_user


def require_auth(
    current_user: str = Depends(get_current_active_user)
) -> str:
    """
    Dependency to require authentication for an endpoint

    Usage:
        @app.get("/protected")
        async def protected_endpoint(user_id: str = Depends(require_auth)):
            return {"user_id": user_id}
    """
    return current_user


# Optional: Add role-based access control
def require_scope(required_scope: str):
    """
    Create a dependency that requires a specific scope

    Args:
        required_scope: The scope required to access the endpoint

    Returns:
        Dependency function
    """
    async def scope_checker(
        credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
    ) -> str:
        auth_enabled = os.getenv("ENABLE_AUTH", "false").lower() == "true"

        if not auth_enabled:
            return "anonymous"

        if credentials is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = credentials.credentials
        token_data = decode_token(token)

        if required_scope not in token_data.scopes:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required scope: {required_scope}"
            )

        return token_data.user_id

    return scope_checker
