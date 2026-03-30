import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';

// ── Global page transition spinner ───────────────────────────────
function PageSpinner() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#07090f',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '20px',
    }}>
      <style>{`
        @keyframes spinPulse {
          0%   { transform: rotate(0deg)   scale(1);    box-shadow: 0 0 16px rgba(56,189,248,0.4); }
          25%  { transform: rotate(90deg)  scale(1.1);  box-shadow: 0 0 28px rgba(129,140,248,0.6); }
          50%  { transform: rotate(180deg) scale(1);    box-shadow: 0 0 16px rgba(244,114,182,0.4); }
          75%  { transform: rotate(270deg) scale(1.1);  box-shadow: 0 0 28px rgba(56,189,248,0.6); }
          100% { transform: rotate(360deg) scale(1);    box-shadow: 0 0 16px rgba(56,189,248,0.4); }
        }
        @keyframes ringRotate  { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes ringReverseR{ from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
        @keyframes fadeInUp    { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dotPulse    { 0%,100%{ opacity:.3; transform:scale(.8); } 50%{ opacity:1; transform:scale(1.2); } }
        @keyframes spinnerFadeOut { from{opacity:1} to{opacity:0; pointer-events:none} }
      `}</style>

      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#38bdf8', borderRightColor: '#818cf8',
          animation: 'ringRotate 1.2s linear infinite',
        }} />
        {/* Inner ring */}
        <div style={{
          position: 'absolute', inset: '6px', borderRadius: '50%',
          border: '2px solid transparent',
          borderBottomColor: '#f472b6', borderLeftColor: '#38bdf8',
          animation: 'ringReverseR 1.8s linear infinite',
        }} />
        {/* Center icon */}
        <div style={{
          position: 'absolute', inset: '18px', borderRadius: '14px',
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '21px', animation: 'spinPulse 3s ease-in-out infinite',
        }}>🧠</div>
      </div>

    </div>
  );
}

// ── Route change detector ─────────────────────────────────────────
function RouteTransition({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);

 useEffect(() => {
  const unsub = onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoaded(true);
  });
  return unsub;
}, []);

  return (
    <>
      {loading && <PageSpinner />}
      {children}
    </>
  );
}

// ── Auth guard ────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) return <PageSpinner />;
  if (!isSignedIn) return <Navigate to="/auth" replace />;
  return children;
}

// ── App ───────────────────────────────────────────────────────────
export default function App() {
  const { isLoaded } = useAuth();

  if (!isLoaded) return <PageSpinner />;

  return (
    <HashRouter>
      <RouteTransition>
        <Routes>
          <Route path="/"     element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/chat" element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RouteTransition>
    </HashRouter>
  );
}
