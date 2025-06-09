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
  const [isClosing, setIsClosing] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length);
    }, 200);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const card = flashcards[currentIndex];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      opacity: isClosing ? 0 : 1,
      transition: 'opacity 0.3s ease',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        height: '100%',
        maxHeight: '600px',
        margin: '2rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <h2 style={{ 
              color: '#fff',
              margin: 0,
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🃏</span> Flashcards
            </h2>
            <span style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.9rem',
            }}>
              {currentIndex + 1} of {flashcards.length}
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'}
          >
            ×
          </button>
        </div>

        {/* Card Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          perspective: '2000px',
        }}>
          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '-3rem',
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '3rem',
              cursor: 'pointer',
              padding: '1rem',
              transition: 'all 0.2s ease',
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'translateX(-5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            ‹
          </button>

          {/* Card */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isFlipped ? 'rotateY(180deg)' : 'none',
              cursor: 'pointer',
            }}
          >
            {/* Question Side */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
            }}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Question
              </div>
              <p style={{
                margin: 0,
                fontSize: '1.4rem',
                color: '#fff',
                lineHeight: 1.6,
                maxWidth: '600px',
              }}>
                {card.question}
              </p>
              <div style={{
                position: 'absolute',
                bottom: '1.5rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                Click to flip <span style={{ fontSize: '1.2rem' }}>↻</span>
              </div>
            </div>

            {/* Answer Side */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              background: 'rgba(86, 88, 245, 0.1)',
              borderRadius: '16px',
              border: '1px solid rgba(86, 88, 245, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              transform: 'rotateY(180deg)',
              textAlign: 'center',
            }}>
              <div style={{
                color: 'rgba(255, 255, 255, 0.4)',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Answer
              </div>
              <p style={{
                margin: 0,
                fontSize: '1.3rem',
                color: '#fff',
                lineHeight: 1.6,
                maxWidth: '600px',
              }}>
                {card.answer}
              </p>
              <div style={{
                position: 'absolute',
                bottom: '1.5rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                Click to flip <span style={{ fontSize: '1.2rem' }}>↻</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '-3rem',
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: '3rem',
              cursor: 'pointer',
              padding: '1rem',
              transition: 'all 0.2s ease',
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.transform = 'translateX(5px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            ›
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{
          marginTop: '2rem',
          width: '100%',
          height: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${((currentIndex + 1) / flashcards.length) * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #5658f5, #8c8eff)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    </div>
  );
} 