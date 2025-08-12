import { useNavigate } from 'react-router-dom';
import { LandingNavBar } from '../components/LandingNavBar';
import { useRef } from 'react';
import useIntersectionObserver from '../hooks/useIntersectionObserver';

export function LandingPage() {
  const navigate = useNavigate();

  const heroH1Ref = useRef<HTMLHeadingElement>(null);
  const heroPRef = useRef<HTMLParagraphElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const heroPreviewRef = useRef<HTMLDivElement>(null);

  const featuresTitleRef = useRef<HTMLHeadingElement>(null);
  const featuresGridRef = useRef<HTMLDivElement>(null);

  const pricingTitleRef = useRef<HTMLHeadingElement>(null);
  const pricingGridRef = useRef<HTMLDivElement>(null);

  const ctaTitleRef = useRef<HTMLHeadingElement>(null);
  const ctaPRef = useRef<HTMLParagraphElement>(null);
  const ctaButtonRef = useRef<HTMLDivElement>(null);

  const isHeroH1Visible = useIntersectionObserver(heroH1Ref, { threshold: 0.1 });
  const isHeroPVisible = useIntersectionObserver(heroPRef, { threshold: 0.1 });
  const isHeroButtonsVisible = useIntersectionObserver(heroButtonsRef, { threshold: 0.1 });
  const isHeroPreviewVisible = useIntersectionObserver(heroPreviewRef, { threshold: 0.1 });

  const isFeaturesTitleVisible = useIntersectionObserver(featuresTitleRef, { threshold: 0.1 });
  const isFeaturesGridVisible = useIntersectionObserver(featuresGridRef, { threshold: 0.1 });

  const isPricingTitleVisible = useIntersectionObserver(pricingTitleRef, { threshold: 0.1 });
  const isPricingGridVisible = useIntersectionObserver(pricingGridRef, { threshold: 0.1 });

  const isCtaTitleVisible = useIntersectionObserver(ctaTitleRef, { threshold: 0.1 });
  const isCtaPVisible = useIntersectionObserver(ctaPRef, { threshold: 0.1 });
  const isCtaButtonVisible = useIntersectionObserver(ctaButtonRef, { threshold: 0.1 });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)',
      color: '#fff',
      overflowX: 'hidden'
    }}>
      <LandingNavBar />
      
      {/* Hero Section */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, rgba(100, 108, 255, 0.08) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none',
          animation: 'pulse 4s ease-in-out infinite'
        }} />
        
        <h1 
          ref={heroH1Ref}
          className={`fade-in-on-scroll ${isHeroH1Visible ? 'is-visible' : ''}`}
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '700',
            background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1.5rem',
            position: 'relative',
          }}
        >
          Transform Your Lectures Into
          <br />
          AI-Organized Notes
        </h1>
        
        <p 
          ref={heroPRef}
          className={`fade-in-on-scroll ${isHeroPVisible ? 'is-visible' : ''}`}
          style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: '800px',
            marginBottom: '3rem',
            lineHeight: '1.6',
            transitionDelay: '0.2s'
          }}
        >
          Record your lectures and let AI transform them into well-structured notes, complete with summaries, key points, and smart organization.
        </p>

        <div 
          ref={heroButtonsRef}
          className={`fade-in-on-scroll ${isHeroButtonsVisible ? 'is-visible' : ''}`}
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginBottom: '4rem',
            transitionDelay: '0.4s'
          }}
        >
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              background: 'linear-gradient(120deg, #646cff, #8c8eff)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(100, 108, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(100, 108, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(100, 108, 255, 0.3)';
            }}
          >
            Get Started Free
          </button>
        </div>

        {/* Feature Preview */}
        <div 
          ref={heroPreviewRef}
          className={`fade-in-on-scroll ${isHeroPreviewVisible ? 'is-visible' : ''}`}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '1000px',
            width: '100%',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            overflow: 'hidden',
            transitionProperty: 'opacity, transform, box-shadow, border',
            transitionDuration: '0.8s, 0.8s, 0.3s, 0.3s',
            transitionTimingFunction: 'ease-out',
            transitionDelay: '0.6s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = isHeroPreviewVisible ? 'translateY(-5px)' : 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = isHeroPreviewVisible ? 'translateY(0)' : 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
            e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
          }}
        >
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(45deg, rgba(86, 88, 245, 0.05) 0%, rgba(140, 142, 255, 0.05) 100%)',
            pointerEvents: 'none'
          }} />
          <img 
            src="/images/demo-preview.png"
            alt="notez.ai in action"
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease'
            }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section style={{
        padding: '3rem 2rem',
        background: 'rgba(255, 255, 255, 0.02)',
      }}>
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}>
          <h2 
            ref={featuresTitleRef}
            className={`fade-in-on-scroll ${isFeaturesTitleVisible ? 'is-visible' : ''}`}
            style={{
              fontSize: 'clamp(2.5rem, 4.5vw, 3.2rem)',
              textAlign: 'center',
              marginBottom: '4rem',
              background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Key Features
          </h2>

          <div 
            ref={featuresGridRef}
            className={`stagger-children ${isFeaturesGridVisible ? 'is-visible' : ''}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2.5rem',
              width: '100%',
              alignItems: 'stretch'
            }}
          >
            <div style={{ transitionDelay: '0.1s' }}>
              <FeatureCard 
                icon="🎙️"
                title="Real-time Transcription"
                description="Watch your lecture transform into text in real-time with our advanced speech recognition technology."
              />
            </div>
            <div style={{ transitionDelay: '0.2s' }}>
              <FeatureCard 
                icon="🤖"
                title="AI-Powered Summary"
                description="Get instant summaries and key points from your lectures, powered by advanced AI algorithms."
              />
            </div>
            <div style={{ transitionDelay: '0.3s' }}>
              <FeatureCard 
                icon="📚"
                title="Smart Organization"
                description="Keep all your lecture notes organized and easily accessible in one place."
              />
            </div>
            <div style={{ transitionDelay: '0.4s' }}>
              <FeatureCard 
                icon="✨"
                title="Beautiful Interface"
                description="Enjoy a modern, intuitive interface designed for the best note-taking experience."
              />
            </div>
            <div style={{ transitionDelay: '0.5s' }}>
              <FeatureCard 
                icon="🔍"
                title="Quick Search"
                description="Find any lecture or specific content instantly with our powerful search feature."
              />
            </div>
            <div style={{ transitionDelay: '0.6s' }}>
              <FeatureCard 
                icon="📱"
                title="Access Anywhere"
                description="Access your notes from any device, anytime, with our cloud-based storage."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.02), rgba(86, 88, 245, 0.05))'
      }}>
        <div style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
        }}>
          <h2 
            ref={pricingTitleRef}
            className={`fade-in-on-scroll ${isPricingTitleVisible ? 'is-visible' : ''}`}
            style={{
              fontSize: 'clamp(2.5rem, 4.5vw, 3.2rem)',
              textAlign: 'center',
              marginBottom: '1rem',
              background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Simple Pricing
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            marginBottom: '3rem',
            maxWidth: '600px',
            margin: '0 auto 3rem auto'
          }}>
            Choose the plan that fits your needs. All plans come with a satisfaction guarantee.
          </p>

          <div 
            ref={pricingGridRef}
            className={`stagger-children ${isPricingGridVisible ? 'is-visible' : ''}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              width: '100%',
              alignItems: 'stretch',
            }}
          >
            <div style={{ transitionDelay: '0.1s' }}>
              <PricingCard 
                name="Plus Plan"
                price="$10"
                period="/mo"
                features={[
                  { text: '5 live recordings per month', highlight: '5' },
                  { text: '10 file uploads per month', highlight: '10' },
                  'AI-powered summaries & insights',
                  'Email support'
                ]}
              />
            </div>
            <div style={{ transitionDelay: '0.2s' }}>
              <PricingCard 
                name="Pro Plan"
                price="$20"
                period="/mo"
                features={[
                  { text: '15 live recordings per month', highlight: '15' },
                  { text: '30 file uploads per month', highlight: '30' },
                  'AI-powered summaries & insights',
                  'Priority support'
                ]}
                isPopular={true}
              />
            </div>
            <div style={{ transitionDelay: '0.3s' }}>
              <PricingCard 
                name="Max Plan"
                price="$30"
                period="/mo"
                features={[
                  { text: 'Unlimited recordings & uploads', highlight: 'Unlimited' },
                  'AI-powered summaries & insights',
                  'Dedicated support'
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(to bottom, transparent, rgba(86, 88, 245, 0.1))'
      }}>
        <h2 
          ref={ctaTitleRef}
          className={`fade-in-on-scroll ${isCtaTitleVisible ? 'is-visible' : ''}`}
          style={{
            fontSize: '2.5rem',
            marginBottom: '1.5rem',
            transitionDelay: '0.1s'
          }}
        >
          Ready to Transform Your Note-Taking?
        </h2>
        <p 
          ref={ctaPRef}
          className={`fade-in-on-scroll ${isCtaPVisible ? 'is-visible' : ''}`}
          style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '2rem',
            transitionDelay: '0.2s'
          }}
        >
          Join thousands of students making their study life easier with notez.ai
        </p>
        <div 
          ref={ctaButtonRef}
          className={`fade-in-on-scroll ${isCtaButtonVisible ? 'is-visible' : ''}`}
          style={{
            transitionDelay: '0.3s'
          }}
        >
          <button
            onClick={() => navigate('/register')}
            style={{
              padding: '1rem 2.5rem',
              fontSize: '1.125rem',
              fontWeight: '600',
              background: 'linear-gradient(120deg, #646cff, #8c8eff)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 20px rgba(100, 108, 255, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(100, 108, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(100, 108, 255, 0.3)';
            }}
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <p>&copy; {new Date().getFullYear()} notez.ai. All rights reserved.</p>
      </footer>

    </div>
  );
}

function PricingCard({ name, price, period, features, isPopular = false }: { 
  name: string; 
  price: string; 
  period: string; 
  features: (string | { text: string; highlight: string })[];
  isPopular?: boolean;
}) {
  return (
    <div style={{
      background: isPopular ? 'linear-gradient(135deg, rgba(86, 88, 245, 0.1), rgba(140, 142, 255, 0.1))' : 'rgba(255, 255, 255, 0.05)',
      padding: '2rem',
      borderRadius: '12px',
      border: isPopular ? '1px solid rgba(86, 88, 245, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: isPopular ? '0 8px 25px rgba(86, 88, 245, 0.2)' : '0 4px 15px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      height: '100%',
      position: 'relative'
    }} 
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = isPopular ? '0 12px 35px rgba(86, 88, 245, 0.3)' : '0 8px 25px rgba(0, 0, 0, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = isPopular ? '0 8px 25px rgba(86, 88, 245, 0.2)' : '0 4px 15px rgba(0, 0, 0, 0.1)';
    }}
    >
      {isPopular && (
        <div style={{
          position: 'absolute',
          top: '-0.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
          color: 'white',
          padding: '0.25rem 1rem',
          borderRadius: '20px',
          fontSize: '0.8rem',
          fontWeight: '600'
        }}>
          Most Popular
        </div>
      )}
      <h3 style={{ 
        fontSize: '2rem', 
        marginBottom: '0.5rem', 
        color: '#fff',
        textAlign: 'center'
      }}>
        {name}
      </h3>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <span style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#fff' 
        }}>
          {price}
        </span>
        <span style={{ 
          fontSize: '1rem', 
          color: 'rgba(255, 255, 255, 0.6)' 
        }}>
          {period}
        </span>
      </div>
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0
      }}>
        {features.map((feature, index) => {
          const isFeatureObject = typeof feature === 'object' && feature !== null;
          const featureText = isFeatureObject ? feature.text : feature;
          const highlightText = isFeatureObject ? feature.highlight : null;
          
          return (
            <li key={index} style={{ 
              color: 'rgba(255,255,255,0.8)', 
              marginBottom: '0.75rem', 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '0.95rem'
            }}>
              <span style={{ 
                color: '#5658f5', 
                marginRight: '0.75rem', 
                fontSize: '1rem' 
              }}>
                ✓
              </span>
              {highlightText ? (
                <span>
                  <span style={{
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '1.1rem'
                  }}>
                    {highlightText}
                  </span>
                  {featureText.replace(highlightText, '')}
                </span>
              ) : (
                featureText
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      padding: '2rem',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      height: '100%'
    }} 
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#fff' }}>{title}</h3>
      <p style={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.6' }}>{description}</p>
    </div>
  );
} 