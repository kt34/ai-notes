import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { useUsage } from '../hooks/useUsage';

export interface RecordingAppProps {}

export function RecordingApp({}: RecordingAppProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcription, setTranscription] = useState('');
  const [completedTranscriptSegments, setCompletedTranscriptSegments] = useState<string[]>([]);
  const [currentInterimTranscript, setCurrentInterimTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { usageData, isLoading: isLoadingUsage } = useUsage();
  
  const isRecordingDisabled = !isLoadingUsage && usageData?.remaining_recordings === 0;

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptionContainerRef = useRef<HTMLDivElement | null>(null);

  // Ref to hold the latest recording status for the audio processing callback
  const isRecordingRef = useRef(isRecording);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { token } = useAuth();
  const backendUrl = `${config.apiUrl.replace('http', 'ws')}/ws/transcribe?token=${token}`;

  // Update the ref whenever the isRecording state changes
  useEffect(() => {
    console.log('🔄 Recording state changed:', isRecording);
    isRecordingRef.current = isRecording;
    if (isRecording) {
      // Start duration timer
      setDuration(0);
      durationIntervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop at 2 hours 5 minutes (7500 seconds)
          if (newDuration >= 7500) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

      // Reset transcript states when starting a new recording
      setCompletedTranscriptSegments([]);
      setCurrentInterimTranscript('');
      setTranscription('🟢 Connected. Start speaking...');
      setProcessingProgress(0);
    } else {
      // Clear duration timer when not recording
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
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

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const stopRecording = () => {
    console.log('🛑 Stopping recording...');
    if (!isRecordingRef.current) {
      console.log('⚠️ Stop recording called but not recording');
      return;
    }

    setIsRecording(false);
    setIsProcessing(true); 
    setProcessingStatus('Finalizing recording...'); // Initial status when stopping
    setProcessingProgress(5); // Small initial progress
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }

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
    if (isRecordingDisabled) return; // Prevent action if disabled
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
            const message = JSON.parse(event.data as string);
            console.log('📥 WebSocket Message Received:', message);

            // If lecture_id is present, this is the final processing/summary message.
            // Prioritize this for navigation.
            if (message.lecture_id !== undefined && message.summary !== undefined) {
                console.log('📋✅ Final Summary & Lecture ID received. Preparing to navigate.', message.lecture_id);

                if (message.transcript === "No speech detected in audio") {
                    setTranscription("❌ No speech was detected. Please try again.");
                    cleanup(false);
                    setIsProcessing(false);
                    return;
                }

                const lectureId = message.lecture_id;
                const finalTranscript = message.transcript;

                document.title = `${finalTranscript?.split('.')[0]?.trim() || 'Untitled Lecture'} - notez.ai`;
                
                setProcessingStatus('Complete!');
                setProcessingProgress(100);
                
                // Perform cleanup and set processing to false *before* navigating.
                cleanup(false);
                setIsProcessing(false);

                console.log('🚀 Attempting navigation to lecture page:', lectureId);
                navigate(`/lectures/${lectureId}`);
                return; // Critical: Stop further processing after navigation is initiated.
            }

            // Handle intermediate processing status updates if no lecture_id yet.
            if (message.processing_status !== undefined && message.progress !== undefined) {
                console.log('📊 Intermediate Processing Status:', message.processing_status, message.progress);
                setProcessingStatus(message.processing_status);
                setProcessingProgress(message.progress);
            }

            // Handle live transcription text if no lecture_id yet.
            if (message.text !== undefined && message.is_final_utterance_segment !== undefined) {
                if (isRecordingRef.current && !isProcessing) {
                    if (message.is_final_utterance_segment) {
                        setCompletedTranscriptSegments(prev => [...prev, message.text]);
                        setCurrentInterimTranscript('');
                    } else {
                        setCurrentInterimTranscript(message.text);
                    }
                }
            }

            // Handle errors sent from the backend.
            if (message.error) {
                console.error('❌ Server Error Message:', message.error);
                setTranscription(prev => `${prev}\n\n❌ Error: ${message.error}`);
                cleanup(false);
                setIsProcessing(false);
                setProcessingProgress(0);
            }

        } catch (error) {
            console.error('❌ Error processing WebSocket message:', error);
            setTranscription(prev => `${prev}\n\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
            cleanup(false);
            setIsProcessing(false);
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

  // Effect to update the main transcription display from segments and handle auto-scrolling
  useEffect(() => {
    if (isRecordingRef.current && !isProcessing) {
      const liveDisplay = [...completedTranscriptSegments, currentInterimTranscript].filter(Boolean).join(' ');
      if (liveDisplay || currentInterimTranscript) {
          setTranscription(liveDisplay);
          // Ensure scroll happens after DOM update - REMOVING AUTO-SCROLL LOGIC
          // requestAnimationFrame(() => {
          //   if (transcriptionContainerRef.current) {
          //     const container = transcriptionContainerRef.current;
          //     const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
          //     if (isAtBottom) {
          //       container.scrollTop = container.scrollHeight;
          //     }
          //   }
          // });
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
            // Ensure scroll happens after DOM update - REMOVING AUTO-SCROLL LOGIC
            // requestAnimationFrame(() => {
            //   if (transcriptionContainerRef.current) {
            //     transcriptionContainerRef.current.scrollTop = transcriptionContainerRef.current.scrollHeight;
            //   }
            // });
        }
    }
  }, [completedTranscriptSegments, currentInterimTranscript, isProcessing, summary, transcription]);

  return (
    <div style={{ 
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      height: '100%',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      paddingBottom: '20px',
      position: 'relative'
    }}>

      <div style={{
        textAlign: 'center',
        marginBottom: '25px',
        padding: '0rem 1.5rem'
      }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <h1 style={{ 
            textAlign: 'center',
            margin: 0,
            padding: '0.5rem 0',
          fontSize: 'clamp(2rem, 4vw, 2.5rem)',
          color: '#fff',
          fontWeight: '700'
          }}>
            Record Live
          </h1>
          <span style={{
            position: 'absolute',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '0.25rem 0.5rem',
            fontSize: '0.8rem',
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            minHeight: '27px',
            minWidth: '95px',
          }}>
            {isLoadingUsage ? (
              <div className="loading-spinner-small" />
            ) : (
              <>
                <span>🎤</span>
                {usageData?.remaining_recordings === -1 ? (
                  <>
                    <span style={{ fontSize: '1.1rem', position: 'relative', top: '-1.5px' }}>∞</span>
                    <span>Recordings</span>
                  </>
                ) : (
                  <span>{`${usageData?.remaining_recordings ?? 'N/A'} remaining`}</span>
                )}
              </>
            )}
          </span>
        </div>
        <p style={{ 
          fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', 
          color: 'rgba(255, 255, 255, 0.6)', 
          maxWidth: '600px', 
          margin: '0 auto'
        }}>
          Record your lecture and let AI transform it into structured notes
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
          disabled={isProcessing && !isRecordingRef.current || isRecordingDisabled}
          className={`record-button ${isRecordingDisabled ? 'tooltip-container' : ''}`}
          style={{ 
            padding: '15px 30px',
            fontSize: '1.2rem',
            cursor: isRecordingDisabled ? 'not-allowed' : ((isProcessing && !isRecordingRef.current) ? 'not-allowed' : 'pointer'),
            backgroundColor: isRecordingDisabled ? 'rgba(255, 255, 255, 0.1)' : ((isProcessing && !isRecordingRef.current) ? 'rgba(255, 255, 255, 0.1)' : (isRecordingRef.current ? '#ef4444' : '#646cff')),
            border: 'none',
            borderRadius: '50px',
            color: '#fff',
            fontWeight: 'bold',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: isRecordingDisabled ? 0.5 : ((isProcessing && !isRecordingRef.current) ? 0.7 : 1),
            transform: (isProcessing && !isRecordingRef.current) ? 'none' : 'translateY(0)'
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>
            {(isProcessing && !isRecordingRef.current) ? '⏳' : (isRecordingRef.current ? '🛑' : '🎤')}
          </span>
          {(isProcessing && !isRecordingRef.current) ? 'Processing...' : (isRecordingRef.current ? `Stop Recording (${formatDuration(duration)})` : 'Start Recording')}
          {isRecordingDisabled && (
            <span className="tooltip">Please upgrade your plan to record more lectures</span>
          )}
        </button>
        
        {isRecording && !isRecordingDisabled && (
          <p style={{
            fontSize: '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: '0.5rem 0 0 0'
          }}>
            Note: Recording will automatically stop after 2 hours and 5 minutes.
          </p>
        )}

        {isProcessing && (
          <div style={{
            width: '100%',
            maxWidth: '600px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div className="loading-bar" style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div
                className="loading-bar-fill"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${processingProgress}%`,
                  background: 'linear-gradient(90deg, #5658f5, #8c8eff)',
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
            <div style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              <span style={{ 
                display: 'inline-block',
                width: '8px',
                height: '8px',
                backgroundColor: '#5658f5',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }} />
              {processingStatus || 'Processing your lecture...'}
            </div>
          </div>
        )}
      </div>

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: (!isRecording && !isProcessing) ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
        gap: '20px',
        flex: 1
      }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          height: 'calc(100vh - 300px)',
          maxHeight: '400px',
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
          <div 
            ref={transcriptionContainerRef}
            style={{ 
              flex: 1,
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '10px',
              padding: 'clamp(15px, 2vh, 20px)',
              fontSize: 'clamp(0.9rem, 1.2vw, 1rem)',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              scrollBehavior: 'smooth',
              width: '100%'
            }}
          >
            {transcription || (isProcessing && !isRecordingRef.current ? '⏳ Waiting for final transcript and summary...' : 'Start recording to see live transcription...')}
          </div>
        </div>

        {(!isRecording && !isProcessing) && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: 'calc(100vh - 300px)',
            maxHeight: '400px',
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
              Your lecture summary will be generated after your recording...
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
        @keyframes pulse {
          0% { opacity: 0.4; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.4; transform: scale(0.8); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* Shimmer effect applied to the filled part of the bar */
        .loading-bar-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%; /* 100% of .loading-bar-fill's width */
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.15),
            rgba(255, 255, 255, 0.3),
            rgba(255, 255, 255, 0.15),
            transparent
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
          /* The border-radius will be clipped by the parent .loading-bar's overflow:hidden */
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loading-spinner-small {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .tooltip-container {
          position: relative;
        }
        .tooltip {
          visibility: hidden;
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
          text-align: center;
          border-radius: 6px;
          padding: 8px 12px;
          position: absolute;
          z-index: 1000;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          font-size: 0.8rem;
          font-weight: normal;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
          border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
        }
        .tooltip-container:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
} 