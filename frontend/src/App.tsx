import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]); // Stores all chunks for potential non-streaming use
  const socketRef = useRef<WebSocket | null>(null);

  // Using a hardcoded user_id for now, as seen in the backend snippet
  const userId = 'test_user'; 
  const backendUrl = `ws://localhost:8000/ws/transcribe?user_id=${userId}`;

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop(); // This will trigger onstop, which then closes WebSocket
      }
      // WebSocket closure is handled in mediaRecorder.onstop to send any final data
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Use a specific MIME type if your backend expects it, e.g., audio/webm or audio/ogg
        // iOS Safari has better support for audio/mp4, while others for audio/webm
        const options = { mimeType: 'audio/webm;codecs=opus' }; 
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.warn(`${options.mimeType} is not supported. Falling back to default.`);
            mediaRecorderRef.current = new MediaRecorder(stream);
        } else {
            mediaRecorderRef.current = new MediaRecorder(stream, options);
        }
        
        audioChunksRef.current = []; // Clear previous audio chunks

        socketRef.current = new WebSocket(backendUrl);

        socketRef.current.onopen = () => {
          console.log('WebSocket connection established');
          setTranscription('Connected. Start speaking...');
          setIsRecording(true); // Set recording state after connection is open
          mediaRecorderRef.current?.start(1000); // Start media recorder, collect 1-second chunks
        };

        socketRef.current.onmessage = (event) => {
          const message = JSON.parse(event.data as string);
          if (message.partial) {
            // Append partial transcription. You might want to replace the last part for a smoother live feel.
            setTranscription((prev) => prev.substring(0, prev.lastIndexOf(' ') + 1) + message.partial + ' ');
          } else if (message.summary) {
            setTranscription(message.summary); // Replace with final summary
            console.log('Summary received:', message.summary);
          } else if (message.transcription) { // Assuming full transcript might be sent
            setTranscription(message.transcription);
          }
        };

        socketRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          setTranscription('Error connecting to transcription service. Check console.');
          setIsRecording(false);
          stream.getTracks().forEach(track => track.stop()); // Stop media tracks
        };

        socketRef.current.onclose = (event) => {
          console.log('WebSocket connection closed:', event.reason, event.code);
          setIsRecording(false);
          setTranscription((prev) => prev + ' (Connection closed)');
          stream.getTracks().forEach(track => track.stop()); // Ensure media tracks are stopped
        };

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0 && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            audioChunksRef.current.push(event.data); // Keep a copy if needed for other purposes
            socketRef.current.send(event.data); // Send audio data chunk over WebSocket
          }
        };

        mediaRecorderRef.current.onstop = () => {
          console.log('MediaRecorder stopped.');
          // Signal end of audio stream to backend if necessary
          // Some backends might expect a specific message like { "action": "stop" }
          // For now, we just close the WebSocket connection gracefully
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            // socketRef.current.send(JSON.stringify({ "action": "eos" })); // Example: end of stream signal
          }
          socketRef.current?.close();
          setIsRecording(false); // Update UI
          // The actual stopping of tracks is handled by onclose or onerror for the socket,
          // or if recording is toggled off before connection fully closes.
        };

      } catch (error) {
        console.error('Error accessing microphone or setting up recording:', error);
        setTranscription('Error accessing microphone. Please check permissions and console.');
        setIsRecording(false);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Classroom Notes - Frontend</h1>
        <button onClick={handleToggleRecording} style={{ padding: '20px', fontSize: '20px', cursor: 'pointer' }}>
          {isRecording ? '🛑 Stop Recording' : '🎤 Start Recording'}
        </button>
        <div className="transcription-box" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', minHeight: '100px', width: '80%', backgroundColor: 'white', color: 'black' }}>
          <h2>Transcription:</h2>
          <p>{transcription}</p>
        </div>
      </header>
    </div>
  );
}

export default App;
