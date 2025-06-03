import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { config } from '../config';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        if (!token) {
          setStatus('error');
          setError('No verification token found');
          return;
        }

        const response = await fetch(`${config.apiUrl}/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Verification failed');
        }

        setStatus('success');
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        padding: '3rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div className="auth-logo" style={{ marginBottom: '2rem' }}>
          <h1>notez.ai</h1>
          <p>Smart lecture notes powered by AI</p>
        </div>

        {status === 'verifying' && (
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              margin: '0 auto 1.5rem',
              border: '3px solid rgba(100, 108, 255, 0.3)',
              borderRadius: '50%',
              borderTopColor: '#646cff',
              animation: 'spin 1s linear infinite'
            }} />
            <h2 style={{
              fontSize: '1.5rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Verifying your email...</h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Please wait while we verify your email address.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1.5rem',
              background: 'rgba(100, 108, 255, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}>✓</div>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Email Verified!</h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '2rem'
            }}>
              Your email has been successfully verified. You can now log in to your account.
            </p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#646cff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 108, 255, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Continue to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 1.5rem',
              background: 'rgba(255, 99, 99, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}>!</div>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Verification Failed</h2>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '1rem'
            }}>
              {error || 'We could not verify your email address. Please try again or contact support.'}
            </p>
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.875rem',
                  background: 'transparent',
                  color: '#646cff',
                  border: '1px solid #646cff',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(100, 108, 255, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/login')}
                style={{
                  padding: '0.875rem',
                  background: '#646cff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(100, 108, 255, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
} 