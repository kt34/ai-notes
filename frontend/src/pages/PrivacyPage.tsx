import { Link } from 'react-router-dom';

export function PrivacyPage() {
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
        }}>Privacy Policy</h1>
        
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
            }}>1. Information We Collect</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem'
            }}>We collect the following types of information:</p>
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
                Account information (email, password)
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Audio recordings of lectures
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Transcribed text and generated notes
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Usage data and analytics
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>2. How We Use Your Information</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem'
            }}>We use your information to:</p>
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
                Provide and improve our services
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Process and transcribe audio recordings
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Generate AI-powered summaries and notes
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Analyze service usage to improve features
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Communicate with you about your account
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>3. Data Storage and Security</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>Your data is stored securely in the cloud. We implement industry-standard security measures to protect your information from unauthorized access, disclosure, or breach.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>4. Data Sharing</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem'
            }}>We do not sell your personal information. We may share your data with:</p>
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
                Service providers who assist in operating our platform
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                AI processing services for transcription and summarization
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Law enforcement when required by law
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>5. Your Rights</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem'
            }}>You have the right to:</p>
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
                Access your personal data
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Correct inaccurate data
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Delete your account and associated data
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Export your data
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>6. Cookies and Tracking</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>We use cookies and similar technologies to improve user experience and analyze service usage. You can control cookie settings through your browser.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>7. Third-Party Services</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem'
            }}>We use third-party services for:</p>
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
                Speech-to-text processing
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                AI-powered summarization
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                <span style={{ color: '#646cff' }}>•</span>
                Analytics
              </li>
            </ul>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)',
              marginTop: '1rem'
            }}>These services may collect and process your data according to their own privacy policies.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>8. Data Retention</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>9. Changes to Privacy Policy</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>We may update this policy periodically. We will notify you of significant changes via email or through the service.</p>
          </section>

          <section>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#646cff',
              marginBottom: '1rem'
            }}>10. Contact Us</h2>
            <p style={{
              lineHeight: '1.7',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>For privacy-related questions or concerns, contact us at <a href="mailto:privacy@notez.ai" style={{ color: '#646cff', textDecoration: 'none' }}>privacy@notez.ai</a></p>
          </section>
        </div>
      </div>
    </div>
  );
} 