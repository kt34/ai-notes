import { useNavigate } from 'react-router-dom';
import { LandingNavBar } from '../components/LandingNavBar';

export function LandingPage() {
  const navigate = useNavigate();

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
        
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: '700',
          background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '1.5rem',
          position: 'relative',
          animation: 'fadeIn 1s ease-out'
        }}>
          Transform Your Lectures Into
          <br />
          Smart, Organized Notes
        </h1>
        
        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
          color: 'rgba(255, 255, 255, 0.8)',
          maxWidth: '800px',
          marginBottom: '3rem',
          lineHeight: '1.6',
          animation: 'fadeIn 1s ease-out 0.2s both'
        }}>
          Record your lectures and let AI transform them into well-structured notes, complete with summaries, key points, and smart organization.
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          marginBottom: '4rem',
          animation: 'fadeIn 1s ease-out 0.4s both'
        }}>
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
        <div style={{
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
          transition: 'all 0.3s ease',
          animation: 'fadeIn 1s ease-out 0.6s both'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
          e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
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
        padding: '6rem 2rem',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            textAlign: 'center',
            marginBottom: '4rem',
            background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Key Features
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <FeatureCard 
              icon="🎙️"
              title="Real-time Transcription"
              description="Watch your lecture transform into text in real-time with our advanced speech recognition technology."
            />
            <FeatureCard 
              icon="🤖"
              title="AI-Powered Summary"
              description="Get instant summaries and key points from your lectures, powered by advanced AI algorithms."
            />
            <FeatureCard 
              icon="📚"
              title="Smart Organization"
              description="Keep all your lecture notes organized and easily accessible in one place."
            />
            <FeatureCard 
              icon="✨"
              title="Beautiful Interface"
              description="Enjoy a modern, intuitive interface designed for the best note-taking experience."
            />
            <FeatureCard 
              icon="🔍"
              title="Quick Search"
              description="Find any lecture or specific content instantly with our powerful search feature."
            />
            <FeatureCard 
              icon="📱"
              title="Access Anywhere"
              description="Access your notes from any device, anytime, with our cloud-based storage."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(to bottom, transparent, rgba(86, 88, 245, 0.1))'
      }}>
        <h2 style={{
          fontSize: '2.5rem',
          marginBottom: '1.5rem'
        }}>
          Ready to Transform Your Note-Taking?
        </h2>
        <p style={{
          fontSize: '1.25rem',
          color: 'rgba(255, 255, 255, 0.8)',
          marginBottom: '2rem'
        }}>
          Join thousands of students making their study life easier with notez.ai
        </p>
        <button
          onClick={() => navigate('/register')}
          style={{
            padding: '1rem 2.5rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            background: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 20px rgba(100, 108, 255, 0.3)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(100, 108, 255, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(100, 108, 255, 0.3)';
          }}
        >
          Get Started Free
        </button>
      </section>

      {/* Add new styles */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.95); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.95); }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .feature-card-glow {
          opacity: 0;
        }

        div:hover .feature-card-glow {
          opacity: 1;
        }

        div:hover .feature-card-icon {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      padding: '2rem',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(8px)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
      e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      e.currentTarget.style.boxShadow = 'none';
    }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 0%, rgba(86, 88, 245, 0.15), transparent 70%)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        pointerEvents: 'none'
      }}
      className="feature-card-glow"
      />
      <div style={{
        fontSize: '2.5rem',
        marginBottom: '1rem',
        transition: 'transform 0.3s ease'
      }}
      className="feature-card-icon"
      >
        {icon}
      </div>
      <h3 style={{ 
        fontSize: '1.5rem', 
        marginBottom: '1rem',
        background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        transition: 'all 0.3s ease'
      }}>
        {title}
      </h3>
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.6',
        transition: 'color 0.3s ease'
      }}>
        {description}
      </p>
    </div>
  );
} 