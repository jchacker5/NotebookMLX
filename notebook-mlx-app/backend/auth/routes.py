"""
Authentication routes for login, token generation, and user management
"""
import os
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from .jwt_auth import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_HOURS
)


router = APIRouter(prefix="/api/auth", tags=["authentication"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    user_id: str
    username: str
    email: Optional[str] = None


# Simple in-memory user store for development
# In production, replace with database
_USERS_DB = {}


def get_user(username: str) -> Optional[dict]:
    """Get user from database"""
    return _USERS_DB.get(username)


def create_user(username: str, password: str, email: Optional[str] = None) -> dict:
    """Create a new user"""
    if username in _USERS_DB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

    user_id = f"user_{len(_USERS_DB) + 1}"
    user = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "hashed_password": get_password_hash(password),
        "disabled": False
    }

    _USERS_DB[username] = user
    return user


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Login endpoint - returns JWT access token

    For development/testing when auth is disabled, you can use any credentials
    """
    auth_enabled = os.getenv("ENABLE_AUTH", "false").lower() == "true"

    if not auth_enabled:
        # Auth disabled - generate token for any user
        access_token = create_access_token(
            data={
                "user_id": "dev_user",
                "username": credentials.username,
                "scopes": ["read", "write", "admin"]
            }
        )
        return TokenResponse(
            access_token=access_token,
            expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600
        )

    # Auth enabled - validate credentials
    user = get_user(credentials.username)

    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.get("disabled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )

    # Create access token
    access_token = create_access_token(
        data={
            "user_id": user["user_id"],
            "username": user["username"],
            "scopes": ["read", "write"]  # Can be customized per user
        }
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_HOURS * 3600
    )


@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """
    Register a new user account

    Only available when authentication is enabled
    """
    auth_enabled = os.getenv("ENABLE_AUTH", "false").lower() == "true"

    if not auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration not available when authentication is disabled"
        )

    # Validate username format
    if len(user_data.username) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters"
        )

    # Validate password strength
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )

    # Create user
    user = create_user(
        username=user_data.username,
        password=user_data.password,
        email=user_data.email
    )

    return UserResponse(
        user_id=user["user_id"],
        username=user["username"],
        email=user["email"]
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: str = Depends(get_current_active_user)):
    """
    Get current authenticated user information
    """
    auth_enabled = os.getenv("ENABLE_AUTH", "false").lower() == "true"

    if not auth_enabled:
        return UserResponse(
            user_id="dev_user",
            username="Developer",
            email="dev@example.com"
        )

    # Find user by ID
    for username, user in _USERS_DB.items():
        if user["user_id"] == current_user:
            return UserResponse(
                user_id=user["user_id"],
                username=user["username"],
                email=user["email"]
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="User not found"
    )


@router.post("/logout")
async def logout(current_user: str = Depends(get_current_active_user)):
    """
    Logout endpoint (client should discard token)

    Note: JWT tokens remain valid until expiration.
    For true token revocation, implement a token blacklist.
    """
    return {
        "status": "success",
        "message": "Logged out successfully. Please discard your access token."
    }
