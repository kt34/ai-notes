import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowLogoutConfirm(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

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
            onClick={() => navigate('/record')}
            className={`nav-link ${location.pathname === '/record' ? 'active' : ''}`}
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
                top: 'calc(100% + 8px)',
                right: '0',
                background: '#1a1c2a',
                border: '1px solid rgba(86, 88, 245, 0.2)',
                borderRadius: '12px',
                padding: '0.5rem',
                minWidth: '240px',
                boxShadow: '0 4px 20px rgba(86, 88, 245, 0.15)',
                zIndex: 1000,
                animation: 'dropdownFade 0.2s ease'
              }}
            >
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(86, 88, 245, 0.15)',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(86, 88, 245, 0.3)',
                  padding: 0
                }}>
                  {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#fff', 
                    marginBottom: '0.25rem', 
                    fontSize: '1rem',
                    background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    {user?.full_name || 'User'}
                  </div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: 'rgba(255, 255, 255, 0.6)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '160px'
                  }}>
                    {user?.email}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.25rem' }}>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsDropdownOpen(false);
                  }}
                  className="dropdown-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ 
                    fontSize: '1.1rem',
                    background: 'rgba(86, 88, 245, 0.1)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>👤</span>
                  View Profile
                </button>

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="dropdown-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ 
                    fontSize: '1.1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>🚪</span>
                  Sign Out
                </button>
              </div>

              {showLogoutConfirm && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: '#1a1c2a',
                  borderRadius: '12px',
                  padding: '1rem',
                  animation: 'fadeIn 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '1.1rem', 
                      color: '#fff',
                      marginBottom: '0.5rem',
                      fontWeight: '600'
                    }}>
                      Sign Out
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      Are you sure you want to sign out?
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => setShowLogoutConfirm(false)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isLoggingOut ? (
                        <>
                          <div className="loading-spinner" style={{ 
                            width: '16px', 
                            height: '16px',
                            border: '2px solid rgba(239, 68, 68, 0.1)',
                            borderTop: '2px solid #ef4444',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Signing out...
                        </>
                      ) : (
                        'Sign out'
                      )}
                    </button>
                  </div>
                </div>
              )}
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

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .profile-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(86, 88, 245, 0.4) !important;
        }
        
        .dropdown-item:hover {
          background: rgba(86, 88, 245, 0.1);
        }
        
        .profile-menu {
          position: relative;
        }
      `}</style>
    </nav>
  );
} 