import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function NavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="nav-bar">
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
        <div className="nav-links">
          <button 
            onClick={() => navigate('/')}
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Record
          </button>
          <button 
            onClick={() => navigate('/lectures')}
            className={`nav-link ${location.pathname.startsWith('/lectures') ? 'active' : ''}`}
          >
            Lectures
          </button>
        </div>
        
        <div className="profile-menu" ref={dropdownRef}>
          <button
            className="profile-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              lineHeight: '32px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(86, 88, 245, 0.3)',
              padding: 0
            }}
          >
            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
          </button>
          
          {isDropdownOpen && (
            <div
              className="profile-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: '0',
                background: '#1a1c2a',
                border: '1px solid rgba(86, 88, 245, 0.2)',
                borderRadius: '8px',
                padding: '0.25rem',
                minWidth: '200px',
                boxShadow: '0 4px 20px rgba(86, 88, 245, 0.15)',
                zIndex: 1000,
                animation: 'dropdownFade 0.2s ease'
              }}
            >
              <div style={{
                padding: '0.75rem',
                borderBottom: '1px solid rgba(86, 88, 245, 0.15)',
                marginBottom: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  lineHeight: '32px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(86, 88, 245, 0.3)',
                  padding: 0
                }}>
                  {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#fff', 
                    marginBottom: '0.25rem', 
                    fontSize: '0.95rem',
                    background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {user?.full_name || 'User'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {user?.email}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsDropdownOpen(false);
                }}
                className="dropdown-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: 'none',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '0.9rem' }}>👤</span>
                Profile
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .profile-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(86, 88, 245, 0.4) !important;
        }
        
        .dropdown-item:hover {
          background: rgba(86, 88, 245, 0.1);
          color: #fff;
        }
        
        .profile-menu {
          position: relative;
        }
      `}</style>
    </nav>
  );
} 