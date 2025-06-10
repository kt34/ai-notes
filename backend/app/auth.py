from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from .db import supabase
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from .config import settings

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

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

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
    print(f"Registering user: {user_data.email}")
    try:
        # Sign up the user
        user_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name
                },
                "email_redirect_to": f"{settings.FRONTEND_URL}/verify-email"
            }
        })
        
        # This is the key part: check if the user object was created
        # but the identities array is empty. This is Supabase's way of
        # indicating that the user already exists.
        if user_response.user and not user_response.user.identities:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists."
            )

        if not user_response.user:
            # This would be an unexpected error from Supabase
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user for an unknown reason."
            )

        message_to_user = "Registration successful. Please check your email to confirm your account."

        return RegistrationSuccessResponse(
            message=message_to_user,
            user_id=user_response.user.id,
            email=user_response.user.email
        )

    except HTTPException as e:
        # Re-raise the specific HTTP exceptions we've thrown
        raise e
    except Exception as e:
        # Handle other potential errors, like weak passwords from GoTrueApiError
        error_message = str(e)
        if "Password should be at least 6 characters" in error_message:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Password must be at least 6 characters long."
            )
        
        # Generic fallback for other errors
        print(f"An unexpected error occurred during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {error_message}"
        )

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

async def resend_verification_email(data: ResendVerificationRequest):
    """Resend verification email to user."""
    try:
        # Request Supabase to resend the verification email
        supabase.auth.resend_signup_email({
            "email": data.email,
            "options": {
                "email_redirect_to": f"{settings.FRONTEND_URL}/verify-email",
                "email_template": "custom-email-template"
            }
        })
        return {"message": "Verification email sent successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

async def forgot_password(request: ForgotPasswordRequest):
    """Initiates password reset for a user."""
    try:
        # Supabase handles sending the email with the reset link
        # The link URL is configured in your Supabase project's email templates
        supabase.auth.reset_password_for_email(
            email=request.email,
            options={
                # This should point to your frontend page for updating the password
                'redirect_to': f'{settings.FRONTEND_URL}/update-password'
            }
        )
        return {"message": "Password reset email sent. Please check your inbox."}
    except Exception as e:
        # Avoid confirming if an email exists for security reasons
        # Log the actual error for debugging
        print(f"Forgot password error for {request.email}: {e}")
        # Return a generic success message regardless of whether the email exists
        return {"message": "If an account with this email exists, a password reset link has been sent."}
