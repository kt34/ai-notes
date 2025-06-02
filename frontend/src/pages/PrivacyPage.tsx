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
        padding: '2.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.2)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem',
          marginBottom: '2.5rem',
          background: 'linear-gradient(120deg, #646cff, #8c8eff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>Privacy Policy</h1>
        
        <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem', marginBottom: '3rem', textAlign: 'center' }}>
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        
        {sections.map((section, index) => (
          <section key={index} style={{ 
            marginBottom: index === sections.length - 1 ? 0 : '2.5rem',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem',
              marginBottom: '1rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{
                background: 'rgba(100, 108, 255, 0.1)',
                color: '#646cff',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}>{index + 1}</span>
              {section.title}
            </h2>
            {typeof section.content === 'string' ? (
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.6',
                fontSize: '0.95rem'
              }}>{section.content}</p>
            ) : (
              <>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.6',
                  fontSize: '0.95rem',
                  marginBottom: '1rem'
                }}>{section.content.text}</p>
                <ul style={{ 
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {section.content.items.map((item, i) => (
                    <li key={i} style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#646cff',
                        flexShrink: 0
                      }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

const sections = [
  {
    title: 'Information We Collect',
    content: {
      text: 'We collect the following types of information:',
      items: [
        'Account information (email, password)',
        'Audio recordings of lectures',
        'Transcribed text and generated notes',
        'Usage data and analytics'
      ]
    }
  },
  {
    title: 'How We Use Your Information',
    content: {
      text: 'We use your information to:',
      items: [
        'Provide and improve our services',
        'Process and transcribe audio recordings',
        'Generate AI-powered summaries and notes',
        'Analyze service usage to improve features',
        'Communicate with you about your account'
      ]
    }
  },
  {
    title: 'Data Storage and Security',
    content: 'Your data is stored securely in the cloud. We implement industry-standard security measures to protect your information from unauthorized access, disclosure, or breach.'
  },
  {
    title: 'Data Sharing',
    content: {
      text: 'We do not sell your personal information. We may share your data with:',
      items: [
        'Service providers who assist in operating our platform',
        'AI processing services for transcription and summarization',
        'Law enforcement when required by law'
      ]
    }
  },
  {
    title: 'Your Rights',
    content: {
      text: 'You have the right to:',
      items: [
        'Access your personal data',
        'Correct inaccurate data',
        'Delete your account and associated data',
        'Export your data'
      ]
    }
  },
  {
    title: 'Cookies and Tracking',
    content: 'We use cookies and similar technologies to improve user experience and analyze service usage. You can control cookie settings through your browser.'
  },
  {
    title: 'Third-Party Services',
    content: {
      text: 'We use third-party services for:',
      items: [
        'Speech-to-text processing',
        'AI-powered summarization',
        'Analytics'
      ]
    }
  },
  {
    title: 'Data Retention',
    content: 'We retain your data for as long as your account is active or as needed to provide services. You can request deletion of your data at any time.'
  },
  {
    title: 'Changes to Privacy Policy',
    content: 'We may update this policy periodically. We will notify you of significant changes via email or through the service.'
  },
  {
    title: 'Contact Us',
    content: 'For privacy-related questions or concerns, contact us at privacy@notez.ai'
  }
]; 