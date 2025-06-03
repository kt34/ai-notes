import { useNavigate } from 'react-router-dom';

export function TermsPage() {
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
          }}>Terms of Service</h1>

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
              }}>1. Service Overview</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>notez.ai provides AI-powered lecture recording, transcription, and note-taking services. By using our service, you agree to these terms and our Privacy Policy. Our platform is designed to help students and educators enhance their learning experience through automated transcription and intelligent summarization of educational content.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>2. User Responsibilities</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>As a user of notez.ai, you are responsible for maintaining the security of your account credentials and ensuring they are not shared with others. You must provide accurate and truthful information during registration and while using our services. Users are expected to use the platform in a legal and responsible manner, respecting intellectual property rights and adhering to academic integrity standards.</p>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>Users must not engage in any activity that could compromise the security or functionality of the service. This includes attempting to access other users' accounts, manipulating the platform's code, or distributing content without proper authorization.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>3. Content Rights and Usage</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>Users retain full ownership of all content uploaded to notez.ai, including audio recordings, transcriptions, and generated notes. By using our service, you grant notez.ai a limited license to store, process, and analyze your content solely for the purpose of providing and improving our services.</p>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>We are committed to maintaining the privacy and security of your content. Your materials will not be shared with third parties without your explicit consent, except as required by law or as necessary to provide our services.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>4. Prohibited Activities</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>Users are strictly prohibited from attempting unauthorized access to our systems, sharing account credentials, uploading illegal or harmful content, or interfering with the service's operation. Any violation of these terms may result in immediate account suspension or termination. We reserve the right to report illegal activities to appropriate law enforcement authorities.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>5. Service Modifications</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>notez.ai reserves the right to modify, suspend, or discontinue any aspect of our services with reasonable notice to users. While we strive to maintain high availability and reliability, we do not guarantee uninterrupted access to our services. We may periodically update these terms to reflect changes in our services or legal requirements, and continued use of our platform constitutes acceptance of such changes.</p>
            </section>

            <section>
              <h2 style={{
                fontSize: '1.25rem',
                color: '#fff',
                marginBottom: '1rem',
                fontWeight: '600',
                textAlign: 'left'
              }}>6. Contact Information</h2>
              <p style={{
                lineHeight: '1.6',
                color: 'rgba(255, 255, 255, 0.7)',
                textAlign: 'left'
              }}>If you have any questions or concerns about these terms of service, please contact our support team at <a href="mailto:support@notez.ai" style={{ color: '#646cff', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.color = '#7c82ff'} onMouseOut={(e) => e.currentTarget.style.color = '#646cff'}>support@notez.ai</a>. We are committed to addressing your concerns and maintaining transparent communication with our users.</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
} 