import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

export function AnimatedSection({
  children,
  delay = 0,
  threshold = 0.1,
  rootMargin = '0px' 
}: AnimatedSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('visible');
            }, delay * 1000);
          } else {
            // Optional: remove 'visible' class when not intersecting if you want animations to re-trigger
            // entry.target.classList.remove('visible'); 
          }
        });
      },
      {
        threshold: threshold,
        rootMargin: rootMargin,
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [delay, threshold, rootMargin]);

  return (
    <div
      ref={sectionRef}
      style={{
        opacity: 0,
        transform: 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        willChange: 'opacity, transform',
      }}
      className="animated-section-on-scroll"
    >
      {children}
      <style>{`
        .animated-section-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
} 