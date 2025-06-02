import { Link } from 'react-router-dom';

export function PrivacyPage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      color: '#fff',
      background: '#1a1a2e',
      minHeight: '100vh'
    }}>
      <Link to="/register" style={{
        position: 'fixed',
        top: '2rem',
        left: '2rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#646cff',
        textDecoration: 'none',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateX(-4px)';
        e.currentTarget.style.color = '#7c82ff';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.color = '#646cff';
      }}
      >← Back to Registration</Link>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '12px',
        padding: '2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '5rem'
      }}>
        <h1 style={{ 
          marginBottom: '2.5rem',
          fontSize: '2rem',
          color: '#fff',
          textAlign: 'left'
        }}>Privacy Policy</h1>

        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Last Updated: April 15, 2024
        </p>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>How We Collect and Use Information</h2>
            <p style={{
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '1rem'
            }}>We collect information when you:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Create and use your account</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Upload and process lecture recordings</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Interact with our services</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Contact our support team</li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Information We Process</h2>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Account information (email, name)</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Audio recordings and transcriptions</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Generated summaries and notes</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Usage analytics and preferences</li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>How We Share Information</h2>
            <p style={{
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>We share your information only with:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Service providers for processing and storage</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• AI services for transcription and summarization</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Law enforcement when legally required</li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Your Rights</h2>
            <p style={{
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>You have the right to:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Access your personal data</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Request data deletion</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Export your data</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Update your information</li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Contact Us</h2>
            <p style={{
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>For privacy-related inquiries, contact us at <a href="mailto:privacy@notez.ai" style={{ color: '#646cff', textDecoration: 'none' }}>privacy@notez.ai</a></p>
          </section>
        </div>
      </div>
    </div>
  );
} 