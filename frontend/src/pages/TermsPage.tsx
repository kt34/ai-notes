import { Link } from 'react-router-dom';

export function TermsPage() {
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
        }}>Terms of Service</h1>

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
            }}>Service Overview</h2>
            <p style={{
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>notez.ai provides AI-powered lecture recording, transcription, and note-taking services. By using our service, you agree to these terms and our Privacy Policy.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>User Responsibilities</h2>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Maintain account security</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Provide accurate information</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Use the service legally and responsibly</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Respect intellectual property rights</li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Content Rights</h2>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• You retain ownership of your content</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• We process content to provide services</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• You grant us license to store and analyze content</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• We respect your content privacy</li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Prohibited Activities</h2>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Unauthorized access attempts</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Sharing account credentials</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Uploading illegal or harmful content</li>
              <li style={{ color: 'rgba(255, 255, 255, 0.7)' }}>• Interfering with service operation</li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Service Modifications</h2>
            <p style={{
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>We may modify or discontinue services with reasonable notice. We strive to maintain high availability but don't guarantee uninterrupted access.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.25rem',
              color: '#fff',
              marginBottom: '1rem'
            }}>Contact</h2>
            <p style={{
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>For questions about these terms, contact us at <a href="mailto:support@notez.ai" style={{ color: '#646cff', textDecoration: 'none' }}>support@notez.ai</a></p>
          </section>
        </div>
      </div>
    </div>
  );
} 