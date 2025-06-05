import { useState } from 'react';

interface SectionSummary {
  timestamp_marker: string;
  main_topics: string[];
  key_points: string[];
  examples: string[] | null;
  summary: string;
}

interface SectionSummariesProps {
  sections: SectionSummary[];
}

export function SectionSummaries({ sections }: SectionSummariesProps) {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (!sections || sections.length === 0) {
    return (
      <div style={{
        padding: '1rem',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
      }}>
        No section summaries available
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {sections.map((section, index) => (
        <div
          key={index}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => toggleSection(index)}
            style={{
              padding: '1rem',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: expandedSections[index] ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.4)', 
                fontSize: '0.9rem' 
              }}>
                {section.timestamp_marker}
              </span>
              <span style={{ color: '#fff' }}>
                {section.main_topics.join(', ')}
              </span>
            </div>
            <span style={{ 
              transform: expandedSections[index] ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              ▼
            </span>
          </div>
          
          {expandedSections[index] && (
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  Summary
                </h4>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  {section.summary}
                </p>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  Key Points
                </h4>
                <ul style={{ 
                  margin: 0,
                  paddingLeft: '1.5rem',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {section.key_points.map((point, i) => (
                    <li key={i} style={{ marginBottom: '0.3rem' }}>{point}</li>
                  ))}
                </ul>
              </div>

              {section.examples && section.examples.length > 0 && (
                <div>
                  <h4 style={{ 
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '0.5rem',
                    fontSize: '0.9rem'
                  }}>
                    Examples
                  </h4>
                  <ul style={{ 
                    margin: 0,
                    paddingLeft: '1.5rem',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    {section.examples.map((example, i) => (
                      <li key={i} style={{ marginBottom: '0.3rem' }}>{example}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 