import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const wavHeaderRef = useRef<ArrayBuffer | null>(null);

  const userId = 'test_user';
  const backendUrl = `ws://localhost:8000/ws/transcribe?user_id=${userId}`;

  // Function to create WAV header
  const createWavHeader = (length: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(44);
    const view = new DataView(buffer);
    
    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // File length
    view.setUint32(4, length + 36, true);
    // WAVE identifier
    writeString(view, 8, 'WAVE');
    // Format chunk identifier
    writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (raw)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, 1, true);
    // Sample rate
    view.setUint32(24, 16000, true);
    // Byte rate
    view.setUint32(28, 16000 * 2, true);
    // Block align
    view.setUint16(32, 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, length, true);

    return buffer;
  };

  // Helper function to write strings to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const stopRecording = () => {
    setIsProcessing(true); // Indicate we're waiting for summary
    
    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Don't close WebSocket here - wait for summary
    setIsRecording(false);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
      setIsProcessing(false);
      setSummary('');
      
      // Setup WebSocket first
      socketRef.current = new WebSocket(backendUrl);
      
      socketRef.current.onopen = async () => {
        console.log('WebSocket connected, starting audio capture...');
        
        // Get audio stream
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true
          } 
        });

        // Setup audio processing
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
        
        // Create processor to handle raw audio data
        processorRef.current = audioContextRef.current.createScriptProcessor(1024, 1, 1);
        
        processorRef.current.onaudioprocess = (e) => {
          if (socketRef.current?.readyState === WebSocket.OPEN) {
            // Get raw audio data
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Convert to 16-bit PCM
            const pcmData = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
            }

            // Create WAV chunk
            const wavHeader = createWavHeader(pcmData.byteLength);
            const wavData = new Uint8Array(wavHeader.byteLength + pcmData.byteLength);
            wavData.set(new Uint8Array(wavHeader), 0);
            wavData.set(new Uint8Array(pcmData.buffer), wavHeader.byteLength);
            
            // Send as binary WAV data
            socketRef.current.send(wavData.buffer);
          }
        };

        // Connect the nodes
        source.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
        
        setIsRecording(true);
        setTranscription('Connected. Start speaking...');
      };

      socketRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.partial) {
          setTranscription(prev => {
            const parts = prev.split(' ');
            const newParts = [...parts.slice(-20), message.partial];
            return newParts.join(' ');
          });
        } else if (message.summary) {
          setSummary(message.summary);
          if (message.transcript) {
            setTranscription(message.transcript);
          }
          setIsProcessing(false);
          // Now we can safely close the WebSocket
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
          }
        } else if (message.error) {
          setSummary(`Error: ${message.error}`);
          setTranscription('An error occurred during processing. Please try again.');
          setIsProcessing(false);
          if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
          }
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsProcessing(false);
        stopRecording();
        setTranscription('Error: Connection failed');
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket closed');
        setIsProcessing(false);
      };

    } catch (error) {
      console.error('Setup error:', error);
      setIsProcessing(false);
      stopRecording();
      setTranscription('Error: Could not access microphone');
    }
  };

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
        <header style={{
          textAlign: 'center',
          marginBottom: '40px'
        }}>
          <h1 style={{
            fontSize: '2.5rem',
            color: '#2c3e50',
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>AI Classroom Notes</h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#34495e',
            maxWidth: '600px',
            margin: '0 auto 30px'
          }}>
            Record your lectures and get real-time transcription with AI-powered summaries
          </p>
        </header>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '30px'
        }}>
          <button 
            onClick={handleToggleRecording} 
            disabled={isProcessing}
            style={{ 
              padding: '15px 30px',
              fontSize: '1.2rem',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              backgroundColor: isProcessing ? '#cccccc' : (isRecording ? '#ff6b6b' : '#4cd964'),
              border: 'none',
              borderRadius: '50px',
              color: 'white',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            <span style={{ fontSize: '1.4rem' }}>
              {isProcessing ? '⏳' : (isRecording ? '🛑' : '🎤')}
            </span>
            {isProcessing ? 'Processing...' : (isRecording ? 'Stop Recording' : 'Start Recording')}
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          margin: '0 auto',
          maxWidth: '1200px'
        }}>
          {/* Live Transcription Box */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{
              color: '#2c3e50',
              fontSize: '1.5rem',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span>📝</span> Live Transcription
              {isRecording && (
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  backgroundColor: '#4cd964',
                  borderRadius: '50%',
                  marginLeft: 'auto'
                }}></span>
              )}
            </h2>
            <div style={{
              flex: 1,
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              padding: '20px',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: '#34495e',
              overflowY: 'auto'
            }}>
              {transcription || 'Start recording to see live transcription...'}
            </div>
          </div>

          {/* Summary Box */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '15px',
            padding: '25px',
            boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h2 style={{
              color: '#2c3e50',
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
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              padding: '20px',
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: '#34495e',
              overflowY: 'auto'
            }}>
              {summary || 'Your lecture summary will appear here after recording...'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
