import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

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

// Icon Components for a cleaner look
const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M3 6h18"></path>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// Confirmation Dialog Component
function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void;
  title: string;
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'rgba(30, 30, 30, 0.95)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '400px',
        width: '90%',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      }}>
        <h3 style={{
          color: '#fff',
          marginTop: 0,
          marginBottom: '1.5rem',
          fontSize: '1.2rem',
          textAlign: 'center'
        }}>
          {title}
        </h3>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function Lectures() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const data = await apiRequest('/lectures', {
          token
        });
        setLectures(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLectures();
  }, [token]);

  const handleDelete = async (lectureId: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      const response = await apiRequest(`/lectures/${lectureId}`, {
        method: 'DELETE',
        token
      });
      
      if (response.success) {
        setLectures(lectures.filter(lecture => lecture.id !== lectureId));
        setIsDeleteDialogOpen(false);
        setLectureToDelete(null);
      } else {
        throw new Error('Failed to delete lecture');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete lecture');
    } finally {
      setIsDeleting(false);
    }
  };

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
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          color: '#fff',
          margin: 0
        }}>
          Your Lectures
        </h1>
        <button
          onClick={() => {
            setIsEditMode(!isEditMode);
            setError(null);
          }}
          style={{
            background: isEditMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            border: `1px solid ${isEditMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '8px',
            padding: '0.5rem 1rem',
            color: isEditMode ? '#fff' : 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            transition: 'all 0.2s ease',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            if (!isEditMode) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.color = '#fff';
            }
          }}
          onMouseLeave={(e) => {
            if (!isEditMode) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }
          }}
        >
          <PencilIcon />
          {isEditMode ? 'Done' : 'Edit Lectures'}
        </button>
      </div>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem'
      }}>
        {lectures.map((lecture) => (
          <div
            key={lecture.id}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '1.5rem',
              cursor: isEditMode ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              position: 'relative',
              overflow: 'hidden' 
            }}
            onClick={() => !isEditMode && navigate(`/lectures/${lecture.id}`)}
            onMouseEnter={(e) => {
              if (!isEditMode) {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isEditMode) {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
              }
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem',
              minHeight: '34px'
            }}>
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem'
              }}>
                {formatDate(lecture.created_at)}
              </span>
              {isEditMode ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLectureToDelete(lecture.id);
                    setIsDeleteDialogOpen(true);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    borderRadius: '8px',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  <TrashIcon />
                  <span>Delete</span>
                </button>
              ) : (
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
                  {lecture.key_concepts?.length || 0} key concepts
                </div>
              )}
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
                margin: '0.5rem 0 1.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                lineHeight: '1.5',
                maxHeight: '4.5rem', /* 3 lines */
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}>
                {lecture.topic_summary_sentence || 'No summary available.'}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '56px', overflow: 'hidden' }}>
                {(lecture.key_concepts || []).slice(0, 5).map(concept => (
                  <span key={concept} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.7)',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                  }}>
                    {concept}
                  </span>
                ))}
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
                <span>📝 {lecture.main_points_covered?.length || 0} points</span>
                <span>•</span>
                <span>📑 {lecture.section_summaries?.length || 0} sections</span>
              </div>
              <span>{calculateReadingTime(lecture.transcript || '')}</span>
            </div>
          </div>
        ))}
      </div>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setLectureToDelete(null);
          setError(null);
        }}
        onConfirm={() => lectureToDelete && handleDelete(lectureToDelete)}
        title={
          isDeleting 
            ? "Deleting lecture..."
            : "Are you sure you want to permanently delete this lecture? This action cannot be undone."
        }
      />
    </div>
  );
} 