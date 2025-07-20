import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

interface SubscriptionData {
  subscription_status: string;
}

export function NavBar() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!token) return;
      try {
        const data = await apiRequest('/usage/plan', { token });
        setSubscriptionData(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscription();
  }, [token]);

  // Helper functions for plan-specific styling
  const getPlanColors = () => {
    // Keep original blue gradient for all plans
    return {
      gradient: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
      shadow: '0 2px 8px rgba(86, 88, 245, 0.3)'
    };
  };

  const getPlanSymbol = (status: string) => {
    switch (status) {
      case 'plus':
        return '⭐';
      case 'pro':
        return '💎';
      case 'max':
        return '👑';
      default:
        return ''; // No emoji for free plan
    }
  };

  const currentPlan = subscriptionData?.subscription_status || 'free';
  const planColors = getPlanColors();
  const planSymbol = getPlanSymbol(currentPlan);

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
        onClick={() => navigate('/record')}
        style={{ cursor: 'pointer' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            navigate('/record');
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
            onClick={() => navigate('/upload')}
            className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
          >
            Upload
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
              background: planColors.gradient,
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
              boxShadow: planColors.shadow,
              padding: 0,
              position: 'relative'
            }}
          >
            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
            {planSymbol && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                fontSize: '10px',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '50%',
                width: '14px',
                height: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {planSymbol}
              </span>
            )}
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
                minWidth: '260px', // Increased width for better spacing
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)', // Softer shadow
                zIndex: 1000,
                animation: 'dropdownFade 0.2s ease'
              }}
            >
              <div style={{
                padding: '0.75rem 1rem', // Adjusted padding
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <div style={{
                  width: '40px', // Slightly smaller avatar
                  height: '40px',
                  borderRadius: '50%',
                  background: planColors.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '18px', // Adjusted font size
                  fontWeight: '600',
                  boxShadow: planColors.shadow,
                  flexShrink: 0, // Prevent avatar from shrinking
                  position: 'relative'
                }}>
                  {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                  {planSymbol && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      fontSize: '12px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #1a1c2a' // Add border to separate from avatar
                    }}>
                      {planSymbol}
                    </span>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontWeight: 600,
                      color: '#fff',
                      fontSize: '1rem',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {user?.full_name || 'User'}
                    </span>
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      background: 'rgba(86, 88, 245, 0.15)',
                      color: '#8c8eff',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      letterSpacing: '0.02em'
                    }}>
                      {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', // Smaller email font
                    color: 'rgba(255, 255, 255, 0.5)', // More subtle color
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {user?.email}
                  </div>
                </div>
              </div>

              <div style={{
                borderTop: '1px solid rgba(86, 88, 245, 0.1)',
                margin: '0.5rem 0',
              }} />
              
              <div style={{ padding: '0.25rem' }}>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setIsDropdownOpen(false);
                  }}
                  className="dropdown-item"
                >
                  <span className="dropdown-item-icon">👤</span>
                  View Profile
                </button>
                
                {currentPlan === 'free' && (
                  <button
                    onClick={() => {
                      navigate('/pricing');
                      setIsDropdownOpen(false);
                    }}
                    className="dropdown-item"
                  >
                    <span className="dropdown-item-icon" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>🚀</span>
                    Upgrade Subscription
                  </button>
                )}

                <div style={{
                  borderTop: '1px solid rgba(86, 88, 245, 0.1)',
                  margin: '0.25rem 0.75rem', // Inset separator
                }} />

                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="dropdown-item"
                >
                  <span className="dropdown-item-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>🚪</span>
                  <span style={{ color: '#ef4444' }}>Sign Out</span>
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
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: none;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        
        .dropdown-item-icon {
          font-size: 1.1rem;
          background: rgba(86, 88, 245, 0.1);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8c8eff;
        }

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
          color: #fff;
        }
        
        .profile-menu {
          position: relative;
        }
      `}</style>
    </nav>
  );
} 