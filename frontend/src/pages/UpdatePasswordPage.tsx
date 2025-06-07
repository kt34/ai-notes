import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updatePassword, isLoading, error, clearError } = useAuth();
  
  // The access_token is extracted from the URL fragment by the Supabase client automatically
  // when the page loads. We just need to check for its presence to enable the form.
  const [hasToken, setHasToken] = useState(false);
  
  useEffect(() => {
    // Supabase client handles the token from the URL fragment (#access_token=...).
    // We can't read it directly, but we can check if the session is available.
    // A simple way is to check the hash.
    if (window.location.hash.includes('access_token')) {
        setHasToken(true);
    } else {
        // For password reset flow, token may also come as a query param
        const tokenFromQuery = searchParams.get('token');
        if (tokenFromQuery) {
            setHasToken(true);
        }
    }
    
    // Clear any previous errors when the component mounts
    clearError();
  }, [searchParams, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      // Set a local error for this specific page action
      alert('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      // The access token from the URL is managed by the Supabase client.
      // We just need to provide the new password.
      await updatePassword("dummy-token", password); // The token here is a placeholder
      setSuccess(true);
    } catch (err) {
      // The error is already set in the AuthContext, so we don't need to do anything here
      console.error('Update password error:', err);
    }
  };

  return (
    <>
      <div 
        onClick={() => navigate('/login')}
        style={{ 
          position: 'fixed',
          top: '2rem',
          left: '2rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.9rem',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.transform = 'translateX(-4px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        ← Back to Login
      </div>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 2rem'
      }}>
        <div className="auth-container">
          <div className="auth-logo">
            <h1>notez.ai</h1>
            <p>Create new password</p>
          </div>
          {success ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <h3 style={{ color: '#646cff', marginBottom: '1rem', fontSize: '1.5rem' }}>Password Updated!</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6', fontSize: '1rem' }}>
                Your password has been successfully reset.
                You can now log in with your new password.
              </p>
              <button 
                onClick={() => navigate('/login')}
                style={{
                  marginTop: '2rem',
                  padding: '0.875rem',
                  background: '#646cff',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#7c82ff';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#646cff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <h2>Reset Password</h2>
              {error && <div className="error-message">{error}</div>}
              {!hasToken && !error && (
                <div className="error-message">
                  Invalid or missing password reset token. Please request a new link.
                </div>
              )}
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                  }}
                  required
                  disabled={isLoading || !hasToken}
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                  }}
                  required
                  disabled={isLoading || !hasToken}
                  minLength={6}
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading || !hasToken}
                style={{
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.875rem',
                  background: '#646cff',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: isLoading || !hasToken ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoading || !hasToken ? 0.7 : 1,
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
                onMouseOver={(e) => {
                  if (!isLoading && hasToken) {
                    e.currentTarget.style.background = '#7c82ff';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading && hasToken) {
                    e.currentTarget.style.background = '#646cff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner" style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '50%',
                      borderTopColor: '#fff',
                      animation: 'spin 0.8s linear infinite',
                      marginRight: '8px'
                    }} />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
} 