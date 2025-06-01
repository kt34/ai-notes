import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export interface RecordingAppProps {}

export function RecordingApp({}: RecordingAppProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [completedTranscriptSegments, setCompletedTranscriptSegments] = useState<string[]>([]);
  const [currentInterimTranscript, setCurrentInterimTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

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
      setProcessingProgress(0);
    }
  }, [isRecording]);

  // Cleanup processing interval when component unmounts or processing ends
  useEffect(() => {
    if (!isProcessing && processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
      setProcessingProgress(0);
    }
    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [isProcessing]);

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
    setProcessingProgress(0);
    
    // Start the processing progress animation
    processingIntervalRef.current = setInterval(() => {
      setProcessingProgress(prev => {
        // Slow down progress as it gets higher
        const increment = Math.max(0.5, (100 - prev) * 0.03);
        const newProgress = Math.min(95, prev + increment);
        return newProgress;
      });
    }, 150);

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
            } else if (message.summary !== undefined) {
                console.log('📋 Received final summary');
                setIsProcessing(false);
                setProcessingProgress(100);
                if (processingIntervalRef.current) {
                    clearInterval(processingIntervalRef.current);
                    processingIntervalRef.current = null;
                }

                // Extract the lecture ID from the response and redirect immediately
                if (message.lecture_id) {
                    navigate(`/lectures/${message.lecture_id}`);
                }

                // Update the document title temporarily
                const title = message.transcript?.split('.')[0]?.trim() || 'Untitled Lecture';
                const displayTitle = title.length > 100 ? title.split(' ').slice(0, 10).join(' ') + '...' : title;
                document.title = `${displayTitle} - notez.ai`;
                setTimeout(() => {
                    document.title = 'notez.ai';
                }, 5000);

            } else if (message.error) {
                console.error('❌ Received error from server:', message.error);
                setIsProcessing(false);
                setProcessingProgress(0);
                if (processingIntervalRef.current) {
                    clearInterval(processingIntervalRef.current);
                    processingIntervalRef.current = null;
                }
                setTranscription(prev => `${prev}\n\n❌ Error: ${message.error}`);
            } else if (message.partial) {
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
        if (isRecordingRef.current) {
            setTranscription(prev => `${prev}\n\n⚠️ Connection closed unexpectedly. Code: ${event.code}`);
            setIsRecording(false);
            cleanup(false);
        } else if (isProcessing) {
             setTranscription(prev => `${prev}\n\n⚠️ Connection closed while processing. Code: ${event.code}`);
             setIsProcessing(false);
        }
    };
  };

  useEffect(() => {
    if (isRecordingRef.current && !isProcessing) {
      const liveDisplay = [...completedTranscriptSegments, currentInterimTranscript].filter(Boolean).join(' ');
      if (liveDisplay || currentInterimTranscript) {
          setTranscription(liveDisplay);
      } else if (isRecordingRef.current && transcription !== '🟢 Connected. Start speaking...' && transcription !== '🎤 Initializing microphone...' && transcription !== '🟡 Connecting to server...') {
          if (transcription === '🟢 Connected. Start speaking...' || transcription === '🎤 Initializing microphone...' || transcription === '🟡 Connecting to server...') {
          } else {
            setTranscription('🎤 Listening...');
          }
      }
    } else if (!isRecordingRef.current && !isProcessing && !summary) {
        const lastKnownText = [...completedTranscriptSegments, currentInterimTranscript].filter(Boolean).join(' ');
        if (lastKnownText && !transcription.includes("⏹️ Recording stopped.")) {
            setTranscription(lastKnownText);
        }
    }
  }, [completedTranscriptSegments, currentInterimTranscript, isProcessing, summary, transcription]);

  return (
    <div style={{ 
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      height: '100%'
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
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
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

        {isProcessing && (
          <div style={{
            width: '300px',
            position: 'relative',
            height: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div className="loading-bar" style={{
              width: '100%',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative'
            }} />
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ 
                display: 'inline-block',
                width: '6px',
                height: '6px',
                backgroundColor: '#5658f5',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }} />
              Processing your lecture...
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isRecordingRef.current ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '30px',
        transition: 'all 0.3s ease'
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

        {!isRecordingRef.current && (
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
        )}
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
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.4; transform: scale(0.8); }
        }
        .loading-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            #5658f5,
            #8c8eff,
            #5658f5,
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
} 