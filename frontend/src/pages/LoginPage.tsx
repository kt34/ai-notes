import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <>
      <div 
        onClick={() => navigate('/')}
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
        ← Back
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
            <p>Smart lecture notes powered by AI</p>
          </div>
          <LoginForm />
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.5rem',
            marginTop: '1rem',
            width: '100%'
          }}>
            <button 
              onClick={() => navigate('/register')}
              className="toggle-auth-btn"
              style={{ width: '100%', textAlign: 'center' }}
            >
              Need an account? Register
            </button>
            <button 
              onClick={() => navigate('/forgot-password')}
              style={{ 
                background: 'none',
                border: 'none',
                padding: '0.5rem 0',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 