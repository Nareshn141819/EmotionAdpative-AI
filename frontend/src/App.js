import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';

function PageSpinner() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#07090f',
      flexDirection: 'column', gap: '20px',
    }}>
      <style>{`
        @keyframes spinPulse {
          0%   { transform:rotate(0deg)   scale(1);   box-shadow:0 0 16px rgba(56,189,248,0.4); }
          25%  { transform:rotate(90deg)  scale(1.1); box-shadow:0 0 28px rgba(129,140,248,0.6); }
          50%  { transform:rotate(180deg) scale(1);   box-shadow:0 0 16px rgba(244,114,182,0.4); }
          75%  { transform:rotate(270deg) scale(1.1); box-shadow:0 0 28px rgba(56,189,248,0.6); }
          100% { transform:rotate(360deg) scale(1);   box-shadow:0 0 16px rgba(56,189,248,0.4); }
        }
        @keyframes ringRotate   { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
        @keyframes ringReverseR { from{transform:rotate(0deg)}   to{transform:rotate(-360deg)} }
        @keyframes fadeInUp     { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dotPulse     { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
      `}</style>
      <div style={{ position:'relative', width:'80px', height:'80px' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#38bdf8', borderRightColor:'#818cf8', animation:'ringRotate 1.2s linear infinite' }} />
        <div style={{ position:'absolute', inset:'6px', borderRadius:'50%', border:'2px solid transparent', borderBottomColor:'#f472b6', borderLeftColor:'#38bdf8', animation:'ringReverseR 1.8s linear infinite' }} />
        <div style={{ position:'absolute', inset:'14px', borderRadius:'13px', background:'linear-gradient(135deg,#38bdf8,#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', animation:'spinPulse 3s ease-in-out infinite' }}>🧠</div>
      </div>
      <div style={{ fontSize:'18px', fontWeight:700, letterSpacing:'-0.5px', background:'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'fadeInUp 0.6s ease' }}>
        Emotion AI
      </div>
      <div style={{ display:'flex', gap:'6px', animation:'fadeInUp 0.8s ease' }}>
        {[0,0.2,0.4].map((d,i) => (
          <div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#38bdf8', animation:`dotPulse 1.2s ease-in-out ${d}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function RouteTransition({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [prev, setPrev] = useState(location.pathname);
  useEffect(() => {
    if (location.pathname !== prev) {
      setLoading(true); setPrev(location.pathname);
      const t = setTimeout(() => setLoading(false), 700);
      return () => clearTimeout(t);
    }
  }, [location.pathname]); // eslint-disable-line
  return <>{loading && <PageSpinner />}{children}</>;
}

function ProtectedRoute({ children, user }) {
  if (user === undefined) return <PageSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u || null));
    return unsub;
  }, []);

  if (user === undefined) return <PageSpinner />;

  return (
    <HashRouter>
      <RouteTransition>
        <Routes>
          <Route path="/"     element={<LandingPage user={user} />} />
          <Route path="/auth" element={user ? <Navigate to="/chat" replace /> : <AuthPage />} />
          <Route path="/chat" element={
            <ProtectedRoute user={user}>
              <ChatPage user={user} />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RouteTransition>
    </HashRouter>
  );
}
