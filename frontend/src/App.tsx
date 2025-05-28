import { useState, useRef, useEffect } from 'react';
import './App.css'; // Assuming your App.css provides the necessary base styles

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Ref to hold the latest recording status for the audio processing callback
  const isRecordingRef = useRef(isRecording);

  const userId = '06eb0cea-6b1e-4737-a17d-ab4fe9b382c2';
  const backendUrl = `ws://localhost:8000/ws/transcribe?user_id=${userId}`;

  // Update the ref whenever the isRecording state changes
  useEffect(() => {
    console.log('🔄 Recording state changed:', isRecording);
    isRecordingRef.current = isRecording;
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
        setTranscription('🟢 Connected. Start speaking...');

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
            
            if (message.partial) {
              console.log('📝 Received partial transcription');
              if (isRecordingRef.current && !isProcessing) { 
                setTranscription(prev => {
                    const cleanedPrev = (
                        prev === '🟢 Connected. Start speaking...' || 
                        prev.startsWith('🎤 Initializing microphone...') || 
                        prev.startsWith('🟡 Connecting to server...') ||
                        prev.includes("⏹️ Recording stopped.") 
                        ) ? '' : prev.split("\n\n⏹️ Recording stopped.")[0];
        
                      const prevWords = cleanedPrev.trim().split(/\s+/).filter(Boolean);
                      const newPartialWords = message.partial.trim().split(/\s+/).filter(Boolean);
                      
                      const MAX_LIVE_WORDS = 40; 
                      const combinedWords = [...prevWords, ...newPartialWords].slice(-MAX_LIVE_WORDS);
                      return combinedWords.join(' ');
                });
              }
            } else if (message.summary) {
                console.log('📋 Received final summary');
                setIsProcessing(false);
                setSummary(message.summary);
                setTranscription(message.transcript || transcription);
            } else if (message.error) {
                console.error('❌ Received error from server:', message.error);
                setIsProcessing(false);
                setTranscription(prev => `${prev}\n\n❌ Error: ${message.error}`);
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
        if (isRecordingRef.current) {
            setTranscription(prev => `${prev}\n\n⚠️ Connection closed unexpectedly. Code: ${event.code}`);
            setIsRecording(false);
            cleanup(false);
        }
    };
  };

  // UI Rendering (same as before)
  return (
    <div className="App" style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
      }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', color: '#2c3e50', marginBottom: '20px', fontWeight: 'bold' }}>AI Classroom Notes</h1>
          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', color: '#34495e', maxWidth: '600px', margin: '0 auto 30px' }}>
            Record your lectures and get real-time transcription with AI-powered summaries.
          </p>
        </header>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
          <button 
            onClick={handleToggleRecording} 
            disabled={isProcessing && !isRecordingRef.current} // Use ref for disabled state if processing summary
            style={{ 
              padding: '15px 30px',
              fontSize: '1.2rem',
              cursor: (isProcessing && !isRecordingRef.current) ? 'not-allowed' : 'pointer',
              backgroundColor: (isProcessing && !isRecordingRef.current) ? '#bdc3c7' : (isRecordingRef.current ? '#e74c3c' : '#2ecc71'),
              border: 'none',
              borderRadius: '50px',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              opacity: (isProcessing && !isRecordingRef.current) ? 0.7 : 1
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>
              {(isProcessing && !isRecordingRef.current) ? '⏳' : (isRecordingRef.current ? '🛑' : '🎤')}
            </span>
            {(isProcessing && !isRecordingRef.current) ? 'Processing...' : (isRecordingRef.current ? 'Stop Recording' : 'Start Recording')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>📝</span> Live Transcription
              {isRecordingRef.current && ( // Use ref for UI indicator
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: '#2ecc71', borderRadius: '50%', marginLeft: 'auto', animation: 'pulseAnimation 1.5s infinite ease-in-out' }}></span>
              )}
            </h2>
            <div style={{ flex: 1, backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', fontSize: '1rem', lineHeight: '1.6', color: '#34495e', overflowY: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {transcription || (isProcessing && !isRecordingRef.current ? '⏳ Waiting for final transcript and summary...' : 'Start recording to see live transcription...')}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '15px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ color: '#2c3e50', fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>✨</span> AI Summary
            </h2>
            <div style={{ flex: 1, backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '20px', fontSize: '1rem', lineHeight: '1.6', color: '#34495e', overflowY: 'auto', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {summary || (isProcessing && !isRecordingRef.current ? '⏳ Generating summary...' : 'Your lecture summary will appear here after recording...')}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulseAnimation {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(46, 204, 113, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }
      `}</style>
      </div>
  );
}

export default App;