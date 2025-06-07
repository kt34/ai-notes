import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe as StripeType } from '@stripe/stripe-js';
import { config } from '../config';

const stripePromise = config.stripePublishableKey 
  ? loadStripe(config.stripePublishableKey) 
  : null;

export function PricingPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isCheckingOutPlan, setIsCheckingOutPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const paymentStatus = queryParams.get('payment_status');
    const sessionId = queryParams.get('session_id');

    if (paymentStatus === 'success') {
      setPaymentStatusMessage(`🎉 Payment successful! Your subscription is active. Session ID: ${sessionId}`);
      // navigate(location.pathname, { replace: true }); 
    } else if (paymentStatus === 'cancelled') {
      setPaymentStatusMessage('Payment cancelled. Your subscription was not activated. You can try again anytime.');
      // navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleCheckout = async (planType: string, planName: string) => {
    if (!stripePromise) {
      setCheckoutError("Stripe is not configured correctly. Please contact support.");
      return;
    }
    if (!token) {
      navigate('/login?redirect=/pricing');
      setCheckoutError("Please log in or create an account to subscribe.");
      return;
    }

    setIsCheckingOutPlan(planType);
    setCheckoutError(null);
    setPaymentStatusMessage(null);

    try {
      const response = await apiRequest('/api/v1/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_type: planType }),
        token,
      });

      const { sessionId } = response;
      if (!sessionId) {
        throw new Error('Failed to create checkout session.');
      }

      const stripe: StripeType | null = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js failed to load.');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirectToCheckout error:', error);
        setCheckoutError(error.message || 'Failed to redirect to Stripe. Please try again.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsCheckingOutPlan(null);
    }
  };

  const plans = [
    { id: 'standard', name: 'Standard Plan', description: 'Access to core transcription and summarization features for individual use.', price: '$10/mo', features: ['Up to 10 hours of transcription/month', 'Standard AI summaries', 'Email support'] },
    { id: 'pro', name: 'Pro Plan', description: 'Advanced features for professionals and frequent users, with higher limits.', price: '$20/mo', features: ['Up to 30 hours of transcription/month', 'Detailed AI summaries & key concepts', 'Section-by-section breakdown', 'Priority email support'] },
    { id: 'max', name: 'Max Plan', description: 'Unlimited access and premium support for power users and teams.', price: '$30/mo', features: ['Unlimited transcription hours', 'All AI features including advanced analytics', 'Dedicated support channel', 'Early access to new features'] },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '2  rem auto', padding: '0rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3rem)', color: '#fff', marginBottom: '0.5rem' }}>
          Choose Your Plan
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'rgba(255, 255, 255, 0.7)', maxWidth: '650px', margin: '0 auto' }}>
          Select the plan that best fits your needs. All plans come with a satisfaction guarantee.
        </p>
      </div>

      {!stripePromise && (
        <p style={{ textAlign: 'center', color: 'rgba(255,255,0,0.8)', background: 'rgba(255,255,0,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,0,0.2)', marginBottom: '2rem'}}>
          Stripe payments are not configured. The VITE_STRIPE_PUBLISHABLE_KEY might be missing.
        </p>
      )}
      {paymentStatusMessage && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          border: '1px solid',
          borderColor: paymentStatusMessage.includes('successful') ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)',
          background: paymentStatusMessage.includes('successful') ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          color: paymentStatusMessage.includes('successful') ? '#a7f3d0' : '#fecaca',
          textAlign: 'center'
        }}>
          {paymentStatusMessage}
        </div>
      )}
      {checkoutError && (
        <div style={{
          padding: '1rem',
          marginBottom: '2rem',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#fca5a5',
          textAlign: 'center'
        }}>
          Error: {checkoutError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '2rem',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: hoveredPlan === plan.id ? '0 12px 40px 0 rgba(0, 0, 0, 0.2)' : '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              transform: hoveredPlan === plan.id ? 'translateY(-5px)' : 'translateY(0)',
            }}
            onMouseEnter={() => setHoveredPlan(plan.id)}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.7rem', margin: '0 0 0.75rem 0', fontWeight: '600' }}>{plan.name}</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem', marginBottom: '1.5rem', minHeight: '60px' }}>{plan.description}</p>
              <p style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 1.5rem 0' }}>
                {plan.price.split('/')[0]}
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)' }}>/mo</span>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0' }}>
                {plan.features.map(feature => (
                  <li key={feature} style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#5658f5', marginRight: '0.75rem', fontSize: '1.2rem' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleCheckout(plan.id, plan.name)}
              disabled={!stripePromise || !!isCheckingOutPlan}
              style={{
                padding: '1rem 1.5rem',
                background: 'linear-gradient(135deg, #5658f5 0%, #8c8eff 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: (!stripePromise || !!isCheckingOutPlan) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: (!stripePromise || !!isCheckingOutPlan) ? 0.6 : 1,
                width: '100%',
                marginTop: 'auto'
              }}
            >
              {isCheckingOutPlan === plan.id ? (
                <>
                  <span className="loading-spinner-small" style={{marginRight: '8px'}}></span>
                  Processing...
                </>
              ) : (
                'Choose Plan'
              )}
            </button>
          </div>
        ))}
      </div>
      <style>{`
        .loading-spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 