import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface RecordingContextType {
  isRecordingActive: boolean;
  setRecordingActive: (active: boolean) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [isRecordingActive, setRecordingActive] = useState(false);

  // Warn on tab close/refresh while recording
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isRecordingActive) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isRecordingActive]);

  return (
    <RecordingContext.Provider value={{ isRecordingActive, setRecordingActive }}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error('useRecording must be used within a RecordingProvider');
  return ctx;
}


