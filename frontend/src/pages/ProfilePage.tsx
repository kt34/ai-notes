import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { config } from '../config';

interface UserStats {
  total_lectures: number;
  total_minutes: number;
  total_words: number;
}

export function ProfilePage() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest('/user/stats', {
          token
        });
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [token]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('payment_status');

    if (paymentStatus === 'success') {
      setPaymentStatusMessage('🎉 Payment successful! Your subscription has been activated.');
      navigate(location.pathname, { replace: true });
    } else if (paymentStatus === 'cancelled') {
      setPaymentStatusMessage('Payment cancelled. Your subscription was not activated. You can try again anytime from the pricing page.');
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

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

  const currentSubscription = {
    planName: 'Free Plan',
    status: 'Active'
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0rem auto 0', padding: '2rem' }}>
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
            background: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(86, 88, 245, 0.3)'
          }}>
            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 style={{ 
              fontSize: '1.8rem', 
              color: '#fff',
              margin: '0 0 0.5rem 0',
              background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
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
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📊</span> Statistics
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
              border: '1px solid rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #5658f5, #8c8eff)',
                opacity: 0.5
              }} />
              <h3 style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>📝</span> Total Lectures
              </h3>
              <p style={{
                color: '#fff',
                fontSize: '2rem',
                margin: '0',
                fontWeight: '600'
              }}>
                {isLoadingStats ? (
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>...</span>
                ) : (
                  stats?.total_lectures || 0
                )}
              </p>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #5658f5, #8c8eff)',
                opacity: 0.5
              }} />
              <h3 style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem',
                margin: '0 0 0.5rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>⏱️</span> Total Minutes
              </h3>
              <p style={{
                color: '#fff',
                fontSize: '2rem',
                margin: '0',
                fontWeight: '600'
              }}>
                {isLoadingStats ? (
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>...</span>
                ) : (
                  stats?.total_minutes || 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: '1rem' }}>
            Manage Subscription
          </h2>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 0.25rem 0' }}>Current Plan: <strong>{currentSubscription.planName}</strong></p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0', fontSize: '0.9rem' }}>Status: {currentSubscription.status}</p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              style={{
                padding: '0.6rem 1.2rem',
                background: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              View/Update Plans
            </button>
          </div>

          {paymentStatusMessage && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: paymentStatusMessage.includes('successful') ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)',
              background: paymentStatusMessage.includes('successful') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
              color: paymentStatusMessage.includes('successful') ? '#a7f3d0' : '#fecaca',
            }}>
              {paymentStatusMessage}
            </div>
          )}
          {checkoutError && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
            }}>
              Error: {checkoutError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 