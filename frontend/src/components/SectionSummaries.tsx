import { useState } from 'react';

// Re-using the CopyButton component for consistent styling.
// In a larger app, this would be in its own file (e.g., components/ui/CopyButton.tsx)
function CopyButton({ text, label = "Copy", style = {} }: { text: string; label?: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the accordion from toggling when clicking the button
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseStyle: React.CSSProperties = {
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
    transition: 'all 0.2s ease',
    ...style,
  };

  return (
    <button
      onClick={handleCopy}
      style={baseStyle}
      onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
    >
      <span style={{ fontSize: '1rem' }}>{copied ? '✓' : '📋'}</span>
      {copied ? 'Copied!' : label}
    </button>
  );
}

// Updated interface to match the new data structure from the backend
interface SectionSummary {
  section_title: string;
  key_takeaways: string[];
  new_vocabulary: string[];
  study_questions: string[];
  context_link: string;
}

interface SectionSummariesProps {
  sections: SectionSummary[];
}

export function SectionSummaries({ sections }: SectionSummariesProps) {
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const toggleSection = (index: number) => {
    setExpandedSections(prev => ({ ...prev, [index]: !prev[index] }));
  };
  
  const formatSectionForCopy = (section: SectionSummary): string => {
    let content = `### ${section.section_title}\n\n`;
    if (section.key_takeaways?.length > 0) {
      content += `**Key Takeaways:**\n${section.key_takeaways.map(t => `- ${t}`).join('\n')}\n\n`;
    }
    if (section.new_vocabulary?.length > 0) {
      content += `**New Vocabulary:**\n${section.new_vocabulary.join(', ')}\n\n`;
    }
    if (section.study_questions?.length > 0) {
      content += `**Study Questions:**\n${section.study_questions.map(q => `- ${q}`).join('\n')}\n\n`;
    }
    if (section.context_link) {
      content += `**Context:**\n${section.context_link}`;
    }
    return content.trim();
  };

  if (!sections || sections.length === 0) {
    return (
      <div style={{
        padding: '1.5rem',
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        No section-by-section analysis available for this lecture.
      </div>
    );
  }

  const DetailSection = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
      <h4 style={{
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '0.75rem',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        margin: 0
      }}>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        {title}
      </h4>
      {children}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {sections.map((section, index) => (
        <div
          key={index}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            overflow: 'hidden',
            transition: 'all 0.3s ease-in-out',
            textAlign: 'left'
          }}
        >
          <div
            onClick={() => toggleSection(index)}
            style={{
              padding: '1rem 1.5rem',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: expandedSections[index] ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{
                background: 'rgba(100, 108, 255, 0.1)',
                color: 'rgba(190, 192, 255, 1)',
                borderRadius: '6px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}>
                {index + 1}
              </span>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>
                {section.section_title || `Section ${index + 1}`}
              </h3>
            </div>
            <span style={{
              transform: expandedSections[index] ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s ease',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '1.2rem'
            }}>
              ▼
            </span>
          </div>

          {expandedSections[index] && (
            <div style={{ padding: '1.5rem', background: 'rgba(0, 0, 0, 0.1)', position: 'relative' }}>
               <CopyButton
                  text={formatSectionForCopy(section)}
                  label="Copy Section"
                  style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}
                />
              
              {section.key_takeaways?.length > 0 && (
                <DetailSection title="Key Takeaways" icon="🎯">
                  <ul style={{ margin: '0.75rem 0 0 1.5rem', padding: 0, color: 'rgba(255, 255, 255, 0.8)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {section.key_takeaways.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </DetailSection>
              )}

              {section.new_vocabulary?.length > 0 && (
                <DetailSection title="New Vocabulary" icon="📘">
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {section.new_vocabulary.map((vocab, i) => (
                      <span key={i} style={{
                        background: 'rgba(100, 108, 255, 0.1)',
                        border: '1px solid rgba(100, 108, 255, 0.2)',
                        color: 'rgba(190, 192, 255, 1)',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '16px',
                        fontSize: '0.9rem',
                        fontWeight: 500
                      }}>
                        {vocab}
                      </span>
                    ))}
                  </div>
                </DetailSection>
              )}

              {section.study_questions?.length > 0 && (
                <DetailSection title="Study Questions" icon="❓">
                   <ul style={{ margin: '0.75rem 0 0 1.5rem', padding: 0, color: 'rgba(255, 255, 255, 0.8)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {section.study_questions.map((question, i) => (
                      <li key={i}>{question}</li>
                    ))}
                  </ul>
                </DetailSection>
              )}
              
              {section.context_link && (
                 <DetailSection title="Context" icon="🔗">
                    <p style={{ marginTop: '0.75rem', margin: 0, paddingLeft: '0.5rem', color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', borderLeft: '2px solid rgba(100, 108, 255, 0.3)' }}>
                        {section.context_link}
                    </p>
                 </DetailSection>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 