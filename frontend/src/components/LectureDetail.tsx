import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LectureDetailProps {
  lectureId: string;
  onBack: () => void;
}

interface Lecture {
  id: string;
  user_id: string;
  transcript: string;
  summary: string;
  created_at: string;
  updated_at: string;
  lecture_title: string;
  topic_summary_sentence: string;
  key_concepts: string[];
  main_points_covered: string[];
  examples_mentioned: string[];
  important_quotes: string[];
  conclusion_takeaways: string;
  references: string[];
}

export function LectureDetail({ lectureId, onBack }: LectureDetailProps) {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchLecture = async () => {
      try {
        const response = await fetch(`http://localhost:8000/lectures/${lectureId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch lecture');
        }

        const data = await response.json();
        setLecture(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };

    fetchLecture();
  }, [lectureId, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        color: 'rgba(255, 255, 255, 0.8)'
      }}>
        Loading lecture...
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: '#ef4444',
        padding: '2rem'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          Error: {error || 'Lecture not found'}
        </div>
        <button 
          onClick={onBack}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            color: '#ef4444',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 style={{ 
      color: '#fff',
      fontSize: '1.2rem',
      marginBottom: '1rem',
      marginTop: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      paddingBottom: '0.5rem'
    }}>
      {children}
    </h3>
  );

  const ListItem = ({ children }: { children: React.ReactNode }) => (
    <li style={{
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '0.5rem',
      lineHeight: '1.5'
    }}>
      {children}
    </li>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem',
            borderRadius: '6px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
          }}
        >
          ← Back to Lectures
        </button>
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ 
              color: '#fff',
              fontSize: '2rem',
              marginBottom: '0.5rem',
              background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {lecture.lecture_title}
            </h1>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.875rem',
              display: 'flex',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <span>{formatDate(lecture.created_at)}</span>
              <span>•</span>
              <span>{calculateReadingTime(lecture.transcript)}</span>
            </div>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              padding: '1rem',
              background: 'rgba(86, 88, 245, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(86, 88, 245, 0.2)'
            }}>
              {lecture.topic_summary_sentence}
            </p>
          </div>

          <SectionTitle>✨ Key Concepts</SectionTitle>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {lecture.key_concepts.map((concept, index) => (
              <li key={index} style={{
                background: 'rgba(86, 88, 245, 0.1)',
                border: '1px solid rgba(86, 88, 245, 0.2)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.9rem'
              }}>
                {concept}
              </li>
            ))}
          </ul>

          <SectionTitle>📝 Main Points</SectionTitle>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {lecture.main_points_covered.map((point, index) => (
              <ListItem key={index}>{point}</ListItem>
            ))}
          </ul>

          <SectionTitle>💡 Examples</SectionTitle>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {lecture.examples_mentioned.map((example, index) => (
              <ListItem key={index}>{example}</ListItem>
            ))}
          </ul>

          <SectionTitle>💬 Important Quotes</SectionTitle>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {lecture.important_quotes.map((quote, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '0.75rem',
                borderLeft: '3px solid rgba(86, 88, 245, 0.5)',
                color: 'rgba(255, 255, 255, 0.8)',
                fontStyle: 'italic'
              }}>
                {quote}
              </div>
            ))}
          </ul>

          <SectionTitle>🎯 Conclusion</SectionTitle>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6',
            padding: '1rem',
            background: 'rgba(86, 88, 245, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(86, 88, 245, 0.2)'
          }}>
            {lecture.conclusion_takeaways}
          </p>

          {lecture.references.length > 0 && (
            <>
              <SectionTitle>📚 References</SectionTitle>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {lecture.references.map((ref, index) => (
                  <li key={index} style={{
                    marginBottom: '0.5rem'
                  }}>
                    <a 
                      href={ref}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#646cff',
                        textDecoration: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#8c8eff';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#646cff';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {ref}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div style={{
            marginTop: '2rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <button
              onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '1.2rem'
              }}>
                <span>📄</span> Full Transcript
              </div>
              <span style={{
                transform: isTranscriptExpanded ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s ease'
              }}>
                ▼
              </span>
            </button>
            <div style={{
              maxHeight: isTranscriptExpanded ? '1000px' : '0',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{
                padding: '1.5rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '1rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {lecture.transcript}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 