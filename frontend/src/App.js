import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/auth" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#07090f',
      flexDirection: 'column', gap: '20px',
    }}>
      <style>{`
        @keyframes spinPulse {
          0%   { transform: rotate(0deg) scale(1);    box-shadow: 0 0 16px rgba(56,189,248,0.4); }
          25%  { transform: rotate(90deg) scale(1.1); box-shadow: 0 0 28px rgba(129,140,248,0.6); }
          50%  { transform: rotate(180deg) scale(1);  box-shadow: 0 0 16px rgba(244,114,182,0.4); }
          75%  { transform: rotate(270deg) scale(1.1);box-shadow: 0 0 28px rgba(56,189,248,0.6); }
          100% { transform: rotate(360deg) scale(1);  box-shadow: 0 0 16px rgba(56,189,248,0.4); }
        }
        @keyframes ringRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
      `}</style>

      {/* Outer spinning ring */}
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#38bdf8',
          borderRightColor: '#818cf8',
          animation: 'ringRotate 1.2s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: '6px',
          borderRadius: '50%',
          border: '2px solid transparent',
          borderBottomColor: '#f472b6',
          borderLeftColor: '#38bdf8',
          animation: 'ringRotate 1.8s linear infinite reverse',
        }} />

        {/* Center icon */}
        <div style={{
          position: 'absolute', inset: '14px',
          borderRadius: '13px',
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px',
          animation: 'spinPulse 3s ease-in-out infinite',
        }}>🎓</div>
      </div>

      {/* App name */}
      <div style={{
        color: '#e8eef8', fontSize: '18px', fontWeight: 700,
        letterSpacing: '-0.5px',
        background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        animation: 'fadeInUp 0.6s ease',
      }}>
        Emotion AI
      </div>

      
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
