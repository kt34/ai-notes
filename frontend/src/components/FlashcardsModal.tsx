import { useState } from 'react';

interface Flashcard {
  question: string;
  answer: string;
}

interface FlashcardsModalProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

export function FlashcardsModal({ flashcards, onClose }: FlashcardsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
  };

  const card = flashcards[currentIndex];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '2rem',
        borderRadius: '12px',
        width: '90%',
        maxWidth: '500px',
        textAlign: 'center',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 style={{ color: '#fff', marginTop: 0 }}>Flashcards</h2>
        <div 
          style={{ 
            perspective: '1000px',
            minHeight: '250px',
            cursor: 'pointer',
            marginBottom: '1.5rem'
          }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.6s',
            transform: isFlipped ? 'rotateY(180deg)' : 'none',
            minHeight: '250px',
          }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <p style={{ margin: 0, fontSize: '1.2rem' }}>{card.question}</p>
            </div>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: 'rgba(86, 88, 245, 0.15)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              color: 'rgba(255, 255, 255, 0.9)',
              transform: 'rotateY(180deg)'
            }}>
              <p style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.6' }}>{card.answer}</p>
            </div>
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          <button onClick={handlePrev} style={navButtonStyle}>Prev</button>
          <span>{currentIndex + 1} / {flashcards.length}</span>
          <button onClick={handleNext} style={navButtonStyle}>Next</button>
        </div>
        <button onClick={onClose} style={{...navButtonStyle, marginTop: '1.5rem', width: '100%'}}>Close</button>
      </div>
    </div>
  );
}

const navButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  color: '#fff',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
}; 