import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config';

export function UploadComponent() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'file'
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const { token } = useAuth();
  const navigate = useNavigate();
  const socketRef = React.useRef<WebSocket | null>(null);
  const dragCounter = React.useRef(0);

  // Cleanup WebSocket on component unmount
  useEffect(() => {
    return () => {
      socketRef.current?.close();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if ((activeTab === 'text' && !textContent) || (activeTab === 'file' && !file)) {
      setError('Please provide content to process.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProcessingStatus('Preparing your file...');
    setProcessingProgress(5);

    const backendUrl = `${config.apiUrl.replace('http', 'ws')}/ws/process-upload`;
    
    // Give a brief moment for the UI to update before connecting
    setTimeout(() => {
      setProcessingStatus('Connecting to server...');
      setProcessingProgress(10);
      socketRef.current = new WebSocket(backendUrl);

      socketRef.current.onopen = () => {
        setProcessingStatus('Uploading content...');
        setProcessingProgress(15);
        socketRef.current?.send(JSON.stringify({ token }));
  
        if (activeTab === 'text') {
          socketRef.current?.send(JSON.stringify({ type: 'text', data: textContent }));
        } else if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const file_data = (e.target?.result as string).split(',')[1];
            socketRef.current?.send(JSON.stringify({
              type: 'file',
              filename: file.name,
              data: file_data,
            }));
          };
          reader.readAsDataURL(file);
        }
      };
  
      socketRef.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
  
        if (message.error) {
          setError(message.error);
          setIsProcessing(false);
          socketRef.current?.close();
          return;
        }
  
        if (message.processing_status) {
          setProcessingStatus(message.processing_status);
        }
        if (message.progress) {
          // Ensure progress doesn't go backwards from the initial client-side steps
          setProcessingProgress(prev => Math.max(prev, message.progress));
        }
  
        if (message.success && message.lecture_id) {
          setProcessingStatus('All done! Redirecting...');
          setProcessingProgress(100);
          navigate(`/lectures/${message.lecture_id}`);
        }
      };
  
      socketRef.current.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setError('Connection failed. Please try again.');
        setIsProcessing(false);
      };
  
      socketRef.current.onclose = () => {
        if (!processingStatus.startsWith('All done!')) {
          setIsProcessing(false);
        }
      };
    }, 500); // 500ms delay to make the first step visible
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow drop
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0; // Reset counter on drop
  
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Check file type
      const acceptedTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'text/plain',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      if (acceptedTypes.includes(files[0].type)) {
        setFile(files[0]);
        setError(null);
      } else {
        setError('Unsupported file type. Please upload a DOC, DOCX, PDF, PPTX, or TXT file.');
      }
    }
  };

  if (isProcessing) {
    return <ProcessingView status={processingStatus} progress={processingProgress} />;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto 1.5rem', padding: '0rem 1.5rem 1.5rem 1.5rem', color: '#fff' }}>
      <h1 style={{ 
        textAlign: 'center', 
        marginBottom: '1rem',
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#fff'
      }}>Generate Notes</h1>
      <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem' }}>
        Upload a document or paste text to automatically generate structured notes and summaries.
      </p>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '2rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '10px',
        padding: '0.3rem'
      }}>
        <button 
          onClick={() => { setActiveTab('text'); setError(null); setFile(null); }}
          style={getTabButtonStyle(activeTab === 'text')}
        >
          Paste Text
        </button>
        <button 
          onClick={() => { setActiveTab('file'); setError(null); setTextContent(''); }}
          style={getTabButtonStyle(activeTab === 'file')}
        >
          Upload File
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {activeTab === 'text' && (
          <div>
            <textarea
              placeholder="Paste your text here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '300px',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '1rem',
                color: '#fff',
                fontSize: '1rem',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                resize: 'vertical',
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#5658f5';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
              disabled={isProcessing}
            />
            <button type="submit" style={getSubmitButtonStyle(isProcessing)} disabled={isProcessing || !textContent}>
              {isProcessing ? 'Processing...' : 'Generate from Text'}
            </button>
          </div>
        )}

        {activeTab === 'file' && (
          <div style={{ textAlign: 'center' }}>
            <div 
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${isDragging ? '#8c8eff' : file ? 'rgba(86, 88, 245, 0.3)' : 'rgba(255, 255, 255, 0.2)'}`,
                borderRadius: '12px',
                padding: '4rem',
                marginBottom: '1rem',
                background: isDragging ? 'rgba(86, 88, 245, 0.2)' : file ? 'rgba(86, 88, 245, 0.1)' : 'transparent',
                transition: 'all 0.2s ease-in-out',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px'
              }}
            >
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept=".doc, .docx, .pdf, .txt, .pptx"
                style={{ display: 'none' }}
                disabled={isProcessing}
              />
              <label htmlFor="file-upload" style={getUploadLabelStyle(isProcessing)}>
                {file ? `Selected: ${file.name}` : 'Choose a file or drag it here'}
              </label>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '1rem' }}>
                Supported formats: DOC, DOCX, PDF, PPTX, TXT
              </p>
            </div>
            <button type="submit" style={getSubmitButtonStyle(isProcessing)} disabled={isProcessing || !file}>
              {isProcessing ? 'Processing...' : 'Generate from File'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

const ProcessingView = ({ status, progress }: { status: string; progress: number }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    color: '#fff'
  }}>
    <div style={{ width: '80%', maxWidth: '600px', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{status}</h2>
      <div style={{
        width: '100%',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
        height: '16px'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #5658f5, #8c8eff)',
          transition: 'width 0.3s ease-in-out',
          borderRadius: '8px'
        }}/>
      </div>
      <p style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>{progress}% complete</p>
    </div>
  </div>
);

// Helper functions for styling to keep the main component clean
const getTabButtonStyle = (isActive: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '0.8rem 1rem',
  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
  border: 'none',
  borderRadius: '8px',
  color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.6)',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: 500,
  transition: 'all 0.2s ease-in-out',
});

const getSubmitButtonStyle = (isLoading: boolean): React.CSSProperties => ({
  width: '100%',
  padding: '1rem',
  marginTop: '1rem',
  background: 'linear-gradient(90deg, #5658f5, #8c8eff)',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  cursor: isLoading ? 'not-allowed' : 'pointer',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  transition: 'opacity 0.2s ease',
  opacity: isLoading ? 0.7 : 1,
});

const getUploadLabelStyle = (isLoading: boolean): React.CSSProperties => ({
  padding: '0.8rem 1.5rem',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  color: '#fff',
  cursor: isLoading ? 'not-allowed' : 'pointer',
  transition: 'background 0.2s ease',
  display: 'inline-block'
});