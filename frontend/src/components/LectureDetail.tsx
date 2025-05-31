import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface Lecture {
  id: string;
  user_id: string;
  transcript: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

interface LectureDetailProps {
  lectureId: string;
  onBack: () => void;
}

export function LectureDetail({ lectureId, onBack }: LectureDetailProps) {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lecture');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLecture();
  }, [lectureId, token]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: 'rgba(255, 255, 255, 0.8)'
      }}>
        Loading lecture...
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div style={{ 
        padding: '2rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '8px',
        color: '#ef4444',
        margin: '2rem auto',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        {error || 'Lecture not found'}
      </div>
    );
  }

  const formattedDate = new Date(lecture.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const lectureTitle = lecture.summary.split('\n')[0]?.replace('- Lecture Title: ', '') || 'Untitled Lecture';
  const summaryPoints = lecture.summary.split('\n').slice(1).filter(line => line.trim());

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '2rem',
          padding: '0.5rem',
          borderRadius: '4px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
      >
        ← Back to Lectures
      </button>

      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            color: '#fff',
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            {lectureTitle}
          </h1>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.875rem'
          }}>
            {formattedDate}
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{ 
              color: '#fff',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>📝</span> Transcript
            </h2>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.5rem',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {lecture.transcript}
            </div>
          </div>

          <div>
            <h2 style={{ 
              color: '#fff',
              fontSize: '1.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>✨</span> Summary
            </h2>
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.5rem',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '1rem',
              lineHeight: '1.6'
            }}>
              {summaryPoints.map((point, index) => (
                <div 
                  key={index}
                  style={{
                    marginBottom: '1rem',
                    paddingLeft: point.startsWith('  ') ? '1.5rem' : '0'
                  }}
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          color: 'rgba(255, 255, 255, 0.4)',
          fontSize: '0.875rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '1rem'
        }}>
          <span>🎤 {Math.ceil(lecture.transcript.split(' ').length / 130)} min read</span>
          <span>•</span>
          <span>📝 {summaryPoints.length} key points</span>
          <span>•</span>
          <span>Last updated: {new Date(lecture.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
} 