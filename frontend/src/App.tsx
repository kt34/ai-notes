import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
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
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsRecording(false);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    try {
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
            // Keep only the last few partials to avoid the text growing too long
            const parts = prev.split(' ');
            const newParts = [...parts.slice(-20), message.partial];
            return newParts.join(' ');
          });
        } else if (message.summary) {
          setTranscription(message.summary);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        stopRecording();
        setTranscription('Error: Connection failed');
      };

      socketRef.current.onclose = () => {
        console.log('WebSocket closed');
        stopRecording();
      };

    } catch (error) {
      console.error('Setup error:', error);
      stopRecording();
      setTranscription('Error: Could not access microphone');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Classroom Notes</h1>
        <button 
          onClick={handleToggleRecording} 
          style={{ 
            padding: '20px', 
            fontSize: '20px', 
            cursor: 'pointer',
            backgroundColor: isRecording ? '#ff4444' : '#44ff44',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          {isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
        </button>
        <div 
          className="transcription-box" 
          style={{ 
            marginTop: '20px', 
            padding: '20px', 
            border: '1px solid #ccc', 
            borderRadius: '10px',
            minHeight: '200px', 
            width: '80%', 
            maxWidth: '800px',
            backgroundColor: 'white', 
            color: 'black',
            whiteSpace: 'pre-wrap',
            textAlign: 'left',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <h2>Transcription:</h2>
          <p style={{ lineHeight: '1.5' }}>{transcription}</p>
        </div>
      </header>
    </div>
  );
}

export default App;
