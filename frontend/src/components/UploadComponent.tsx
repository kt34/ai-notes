import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../utils/api';

export function UploadComponent() {
  const [activeTab, setActiveTab] = useState('text'); // 'text' or 'file'
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    if (activeTab === 'text' && textContent) {
      formData.append('text_content', textContent);
    } else if (activeTab === 'file' && file) {
      formData.append('file', file);
    } else {
      setError('Please provide content to process.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiRequest('/upload/process', {
        method: 'POST',
        token,
        body: formData,
        isFormData: true
      });
      
      if (response.success && response.lecture_id) {
        navigate(`/lectures/${response.lecture_id}`);
      } else {
        throw new Error(response.message || 'Failed to process content.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem', color: '#fff' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>Generate Notes</h1>
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
                resize: 'vertical'
              }}
              disabled={isLoading}
            />
            <button type="submit" style={getSubmitButtonStyle(isLoading)} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate from Text'}
            </button>
          </div>
        )}

        {activeTab === 'file' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              border: '2px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '3rem',
              marginBottom: '1rem',
              background: file ? 'rgba(86, 88, 245, 0.1)' : 'transparent',
              borderColor: file ? 'rgba(86, 88, 245, 0.3)' : 'rgba(255, 255, 255, 0.2)',
            }}>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                accept=".doc, .docx, .pdf, .txt"
                style={{ display: 'none' }}
                disabled={isLoading}
              />
              <label htmlFor="file-upload" style={getUploadLabelStyle(isLoading)}>
                {file ? `Selected: ${file.name}` : 'Choose a file or drag it here'}
              </label>
              <p style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: '1rem' }}>
                Supported formats: DOC, DOCX, PDF, TXT
              </p>
            </div>
            <button type="submit" style={getSubmitButtonStyle(isLoading)} disabled={isLoading || !file}>
              {isLoading ? 'Generating...' : 'Generate from File'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

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