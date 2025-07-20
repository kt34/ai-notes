import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUsage } from '../hooks/useUsage';
import { apiRequest } from '../utils/api';

export function ProfilePage() {
  const { user, logout, refreshUser, refreshNavBar, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { usageData, isLoading: isLoadingUsage } = useUsage();

  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [isUpdatingSubscription, setIsUpdatingSubscription] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('payment_status');
    const sessionId = queryParams.get('session_id');

    if (paymentStatus === 'success' && sessionId && !isUpdatingSubscription) {
      setIsUpdatingSubscription(true);
      setPaymentStatusMessage('Verifying payment and updating your subscription...');

      const updateSubscription = async () => {
        try {
          await apiRequest('/api/v1/stripe/update-subscription', {
            method: 'POST',
            body: JSON.stringify({ session_id: sessionId }),
            token
          });
          setPaymentStatusMessage('🎉 Payment successful! Your subscription has been activated.');
          await refreshUser(); // Refresh user data to get new plan
          refreshNavBar(); // Refresh navbar subscription data
          // Note: useUsage hook will automatically refetch when user data changes
        } catch (error) {
          console.error("Failed to update subscription:", error);
          setPaymentStatusMessage('Your payment was successful, but there was an error updating your account. Please contact support.');
        } finally {
          navigate(location.pathname, { replace: true });
        }
      };

      updateSubscription();
    } else if (paymentStatus === 'cancelled') {
      setPaymentStatusMessage('Payment cancelled. Your subscription was not activated. You can try again anytime from the pricing page.');
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, refreshUser, refreshNavBar, token, isUpdatingSubscription]);

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

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const response = await apiRequest('/api/v1/stripe/cancel-subscription', {
        method: 'POST',
        token
      });
      setPaymentStatusMessage(response.message || 'Your subscription has been cancelled.');
      await refreshUser();
      refreshNavBar(); // Refresh navbar subscription data
      // Note: useUsage hook will automatically refetch when user data changes
      setShowCancelConfirm(false);
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel subscription. Please contact support.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper function to format subscription status
  const formatSubscriptionStatus = (status: string | null | undefined) => {
    if (!status) return 'Free Plan';
    switch (status) {
      case 'free':
        return 'Free Plan';
      case 'plus':
        return 'Plus Plan';
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

  const currentPlan = user?.subscription_status || 'free';
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
        {/* User Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
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
              position: 'relative',
              flexShrink: 0
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
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                fontSize: '1.8rem', 
                color: '#fff',
                margin: '0 0 0.25rem 0',
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
          <button
            onClick={handleLogout}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flexShrink: 0
            }}
          >
            {isLoading ? (
              <>
                <div style={{ 
                  width: '12px', 
                  height: '12px',
                  border: '2px solid rgba(239, 68, 68, 0.1)',
                  borderTop: '2px solid #ef4444',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing out...
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.9rem' }}>🚪</span>
                Sign Out
              </>
            )}
          </button>
        </div>

        {/* Usage Statistics */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ 
            color: '#fff',
            fontSize: '1.4rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📊</span> Usage Overview
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* Recordings Card */}
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
                fontWeight: '600',
                minHeight: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {isLoadingUsage ? (
                  <div className="loading-spinner-large" />
                ) : (
                  usageData?.remaining_recordings === -1 ? '∞' : usageData?.remaining_recordings ?? 'N/A'
                )}
              </p>
            </div>
            {/* Uploads Card */}
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
                fontWeight: '600',
                minHeight: '2rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                {isLoadingUsage ? (
                  <div className="loading-spinner-large" />
                ) : (
                  usageData?.remaining_uploads === -1 ? '∞' : usageData?.remaining_uploads ?? 'N/A'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Management */}
        <div>
          <h2 style={{ 
            color: '#fff', 
            fontSize: '1.4rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>💳</span> Subscription
          </h2>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
                  Current Plan: <strong style={{ color: '#fff' }}>
                    {planSymbol && <span style={{ marginRight: '0.5rem' }}>{planSymbol}</span>}
                    {formatSubscriptionStatus(user?.subscription_status)}
                  </strong>
                </p>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                  Status: Active
                </p>
                {user?.subscription_status !== 'free' && usageData?.usage_period_end && (
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0', fontSize: '0.9rem' }}>
                    Renews on: {new Date(usageData.usage_period_end).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                {user?.subscription_status !== 'free' && (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0',
                      background: 'transparent',
                      color: 'rgba(255, 255, 255, 0.4)',
                      border: 'none',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'color 0.2s ease',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
                    }}
                  >
                    Cancel subscription
                  </button>
                )}
              </div>
              <button
                onClick={() => navigate('/pricing')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.subscription_status === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
              </button>
            </div>
          </div>

          {cancelError && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#fca5a5',
            }}>
              {cancelError}
            </div>
          )}

          {paymentStatusMessage && (
            <div style={{
              padding: '1rem',
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

      {showCancelConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#1a1c2a',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Are you sure?</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem' }}>
              Your subscription will be cancelled immediately, and you will lose access to paid features at the end of your current billing period.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer'
                }}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-spinner-large {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
} 