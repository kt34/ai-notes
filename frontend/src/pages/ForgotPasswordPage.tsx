import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${config.apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error('Server error. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to send reset email');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
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
            <p>Reset your password</p>
          </div>
          {success ? (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <h3 style={{ color: '#646cff', marginBottom: '1rem', fontSize: '1.5rem' }}>Check your email</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.6', fontSize: '1rem' }}>
                We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.
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
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form">
              <h2>Forgot Password</h2>
              {error && <div className="error-message">{error}</div>}
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={isLoading}
                />
              </div>
              <button 
                type="submit" 
                disabled={isLoading}
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
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.7 : 1,
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
                onMouseOver={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = '#7c82ff';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading) {
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
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
} 