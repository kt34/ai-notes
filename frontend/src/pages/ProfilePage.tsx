import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { useUsage } from '../hooks/useUsage';

interface SubscriptionData {
  subscription_status: string;
}

export function ProfilePage() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const { usageData, isLoading: isLoadingUsage } = useUsage();

  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      const data = await apiRequest('/usage/plan', {
        token
      });
      setSubscriptionData(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoadingSubscription(false);
    }
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('payment_status');

    if (paymentStatus === 'success') {
      setPaymentStatusMessage('🎉 Payment successful! Your subscription has been activated.');
      // Refresh subscription data after successful payment
      fetchSubscription();
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

  // Helper function to format subscription status
  const formatSubscriptionStatus = (status: string) => {
    switch (status) {
      case 'free':
        return 'Free Plan';
      case 'standard':
        return 'Standard Plan';
      case 'pro':
        return 'Pro Plan';
      case 'max':
        return 'Max Plan';
      default:
        return 'Free Plan';
    }
  };

  // Helper functions for plan-specific styling
  const getPlanColors = () => {
    // Keep original blue gradient for all plans
    return {
      gradient: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
      shadow: '0 4px 12px rgba(86, 88, 245, 0.3)'
    };
  };

  const getPlanSymbol = (status: string) => {
    switch (status) {
      case 'standard':
        return '⭐';
      case 'pro':
        return '💎';
      case 'max':
        return '👑';
      default:
        return ''; // No emoji for free plan
    }
  };

  const currentSubscription = {
    planName: subscriptionData ? formatSubscriptionStatus(subscriptionData.subscription_status) : 'Free Plan',
    status: 'Active'
  };

  const currentPlan = subscriptionData?.subscription_status || 'free';
  const planColors = getPlanColors();
  const planSymbol = getPlanSymbol(currentPlan);

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
            background: planColors.gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            fontWeight: 'bold',
            boxShadow: planColors.shadow,
            position: 'relative'
          }}>
            {user?.full_name ? user.full_name[0].toUpperCase() : user?.email ? user.email[0].toUpperCase() : 'U'}
            {planSymbol && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                fontSize: '16px',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {planSymbol}
              </span>
            )}
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

        {/* Usage Statistics */}
        {!isLoadingUsage && usageData && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ 
              color: '#fff',
              fontSize: '1.4rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>📈</span> Usage Remaining
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
                  opacity: 0.8
                }} />
                <h3 style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.9rem',
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>📄</span> Uploads Remaining
                </h3>
                <p style={{
                  color: '#fff',
                  fontSize: '2rem',
                  margin: '0',
                  fontWeight: '600'
                }}>
                  {usageData.remaining_uploads}
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
                  opacity: 0.8
                }} />
                <h3 style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.9rem',
                  margin: '0 0 0.5rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span>🎤</span> Recordings Remaining
                </h3>
                <p style={{
                  color: '#fff',
                  fontSize: '2rem',
                  margin: '0',
                  fontWeight: '600'
                }}>
                  {usageData.remaining_recordings}
                </p>
              </div>
            </div>
          </div>
        )}

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
              <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 0.25rem 0' }}>
                Current Plan: <strong>
                  {isLoadingSubscription ? (
                    <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>Loading...</span>
                  ) : (
                    <>
                      {planSymbol} {currentSubscription.planName}
                    </>
                  )}
                </strong>
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0', fontSize: '0.9rem' }}>
                Status: {currentSubscription.status}
              </p>
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
        </div>
      </div>
    </div>
  );
} 