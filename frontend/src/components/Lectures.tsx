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

export function Lectures() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const response = await fetch(`http://localhost:8000/lectures`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch lectures');
        }

        const data = await response.json();
        setLectures(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lectures');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLectures();
  }, [token]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh',
        color: 'rgba(255, 255, 255, 0.8)'
      }}>
        Loading lectures...
      </div>
    );
  }

  if (error) {
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
        {error}
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center',
        padding: '4rem 2rem',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#fff' }}>No Lectures Yet</h2>
        <p>Start recording your first lecture to see it here!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ 
        color: '#fff',
        marginBottom: '2rem',
        fontSize: '2rem',
        textAlign: 'center'
      }}>
        Your Lectures
      </h1>
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {lectures.map((lecture) => (
          <div
            key={lecture.id}
            className="lecture-card"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
            }}
          >
            <div style={{ 
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '1rem'
            }}>
              {new Date(lecture.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            
            <div style={{ 
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {lecture.summary.split('\n')[0]?.replace('- Lecture Title: ', '') || 'Untitled Lecture'}
            </div>

            <div style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.5
            }}>
              {lecture.transcript}
            </div>

            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🎤 {Math.ceil(lecture.transcript.split(' ').length / 130)} min read</span>
              <span>•</span>
              <span>📝 {lecture.summary.split('\n').length} key points</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .lecture-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
} 