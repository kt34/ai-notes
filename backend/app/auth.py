from typing import Optional
from pydantic import BaseModel, EmailStr
from .db import supabase

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    user_id: str
    email: str
    access_token: str
    refresh_token: Optional[str] = None

class RegistrationSuccessResponse(BaseModel):
    message: str
    user_id: str
    email: str

async def register_user(user_data: UserCreate) -> AuthResponse:
    """Register a new user with Supabase Auth."""
    try:
        # Sign up the user
        user_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                }
            }
        })
        
        if not user_response.user:
            raise Exception("Failed to create user")

        message_to_user = "Registration successful. Please check your email to confirm your account."

        return RegistrationSuccessResponse(
            message=message_to_user,
            user_id=user_response.user.id,
            email=user_response.user.email
        )

    except Exception as e:
        # Try to provide a more specific error message if possible
        error_message = str(e)
        if hasattr(e, 'message') and e.message: # For GoTrueApiError (common from supabase-py)
             error_message = e.message
        elif hasattr(e, 'json') and callable(e.json): # For some HTTP errors from httpx
            try:
                error_detail = e.json()
                # Common error keys from Supabase/GoTrue errors
                if 'error_description' in error_detail:
                    error_message = error_detail['error_description']
                elif 'msg' in error_detail: # Sometimes 'msg' is used
                     error_message = error_detail['msg']
                elif 'message' in error_detail: # General 'message' key
                    error_message = error_detail['message']
            except:
                pass # Fallback to str(e) if parsing json fails
        
        # Common Supabase specific error messages you might want to relay more clearly:
        if "User already registered" in error_message:
            error_message = "This email address is already registered."
        elif "Password should be at least 6 characters" in error_message:
            error_message = "Password should be at least 6 characters long."
        
        raise Exception(f"Registration failed: {error_message}")

async def login_user(user_data: UserLogin) -> AuthResponse:
    """Log in an existing user with Supabase Auth."""
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": user_data.email,
            "password": user_data.password
        })
        
        return AuthResponse(
            user_id=auth_response.user.id,
            email=auth_response.user.email,
            access_token=auth_response.session.access_token,
            refresh_token=auth_response.session.refresh_token
        )
    except Exception as e:
        raise Exception(f"Login failed: {str(e)}")

def get_current_user():
    """Get the current authenticated user."""
    return supabase.auth.get_user()

def logout_user():
    """Log out the current user."""
    return supabase.auth.sign_out() 