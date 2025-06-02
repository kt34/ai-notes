import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      clearError();
      return;
    }
    setIsLoading(true);
    try {
      const result = await register(email, password, fullName);
      setSuccessMessage(result.message);
      setIsSuccess(true);
    } catch (err) {
      // Error is handled by the auth context
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="auth-form" style={{ textAlign: 'center' }}>
        <div style={{
          background: 'rgba(100, 108, 255, 0.1)',
          border: '1px solid rgba(100, 108, 255, 0.2)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ color: '#646cff', marginBottom: '1rem' }}>✨ Registration Successful!</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '1rem' }}>
            A verification email has been sent to <strong>{email}</strong>
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
            {successMessage}
          </p>
        </div>
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
            transition: 'all 0.2s ease',
            width: '100%'
          }}
        >
          Continue to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Create Account</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <label htmlFor="fullName">Full Name</label>
        <input
          type="text"
          id="fullName"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            clearError();
          }}
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          required
          disabled={isLoading}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          placeholder="Choose a strong password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError();
          }}
          required
          disabled={isLoading}
        />
      </div>
      
      <div className="form-group" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              style={{
                cursor: 'pointer',
                width: '18px',
                height: '18px',
                margin: 0,
                opacity: 0,
                position: 'absolute',
                top: 0,
                left: 0
              }}
            />
            <div style={{
              width: '18px',
              height: '18px',
              border: '2px solid rgba(100, 108, 255, 0.5)',
              borderRadius: '4px',
              backgroundColor: acceptedTerms ? '#646cff' : 'transparent',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px'
            }}>
              {acceptedTerms && '✓'}
            </div>
          </div>
          <label 
            htmlFor="terms" 
            style={{ 
              fontSize: '0.9rem', 
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            I agree to the <Link to="/terms" target="_blank" style={{ color: '#646cff' }}>Terms and Conditions</Link> and{' '}
            <Link to="/privacy" target="_blank" style={{ color: '#646cff' }}>Privacy Policy</Link>
          </label>
        </div>
        {!acceptedTerms && error === null && (
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.5)', 
            fontSize: '0.8rem', 
            marginTop: '0.5rem',
            paddingLeft: 'calc(18px + 0.75rem)' // Align with text above
          }}>
            Please accept the terms and conditions to continue
          </div>
        )}
      </div>

      <button 
        type="submit" 
        disabled={isLoading || !acceptedTerms}
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: !acceptedTerms ? '0.7' : '1'
        }}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner"></span>
            Creating account...
          </>
        ) : (
          'Create Account'
        )}
      </button>
      <style>{`
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .auth-form button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
} 