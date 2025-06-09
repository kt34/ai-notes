import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';
import { SectionSummaries } from './SectionSummaries';

interface Reference {
  title: string;
  url: string;
}

interface Lecture {
  id: string;
  user_id: string;
  transcript: string;
  summary: string;
  lecture_title: string;
  topic_summary_sentence: string;
  key_concepts: string[];
  main_points_covered: string[];
  conclusion_takeaways: string[];
  references: Reference[];
  created_at: string;
  section_summaries: Array<{
    section_title: string;
    key_takeaways: string[];
    new_vocabulary: string[];
    study_questions: string[];
    examples: string[];
    useful_references: Reference[];
  }>;
}

interface LectureDetailProps {
  lectureId: string;
  onBack: () => void;
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
        const data = await apiRequest(`/lectures/${lectureId}`, {
          token
        });

        // Defensively parse stringified JSON in references
        if (data.references && data.references.length > 0 && typeof data.references[0] === 'string') {
          data.references = data.references.map((refStr: string) => {
            try {
              return JSON.parse(refStr);
            } catch (e) {
              console.error("Failed to parse reference string:", refStr, e);
              return { title: "Invalid Reference", url: "#" };
            }
          });
        }
        
        if (data.section_summaries && data.section_summaries.length > 0) {
          data.section_summaries.forEach((section: any) => {
            if (section.useful_references && section.useful_references.length > 0 && typeof section.useful_references[0] === 'string') {
              section.useful_references = section.useful_references.map((refStr: string) => {
                try {
                  return JSON.parse(refStr);
                } catch (e) {
                  console.error("Failed to parse useful_reference string:", refStr, e);
                  return { title: "Invalid Reference", url: "#" };
                }
              });
            }
          });
        }

        setLecture(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
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

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (e) {
      return url;
    }
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

  // function renderSection(section: Lecture['section_summaries'][0], index: number) {
  //   return (
  //     <div key={index} style={{
  //       background: 'rgba(255, 255, 255, 0.04)',
  //       borderRadius: '8px',
  //       padding: '1.5rem',
  //       border: '1px solid rgba(255, 255, 255, 0.1)'
  //     }}>
  //       <h4 style={{ color: '#fff', fontSize: '1.2rem', margin: '0 0 1rem 0' }}>{section.section_title}</h4>
        
  //       {renderList("Key Takeaways", section.key_takeaways)}
  //       {renderList("New Vocabulary / Concepts", section.new_vocabulary)}
  //       {renderList("Study Questions", section.study_questions)}
  //       {renderList("Examples", section.examples)}
  //     </div>
  //   );
  // }

  // function renderList(title: string, items: string[] | undefined) {
  //   if (!items || items.length === 0) {
  //     return null;
  //   }

  //   return (
  //     <div style={{ marginBottom: '1rem' }}>
  //       <h5 style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1rem', margin: '0 0 0.5rem 0' }}>{title}</h5>
  //       <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0 }}>
  //         {items.map((item, index) => (
  //           <li key={index} style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.25rem' }}>{item}</li>
  //         ))}
  //       </ul>
  //     </div>
  //   );
  // }

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
            padding: 0,
            fontSize: '1rem'
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
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ 
              color: '#fff',
              marginTop: 0,
              marginBottom: '1rem',
              fontSize: '2rem',
              background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {lecture.lecture_title}
            </h1>
            
            <div style={{ 
              display: 'flex',
              gap: '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.9rem',
              marginBottom: '1.5rem'
            }}>
              <span>{formatDate(lecture.created_at)}</span>
              <span>•</span>
              <span>{calculateReadingTime(lecture.transcript)}</span>
            </div>

            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              marginBottom: '0',
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
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {lecture.key_concepts.map((concept, index) => (
              <li key={index} style={{ 
                background: 'rgba(86, 88, 245, 0.15)',
                color: '#d4d4ff',
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}>
                {concept}
              </li>
            ))}
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
                    -
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

          {/* Section-by-Section Breakdown */}
          <div style={{ marginBottom: '2rem' }}>
            <SectionTitle>
              <span>📑 Section-by-Section Breakdown</span>
            </SectionTitle>
            <SectionSummaries sections={lecture.section_summaries} />
          </div>

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

          {lecture.references && lecture.references.length > 0 && (
            <>
              <SectionTitle>📚 Suggested References</SectionTitle>
              <ul style={{ 
                listStyle: 'none', 
                padding: 0,
                marginBottom: '2rem',
                textAlign: 'left'
              }}>
                {lecture.references.map((ref, index) => (
                  <li key={index} style={{ marginBottom: '1rem' }}>
                    <a 
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#a7a9ff',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                        fontWeight: 500
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#c0c2ff';
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#a7a9ff';
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {ref.title}
                    </a>
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      margin: '0.25rem 0 0'
                    }}>
                      Source: {getDomain(ref.url)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Full Transcript (at the very bottom) */}
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
              height: isTranscriptExpanded ? 'auto' : '0',
              opacity: isTranscriptExpanded ? 1 : 0,
              visibility: isTranscriptExpanded ? 'visible' : 'hidden',
              overflow: 'hidden',
              transition: 'opacity 0.3s ease, visibility 0.3s ease',
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