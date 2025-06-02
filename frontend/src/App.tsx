import { useAuth } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { RecordPage } from './pages/RecordPage';
import { LecturesPage } from './pages/LecturesPage';
import { LectureDetailPage } from './pages/LectureDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NavBar } from './components/NavBar';
import './App.css';

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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/record" element={
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