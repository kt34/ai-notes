import { useNavigate } from 'react-router-dom';

export function LandingNavBar() {
  const navigate = useNavigate();

  return (
    <nav className="nav-bar" style={{ background: 'transparent', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div 
        className="nav-brand"
        onClick={() => navigate('/')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            navigate('/');
          }
        }}
      >
        notez.ai
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          onClick={() => navigate('/login')}
          className="nav-link"
          style={{ color: 'rgba(255, 255, 255, 0.8)' }}
        >
          Sign In
        </button>
        <button 
          onClick={() => navigate('/register')}
          style={{
            padding: '0.5rem 1.25rem',
            background: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.background = '#7c82ff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = '#646cff';
          }}
        >
          Get Started
        </button>
      </div>
    </nav>
  );
} 