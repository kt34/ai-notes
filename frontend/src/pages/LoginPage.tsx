import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  const navigate = useNavigate();

  return (
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
        <button 
          onClick={() => navigate('/register')}
          className="toggle-auth-btn"
        >
          Need an account? Register
        </button>
      </div>
    </div>
  );
} 