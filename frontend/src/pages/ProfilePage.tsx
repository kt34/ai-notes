import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '80px auto 0', padding: '2rem' }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1.5rem',
          marginBottom: '2rem',
          padding: '1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: '#646cff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            fontWeight: 'bold'
          }}>
            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ 
              fontSize: '1.8rem', 
              color: '#fff',
              margin: '0 0 0.5rem 0' 
            }}>
              {user?.full_name || 'User'}
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              margin: '0',
              fontSize: '1rem'
            }}>
              {user?.email}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            color: '#fff',
            fontSize: '1.4rem',
            marginBottom: '1rem'
          }}>
            Account Settings
          </h2>
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            <button
              onClick={handleLogout}
              disabled={isLoading}
              style={{
                padding: '0.875rem',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Signing out...
                </>
              ) : (
                <>
                  <span>🚪</span>
                  Sign Out
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <h2 style={{ 
            color: '#fff',
            fontSize: '1.4rem',
            marginBottom: '1rem'
          }}>
            Statistics
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0'
              }}>
                Total Lectures
              </h3>
              <p style={{
                color: '#fff',
                fontSize: '2rem',
                margin: '0',
                fontWeight: '600'
              }}>
                0
              </p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0'
              }}>
                Total Minutes
              </h3>
              <p style={{
                color: '#fff',
                fontSize: '2rem',
                margin: '0',
                fontWeight: '600'
              }}>
                0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 