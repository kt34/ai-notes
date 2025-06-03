import { useNavigate } from 'react-router-dom';

export function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <>
      <div 
        onClick={() => navigate('/register')}
        style={{ 
          position: 'fixed',
          top: '2rem',
          left: '2rem',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '0.9rem',
          transition: 'all 0.2s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.transform = 'translateX(-4px)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        ← Back
      </div>
      <div style={{
        minHeight: '100vh',
        padding: '2rem',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)'
      }}>
        <div style={{
          maxWidth: '800px',
          width: '100%',
          margin: '4rem auto',
          padding: '3rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'left'
        }}>
          <h1 style={{ 
            marginBottom: '2rem',
            fontSize: '2rem',
            color: '#fff',
            textAlign: 'left'
          }}>Privacy Policy</h1>

          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '2rem',
            textAlign: 'left'
          }}>
            Last Updated: April 15, 2024
          </p>
          
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            textAlign: 'left'
          }}>
            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>1. Information Collection and Use</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>At notez.ai, we collect and process information when users create and interact with their accounts, upload and process lecture recordings, engage with our services, and contact our support team. This information is essential for providing our AI-powered lecture note-taking services and improving user experience.</p>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>The collection of this information enables us to provide personalized services, maintain platform security, and enhance our features based on user interaction patterns and feedback. We are committed to using this information solely for the purposes outlined in this policy.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>2. Types of Information Processed</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>We process various types of information to provide our services effectively. This includes account information such as email addresses and names, which are used for authentication and communication purposes. We also process audio recordings and their resulting transcriptions, which are essential for our core note-taking service.</p>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>Additionally, we collect and process generated summaries, notes, and usage analytics to improve our service quality and user experience. This information helps us understand how users interact with our platform and allows us to make necessary improvements to our services.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>3. Information Sharing and Disclosure</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>We maintain strict controls over how your information is shared and only disclose it in specific circumstances. Your information may be shared with trusted service providers who assist in processing and storing data, and with AI services that help power our transcription and summarization features. These third-party providers are bound by strict confidentiality agreements and data protection requirements.</p>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>In certain situations, we may be required to share information with law enforcement agencies or regulatory bodies to comply with legal obligations. We will only do so when legally required and will make reasonable efforts to notify affected users when permitted by law.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>4. Your Privacy Rights</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>We respect and uphold your privacy rights in accordance with applicable data protection laws. You have the right to access your personal data stored in our systems and can request a copy of this information at any time. You may also request the deletion of your personal data from our systems, subject to legal retention requirements and service obligations.</p>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>Furthermore, you have the right to export your data in a machine-readable format and update your information as needed. We are committed to facilitating these rights and will respond to such requests in a timely manner.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>5. Contact Information</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>If you have any questions, concerns, or requests regarding your privacy rights or this privacy policy, please contact our dedicated privacy team at <a href="mailto:privacy@notez.ai" style={{ color: '#646cff', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.color = '#7c82ff'} onMouseOut={(e) => e.currentTarget.style.color = '#646cff'}>privacy@notez.ai</a>. We are committed to addressing your privacy concerns and maintaining transparent communication with our users.</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
} 