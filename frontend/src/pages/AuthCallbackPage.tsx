import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallbackPage() {
  const { user, isLoading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is loaded and we're on the callback page, redirect to the main app
    if (user && !isLoading) {
      navigate('/record', { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    // If there's an error, redirect to login
    if (error && !isLoading) {
      navigate('/login', { replace: true });
    }
  }, [error, isLoading, navigate]);

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderTop: '3px solid #fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem' }}>
          Completing Sign In...
        </h2>
        <p style={{ margin: 0, opacity: 0.8 }}>
          Please wait while we complete your authentication.
        </p>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 