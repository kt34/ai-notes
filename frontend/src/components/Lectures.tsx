import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

interface Lecture {
  id: string;
  user_id: string;
  transcript: string;
  summary: string;
  lecture_title: string;
  topic_summary_sentence: string;
  key_concepts: string[];
  main_points_covered: string[];
  examples_mentioned: string[];
  important_quotes: string[];
  conclusion_takeaways: string[];
  references: string[];
  created_at: string;
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
        const data = await apiRequest('/lectures', {
          token
        });
        setLectures(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
                {lecture.key_concepts.length} key concepts
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                color: '#fff',
                fontSize: '1.25rem',
                marginBottom: '0.5rem',
                fontWeight: '600',
                background: 'linear-gradient(120deg, #5658f5, #8c8eff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {lecture.lecture_title}
              </h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                marginBottom: '1rem'
              }}>
                {lecture.topic_summary_sentence}
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                {lecture.key_concepts.slice(0, 3).map((concept, index) => (
                  <span
                    key={index}
                    style={{
                      background: 'rgba(86, 88, 245, 0.1)',
                      border: '1px solid rgba(86, 88, 245, 0.2)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.75rem'
                    }}
                  >
                    {concept}
                  </span>
                ))}
                {lecture.key_concepts.length > 3 && (
                  <span style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.75rem',
                    padding: '0.25rem 0'
                  }}>
                    +{lecture.key_concepts.length - 3} more
                  </span>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '0.75rem',
              marginTop: 'auto'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>📝 {lecture.main_points_covered.length} points</span>
                <span>•</span>
                <span>💬 {lecture.important_quotes.length} quotes</span>
              </div>
              <span>{calculateReadingTime(lecture.transcript)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 