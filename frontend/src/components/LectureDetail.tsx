import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LectureDetailProps {
  lectureId: string;
  onBack: () => void;
}

interface Lecture {
  id: string;
  created_at: string;
  transcript: string;
  summary: string;
  title: string;
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
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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
            <h2 style={{ 
              color: '#fff',
              fontSize: '1.5rem',
              marginBottom: '0.5rem'
            }}>
              {lecture.title || `Untitled Lecture #${lecture.id.slice(0, 8)}`}
            </h2>
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.875rem',
              display: 'flex',
              gap: '1rem'
            }}>
              <span>{formatDate(lecture.created_at)}</span>
              <span>•</span>
              <span>{calculateReadingTime(lecture.transcript)}</span>
            </div>
          </div>

          <div style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
            {lecture.transcript}
          </div>
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          padding: '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          height: 'fit-content',
          position: 'sticky',
          top: '2rem'
        }}>
          <h2 style={{ 
            color: '#fff',
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>✨</span> Summary
          </h2>
          <div style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap'
          }}>
            {lecture.summary}
          </div>
        </div>
      </div>
    </div>
  );
} 