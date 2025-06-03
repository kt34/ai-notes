from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from .db import supabase
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer

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
    refresh_token: str

class RegistrationSuccessResponse(BaseModel):
    message: str
    user_id: str
    email: str

class VerifyEmailRequest(BaseModel):
    token: str

class SupabaseUser(BaseModel):
    id: str
    email: Optional[EmailStr] = None
    app_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    user_metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

    def __init__(self, **data):
        super().__init__(**data)
        # Extract full_name from user_metadata if it exists
        if self.user_metadata and 'full_name' in self.user_metadata:
            self.full_name = self.user_metadata['full_name']

async def register_user(user_data: UserCreate) -> AuthResponse:
    """Register a new user with Supabase Auth."""
    try:
        # Sign up the user with a custom email template
        user_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                },
                "email_redirect_to": "http://localhost:5173/verify-email",
                "email_template": "custom-email-template"
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

async def verify_email(verify_data: VerifyEmailRequest):
    """Verify email with token."""
    try:
        # Verify the email with Supabase
        response = supabase.auth.verify_email_otp(verify_data.token)
        return {"message": "Email verified successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") 

async def get_authenticated_user_from_header(token: str = Depends(oauth2_scheme)):
    """
    Dependency to get the current authenticated user from an Authorization Bearer token.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_response.user # Return the user object
    except Exception as e: # Catch potential errors from supabase.auth.get_user
        # Log the original error e for debugging if necessary
        print(f"Error validating token with Supabase: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
