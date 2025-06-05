import { useEffect, useState, type RefObject } from 'react';

interface IntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

// Allow T to be potentially null initially, matching useRef(null)
function useIntersectionObserver<T extends Element | null>(
  elementRef: RefObject<T>,
  {
    threshold = 0.1,
    root = null,
    rootMargin = '0%',
    triggerOnce = true,
  }: IntersectionObserverOptions = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    // The check below correctly handles if element is null
    if (!element) {
      return;
    }

    // At this point, TypeScript knows `element` is not null and is of type T (which extends Element)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          if (triggerOnce) {
            observer.unobserve(element as Element); // Assert as Element if T could be null type-wise
          }
        } else if (!triggerOnce) {
          // If triggerOnce is false, set back to false when it leaves the screen
          // For most fade-in-on-scroll effects, triggerOnce is true
          setIsIntersecting(false);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element as Element); // Assert as Element

    return () => {
      observer.unobserve(element as Element); // Assert as Element
    };
  }, [elementRef, threshold, root, rootMargin, triggerOnce]);

  return isIntersecting;
}

export default useIntersectionObserver; 