import { useNavigate } from 'react-router-dom';

export function VerifyEmailPage() {
  const navigate = useNavigate();

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
      </div>
    </div>
  );
} 