import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '3rem 2rem',
      color: '#fff',
      background: '#1a1a2e',
      minHeight: '100vh'
    }}>
      <Link to="/register" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '3rem',
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
        borderRadius: '16px',
        padding: '3rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
      }}>
        <h1 style={{ 
          marginBottom: '3rem',
          fontSize: '2.5rem',
          background: 'linear-gradient(120deg, #646cff, #8c8eff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>Terms and Conditions</h1>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem'
        }}>
          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>1. Acceptance of Terms</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>By accessing and using notez.ai, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our service.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>2. Service Description</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>notez.ai provides an AI-powered lecture recording and note-taking service. The service includes real-time transcription, summarization, and organization of lecture content.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>3. User Accounts</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>You must register for an account to use our services. You are responsible for maintaining the confidentiality of your account information and for all activities under your account.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>4. User Content</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>You retain ownership of any content you create or upload to notez.ai. By using our service, you grant us a license to store, process, and analyze your content to provide and improve our services.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>5. Acceptable Use</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem'
            }}>You agree not to:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Use the service for any illegal purpose
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Share your account credentials
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Attempt to gain unauthorized access to the service
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Upload content that infringes on others' rights
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>6. Service Availability</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>While we strive for high availability, we do not guarantee uninterrupted access to the service. We reserve the right to modify or discontinue features without prior notice.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>7. Intellectual Property</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>The service, including its software, design, and content created by us, is protected by intellectual property rights and remains our property.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>8. Limitation of Liability</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>notez.ai is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>9. Changes to Terms</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>10. Contact</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>For questions about these terms, please contact us at <a href="mailto:support@notez.ai" style={{ color: '#646cff', textDecoration: 'none' }}>support@notez.ai</a></p>
          </section>
        </div>
      </div>
    </div>
  );
} 