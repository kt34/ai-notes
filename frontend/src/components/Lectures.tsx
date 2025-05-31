import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Lecture {
  id: string;
  created_at: string;
  transcript: string;
  summary: string;
  title: string;
}

export function Lectures() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const response = await fetch('http://localhost:8000/lectures', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch lectures');
        }

        const data = await response.json();
        setLectures(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    };

    fetchLectures();
  }, [token]);

  const calculateReadingTime = (text: string) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const getPreview = (text: string, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const countKeyPoints = (summary: string) => {
    // Count bullet points or numbered items in the summary
    const bulletPoints = (summary.match(/[•\-\*]|\d+\./g) || []).length;
    return bulletPoints || 1; // Return at least 1 if no bullet points found
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
        Loading lectures...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: '#ef4444',
        padding: '2rem'
      }}>
        Error: {error}
      </div>
    );
  }

  if (lectures.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: 'rgba(255, 255, 255, 0.6)',
        padding: '3rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>No lectures yet</h2>
        <p>Start recording to create your first lecture notes!</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ 
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        color: '#fff',
        marginBottom: '2rem'
      }}>
        Your Lectures
      </h1>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {lectures.map((lecture) => (
          <div
            key={lecture.id}
            onClick={() => navigate(`/lectures/${lecture.id}`)}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: '1rem'
            }}>
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem'
              }}>
                {formatDate(lecture.created_at)}
              </span>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(100, 108, 255, 0.1)',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                color: '#646cff'
              }}>
                <span>✨</span>
                {countKeyPoints(lecture.summary)} key points
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                color: '#fff',
                fontSize: '1.25rem',
                marginBottom: '0.5rem',
                fontWeight: '600'
              }}>
                {lecture.title || `Untitled Lecture #${lecture.id.slice(0, 8)}`}
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                {getPreview(lecture.transcript)}
              </p>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.75rem'
            }}>
              {calculateReadingTime(lecture.transcript)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 