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

// Copy button component
function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: copied ? 'rgba(86, 88, 245, 0.2)' : 'rgba(255, 255, 255, 0.05)',
        border: '1px solid ' + (copied ? 'rgba(86, 88, 245, 0.3)' : 'rgba(255, 255, 255, 0.1)'),
        borderRadius: '6px',
        padding: '0.4rem 0.8rem',
        color: copied ? '#8c8eff' : 'rgba(255, 255, 255, 0.6)',
        fontSize: '0.8rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.color = '#fff';
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
        }
      }}
    >
      <span style={{ fontSize: '1rem' }}>
        {copied ? '✓' : '📋'}
      </span>
      {copied ? 'Copied!' : label}
    </button>
  );
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

  const SectionTitle = ({ children, copyButton }: { children: React.ReactNode, copyButton?: React.ReactNode }) => (
    <div style={{ 
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1rem',
      marginTop: '1.5rem',
      paddingBottom: '0.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <h3 style={{ 
        color: '#fff',
        fontSize: '1.2rem',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {children}
      </h3>
      {copyButton}
    </div>
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
              border: '1px solid rgba(86, 88, 245, 0.2)',
              textAlign: 'left'
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
            gap: '0.75rem'
          }}>
            {lecture.key_concepts && lecture.key_concepts.length > 0 ? (
              lecture.key_concepts.map((concept, index) => (
                <li key={index} style={{
                  background: 'rgba(86, 88, 245, 0.1)',
                  border: '1px solid rgba(86, 88, 245, 0.2)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>•</span>
                  {concept}
                </li>
              ))
            ) : (
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontStyle: 'italic',
                padding: '0.5rem',
                textAlign: 'left'
              }}>
                No key concepts identified for this lecture
              </div>
            )}
          </ul>

          <SectionTitle 
            copyButton={
              <CopyButton 
                text={lecture.main_points_covered?.join('\n\n') || ''} 
                label="Copy All Points"
              />
            }
          >
            📝 Main Points
          </SectionTitle>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {lecture.main_points_covered && lecture.main_points_covered.length > 0 ? (
              lecture.main_points_covered.map((point, index) => (
                <li key={index} style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  lineHeight: '1.5',
                  textAlign: 'left',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start'
                }}>
                  <span style={{ 
                    color: 'rgba(255, 255, 255, 0.4)',
                    minWidth: '24px',
                    height: '24px',
                    background: 'rgba(86, 88, 245, 0.1)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem'
                  }}>
                    {index + 1}
                  </span>
                  {point}
                </li>
              ))
            ) : (
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontStyle: 'italic',
                padding: '0.5rem',
                textAlign: 'left'
              }}>
                No main points were extracted from this lecture
              </div>
            )}
          </ul>

          <SectionTitle
            copyButton={
              <CopyButton 
                text={lecture.examples_mentioned?.join('\n\n') || ''} 
                label="Copy All Examples"
              />
            }
          >
            💡 Examples
          </SectionTitle>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            {lecture.examples_mentioned && lecture.examples_mentioned.length > 0 ? (
              lecture.examples_mentioned.map((example, index) => (
                <li key={index} style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  lineHeight: '1.5',
                  textAlign: 'left',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  borderLeft: '3px solid rgba(86, 88, 245, 0.3)'
                }}>
                  <span style={{ 
                    color: '#8c8eff',
                    fontSize: '1.1rem',
                    opacity: 0.8
                  }}>
                    →
                  </span>
                  {example}
                </li>
              ))
            ) : (
              <div style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontStyle: 'italic',
                padding: '0.5rem',
                textAlign: 'left'
              }}>
                No specific examples were mentioned in this lecture
              </div>
            )}
          </ul>

          <SectionTitle
            copyButton={
              lecture.important_quotes && lecture.important_quotes.length > 0 ? (
                <CopyButton 
                  text={lecture.important_quotes.join('\n\n')} 
                  label="Copy All Quotes"
                />
              ) : null
            }
          >
            💬 Important Quotes
          </SectionTitle>
          {lecture.important_quotes && lecture.important_quotes.length > 0 ? (
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {lecture.important_quotes.map((quote, index) => (
                <div key={index} style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  borderLeft: '3px solid rgba(86, 88, 245, 0.5)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontStyle: 'italic',
                  textAlign: 'left',
                  position: 'relative'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: '-2px',
                    top: '-8px',
                    color: 'rgba(140, 142, 255, 0.6)',
                    fontSize: '1.5rem'
                  }}></span>
                  {quote}
                </div>
              ))}
            </ul>
          ) : (
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic',
              padding: '0.5rem',
              textAlign: 'left'
            }}>
              No notable quotes were captured from this lecture
            </div>
          )}

          <SectionTitle>🎯 Conclusion</SectionTitle>
          {lecture.conclusion_takeaways ? (
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: '1.6',
              padding: '1rem',
              background: 'rgba(86, 88, 245, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(86, 88, 245, 0.2)',
              textAlign: 'left'
            }}>
              {lecture.conclusion_takeaways}
            </p>
          ) : (
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontStyle: 'italic',
              padding: '0.5rem',
              textAlign: 'left'
            }}>
              No conclusion summary is available for this lecture
            </div>
          )}

          {lecture.references && lecture.references.length > 0 ? (
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
          ) : null}

          <div style={{
            marginTop: '2rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              background: isTranscriptExpanded ? 'rgba(255, 255, 255, 0.05)' : 'none',
              transition: 'background 0.2s ease'
            }}>
              <button
                onClick={() => setIsTranscriptExpanded(!isTranscriptExpanded)}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '1.2rem'
                }}
              >
                <span>📄</span> Full Transcript
                <span style={{
                  transform: isTranscriptExpanded ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.3s ease',
                  marginLeft: '0.5rem'
                }}>
                  ▼
                </span>
              </button>
              <CopyButton 
                text={lecture.transcript || ''} 
                label="Copy Transcript"
              />
            </div>
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