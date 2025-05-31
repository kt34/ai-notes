import { useState, useRef, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { RecordPage } from './pages/RecordPage';
import { LecturesPage } from './pages/LecturesPage';
import { LectureDetailPage } from './pages/LectureDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { NavBar } from './components/NavBar';
import './App.css'; // Assuming your App.css provides the necessary base styles

function RecordingApp() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [completedTranscriptSegments, setCompletedTranscriptSegments] = useState<string[]>([]);
  const [currentInterimTranscript, setCurrentInterimTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Ref to hold the latest recording status for the audio processing callback
  const isRecordingRef = useRef(isRecording);

  const { token } = useAuth();
  const backendUrl = `ws://localhost:8000/ws/transcribe?token=${token}`;

  // Update the ref whenever the isRecording state changes
  useEffect(() => {
    console.log('🔄 Recording state changed:', isRecording);
    isRecordingRef.current = isRecording;
    if (isRecording) {
      // Reset transcript states when starting a new recording
      setCompletedTranscriptSegments([]);
      setCurrentInterimTranscript('');
      setTranscription('🟢 Connected. Start speaking...');
    }
  }, [isRecording]);

  const cleanup = (isStoppingRecording = false) => {
    console.log('🧹 Starting cleanup...', isStoppingRecording ? '(stopping recording)' : '(full cleanup)');
    
    if (processorRef.current) {
      try {
        console.log('📝 Disconnecting audio processor...');
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null; 
      } catch (e) { console.error('❌ Error disconnecting processor:', e); }
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        console.log('🔊 Closing audio context...');
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      } catch (e) { console.error('❌ Error closing audio context:', e); }
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      try {
        console.log('🎤 Stopping media stream tracks...');
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) { console.error('❌ Error stopping media stream:', e); }
      mediaStreamRef.current = null;
    }

    if (socketRef.current) {
      console.log('🔌 WebSocket state before cleanup:', socketRef.current.readyState);
      if (!isStoppingRecording || (socketRef.current.readyState !== WebSocket.OPEN && socketRef.current.readyState !== WebSocket.CONNECTING)) {
        try {
          if (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING) {
            console.log('🔌 Closing WebSocket connection (forced)...');
            socketRef.current.close(1000, "Client cleanup forced");
          }
        } catch (e) { console.error('❌ Error closing WebSocket:', e); }
      } else if (isStoppingRecording && socketRef.current.readyState === WebSocket.OPEN) {
        console.log("🔌 WebSocket remains open for final messages...");
      }
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      if (!isStoppingRecording) {
          socketRef.current = null;
      }
    }
    console.log('✅ Cleanup completed');
  };

  useEffect(() => {
    return () => {
      console.log('🔄 Component unmounting...');
      // Explicitly set isRecording to false to ensure its ref is updated
      // This helps prevent race conditions if cleanup is called from unmount
      setIsRecording(false); 
      setIsProcessing(false);
      cleanup(false); 
    };
  }, []); 

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    if (!isRecordingRef.current) {
      console.log('⚠️ Stop recording called but not recording');
      return;
    }

    setIsRecording(false);
    setIsProcessing(true); 
    setTranscription(prev => prev + "\n\n⏹️ Recording stopped. Processing audio for summary...");
    // Final interim might be useful, but summary message will overwrite
    // setCurrentInterimTranscript(prev => prev + "\n\n⏹️ Recording stopped. Processing audio for summary...");

    if (processorRef.current) {
        console.log('📝 Disconnecting audio processor...');
        processorRef.current.disconnect(); 
        processorRef.current.onaudioprocess = null;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("📤 Sending end-of-stream signal...");
      socketRef.current.send(new ArrayBuffer(0));
    }
  };

  const handleToggleRecording = async () => {
    console.log('🔄 Toggle recording called. Current state:', isRecordingRef.current);
    if (isRecordingRef.current) {
      stopRecording();
      return;
    }

    cleanup(false); 
    setIsProcessing(false);
    setSummary('');
    setCompletedTranscriptSegments([]);
    setCurrentInterimTranscript('');
    setTranscription('🟡 Connecting to server...');
    
    try {
      console.log('🔌 Creating WebSocket connection...');
      socketRef.current = new WebSocket(backendUrl);
    } catch (error) {
        console.error('❌ WebSocket creation failed:', error);
        setTranscription(`🔴 Error: Could not establish connection. ${error instanceof Error ? error.message : String(error)}`);
        cleanup(false);
        return;
    }
      
    socketRef.current.onopen = async () => {
      console.log('✅ WebSocket connected, initializing audio...');
      setTranscription('🎤 Initializing microphone...');
      
      try {
        console.log('🎤 Requesting microphone access...');
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true } 
        });

        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            console.log('🔊 Resuming suspended AudioContext...');
            await audioContextRef.current.resume();
        }
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
            console.log("🔊 AudioContext resumed from suspended state");
        }

        console.log('🎛️ Setting up audio processing...');
        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
        const bufferSize = 4096; 
        processorRef.current = audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);
        
        processorRef.current.onaudioprocess = (e) => {
          if (socketRef.current?.readyState === WebSocket.OPEN && isRecordingRef.current) { 
            const inputData = e.inputBuffer.getChannelData(0);
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              let s = Math.max(-1, Math.min(1, inputData[i]));
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; 
            }
            socketRef.current.send(pcmData.buffer);
          }
        };

        source.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination); 
        
        console.log('✅ Audio setup complete, starting recording...');
        setIsRecording(true); 
        // Initial transcription message moved to isRecording useEffect for clarity
        // setTranscription('🟢 Connected. Start speaking...');

      } catch (error) {
        console.error('❌ Audio setup failed:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setTranscription(`🔴 Error: Could not access microphone. ${errorMessage}`);
        setIsRecording(false);
        cleanup(false); 
      }
    };

    socketRef.current.onmessage = (event) => {
        try {
            console.log('📥 Received WebSocket message');
            const message = JSON.parse(event.data as string);
            
            if (message.text !== undefined && message.is_final_utterance_segment !== undefined) {
              console.log('📝 Received transcription segment:', message.text, 'is_final:', message.is_final_utterance_segment);
              if (isRecordingRef.current && !isProcessing) {
                if (message.is_final_utterance_segment) {
                  setCompletedTranscriptSegments(prev => [...prev, message.text]);
                  setCurrentInterimTranscript('');
                } else {
                  setCurrentInterimTranscript(message.text);
                }
              }
            } else if (message.summary) {
                console.log('📋 Received final summary');
                setIsProcessing(false);
                setSummary(message.summary);
                // When final summary arrives, display the full final transcript
                // and clear the live-building parts
                setTranscription(message.transcript || completedTranscriptSegments.join(' ') + (currentInterimTranscript ? ' ' + currentInterimTranscript : ''));
                setCompletedTranscriptSegments([]); // Clear for next potential recording session (though usually handled by start)
                setCurrentInterimTranscript('');   // Clear for next potential recording session
            } else if (message.error) {
                console.error('❌ Received error from server:', message.error);
                setIsProcessing(false);
                setTranscription(prev => `${prev}\n\n❌ Error: ${message.error}`);
            } else if (message.partial) { // Fallback for old message format, though should not happen with new backend
              console.warn('Received old "partial" message format. Updating current interim.');
              setCurrentInterimTranscript(message.partial);
            }
        } catch (error) {
            console.error('❌ Error processing WebSocket message:', error);
            setTranscription(prev => `${prev}\n\n❌ Error processing server message: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    socketRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setTranscription(prev => `${prev}\n\n❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        cleanup(false);
    };

    socketRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        if (isRecordingRef.current) { // If it closes while we thought we were recording
            setTranscription(prev => `${prev}\n\n⚠️ Connection closed unexpectedly. Code: ${event.code}`);
            setIsRecording(false); // Update state to reflect closure
            // No setIsProcessing(true) here, as the process was interrupted
            cleanup(false); // Perform full cleanup
        } else if (isProcessing) { // If it closes while we were expecting summary
             setTranscription(prev => `${prev}\n\n⚠️ Connection closed while processing. Code: ${event.code}`);
             setIsProcessing(false);
             // No cleanup here if stopRecording already initiated it partially for the socket.
        }
    };
  };

  // Effect to update the main transcription display from segments
  useEffect(() => {
    if (isRecordingRef.current && !isProcessing) { // Only update live if actively recording and not processing final
      const liveDisplay = [...completedTranscriptSegments, currentInterimTranscript].filter(Boolean).join(' ');
      // Ensure initial messages are not prepended once actual transcription starts
      if (liveDisplay || currentInterimTranscript) { // If there's any text from STT
          setTranscription(liveDisplay);
      } else if (isRecordingRef.current && transcription !== '🟢 Connected. Start speaking...' && transcription !== '🎤 Initializing microphone...' && transcription !== '🟡 Connecting to server...') {
          // If recording just started and no text yet, but an old message is there, clear it to 'Listening...'
          // Or, if it's one of the initial messages, let it be.
          if (transcription === '🟢 Connected. Start speaking...' || transcription === '🎤 Initializing microphone...' || transcription === '🟡 Connecting to server...') {
            // Keep these initial messages until first text arrives
          } else {
            setTranscription('🎤 Listening...');
          }
      }
    } else if (!isRecordingRef.current && !isProcessing && !summary) { // Not recording, not processing, no summary yet
        // If there's any lingering text after stopping but before summary, show it
        const lastKnownText = [...completedTranscriptSegments, currentInterimTranscript].filter(Boolean).join(' ');
        if (lastKnownText && !transcription.includes("⏹️ Recording stopped.")) { // Don't overwrite "stopped" message
            setTranscription(lastKnownText);
        }
    }
  }, [completedTranscriptSegments, currentInterimTranscript, isProcessing, summary, transcription]); // Added transcription to dependencies for the initial message check


  // UI Rendering (same as before)
  return (
    <div className="main-content">
      <div style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 2.8rem)', 
            color: '#fff',
            marginBottom: '10px', 
            fontWeight: 'bold'
          }}>notez.ai</h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', 
            color: 'rgba(255, 255, 255, 0.6)', 
            maxWidth: '600px', 
            margin: '0 auto 20px' 
          }}>
            Smart lecture notes powered by AI
          </p>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '30px' 
        }}>
          <button 
            onClick={handleToggleRecording} 
            disabled={isProcessing && !isRecordingRef.current}
            className="record-button"
            style={{ 
              padding: '15px 30px',
              fontSize: '1.2rem',
              cursor: (isProcessing && !isRecordingRef.current) ? 'not-allowed' : 'pointer',
              backgroundColor: (isProcessing && !isRecordingRef.current) ? 'rgba(255, 255, 255, 0.1)' : (isRecordingRef.current ? '#ef4444' : '#646cff'),
              border: 'none',
              borderRadius: '50px',
              color: '#fff',
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              opacity: (isProcessing && !isRecordingRef.current) ? 0.7 : 1,
              transform: (isProcessing && !isRecordingRef.current) ? 'none' : 'translateY(0)'
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>
              {(isProcessing && !isRecordingRef.current) ? '⏳' : (isRecordingRef.current ? '🛑' : '🎤')}
            </span>
            {(isProcessing && !isRecordingRef.current) ? 'Processing...' : (isRecordingRef.current ? 'Stop Recording' : 'Start Recording')}
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '30px' 
        }}>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{ 
              color: '#fff',
              fontSize: '1.5rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>📝</span> Live Transcription
              {isRecordingRef.current && (
                <span style={{ 
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#646cff',
                  borderRadius: '50%',
                  marginLeft: 'auto',
                  animation: 'pulseAnimation 1.5s infinite ease-in-out'
                }}></span>
              )}
            </h2>
            <div style={{ 
              flex: 1,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              padding: '20px',
              fontSize: '1rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {transcription || (isProcessing && !isRecordingRef.current ? '⏳ Waiting for final transcript and summary...' : 'Start recording to see live transcription...')}
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '25px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{ 
              color: '#fff',
              fontSize: '1.5rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>✨</span> AI Summary
            </h2>
            <div style={{ 
              flex: 1,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              padding: '20px',
              fontSize: '1rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word'
            }}>
              {summary || (isProcessing && !isRecordingRef.current ? '⏳ Generating summary...' : 'Your lecture summary will appear here after recording...')}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .record-button:not(:disabled):hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4) !important;
        }
        @keyframes pulseAnimation {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(100, 108, 255, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(100, 108, 255, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(100, 108, 255, 0); }
        }
      `}</style>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '1.2rem'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <NavBar />
      <div className="main-content">
        {children}
      </div>
    </>
  );
}

function AuthPages() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-logo">
        <h1>notez.ai</h1>
        <p>Smart lecture notes powered by AI</p>
      </div>
      {location.pathname === '/register' ? <RegisterForm /> : <LoginForm />}
      <button 
        onClick={() => {
          if (location.pathname === '/register') {
            navigate('/login');
          } else {
            navigate('/register');
          }
        }}
        className="toggle-auth-btn"
      >
        {location.pathname === '/register' ? 'Already have an account? Login' : 'Need an account? Register'}
      </button>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthPages />} />
        <Route path="/register" element={<AuthPages />} />
        <Route path="/" element={
          <ProtectedRoute>
            <RecordPage />
          </ProtectedRoute>
        } />
        <Route path="/lectures" element={
          <ProtectedRoute>
            <LecturesPage />
          </ProtectedRoute>
        } />
        <Route path="/lectures/:id" element={
          <ProtectedRoute>
            <LectureDetailPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;