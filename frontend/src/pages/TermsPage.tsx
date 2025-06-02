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
        }}>Terms and Conditions</h1>
        
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
    title: 'Acceptance of Terms',
    content: 'By accessing and using notez.ai, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our service.'
  },
  {
    title: 'Service Description',
    content: 'notez.ai provides an AI-powered lecture recording and note-taking service. The service includes real-time transcription, summarization, and organization of lecture content.'
  },
  {
    title: 'User Accounts',
    content: 'You must register for an account to use our services. You are responsible for maintaining the confidentiality of your account information and for all activities under your account.'
  },
  {
    title: 'User Content',
    content: 'You retain ownership of any content you create or upload to notez.ai. By using our service, you grant us a license to store, process, and analyze your content to provide and improve our services.'
  },
  {
    title: 'Acceptable Use',
    content: {
      text: 'You agree not to:',
      items: [
        'Use the service for any illegal purpose',
        'Share your account credentials',
        'Attempt to gain unauthorized access to the service',
        'Upload content that infringes on others\' rights'
      ]
    }
  },
  {
    title: 'Service Availability',
    content: 'While we strive for high availability, we do not guarantee uninterrupted access to the service. We reserve the right to modify or discontinue features without prior notice.'
  },
  {
    title: 'Intellectual Property',
    content: 'The service, including its software, design, and content created by us, is protected by intellectual property rights and remains our property.'
  },
  {
    title: 'Limitation of Liability',
    content: 'notez.ai is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service.'
  },
  {
    title: 'Changes to Terms',
    content: 'We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.'
  },
  {
    title: 'Contact',
    content: 'For questions about these terms, please contact us at support@notez.ai'
  }
]; 