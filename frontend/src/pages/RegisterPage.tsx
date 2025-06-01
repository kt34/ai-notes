import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';

export function RegisterPage() {
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
        <RegisterForm />
        <button 
          onClick={() => navigate('/login')}
          className="toggle-auth-btn"
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
} 