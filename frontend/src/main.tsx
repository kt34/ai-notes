import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import { RecordingProvider } from './contexts/RecordingContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RecordingProvider>
        <App />
      </RecordingProvider>
    </AuthProvider>
  </React.StrictMode>,
)
