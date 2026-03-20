import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

export default function AuthPage() {
  const [mode, setMode] = useState('signin');
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  if (isSignedIn) return <Navigate to="/chat" replace />;

  const appearance = {
    variables: {
      colorPrimary: '#38bdf8',
      colorBackground: '#0e1219',
      colorInputBackground: '#141c28',
      colorInputText: '#e8eef8',
      colorText: '#e8eef8',
      colorTextSecondary: '#5a6a88',
      borderRadius: '12px',
      fontFamily: "'Outfit', sans-serif",
    },
    elements: {
      card: { boxShadow: '0 24px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.07)', width: '100%' },
      formButtonPrimary: { background: 'linear-gradient(135deg, #38bdf8, #818cf8)', border: 'none' },
      footerActionLink: { color: '#38bdf8' },
    },
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#07090f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif",
      padding: 'clamp(16px, 4vw, 40px)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 40% at 20% 10%, rgba(56,189,248,0.07) 0,transparent 60%),
          radial-gradient(ellipse 50% 50% at 80% 80%, rgba(129,140,248,0.07) 0,transparent 60%)` }} />

      {/* Back button */}
      <button onClick={() => navigate('/')} style={{
        position: 'fixed', top: 'clamp(12px,2vw,24px)', left: 'clamp(12px,2vw,24px)',
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '8px 14px', borderRadius: '10px',
        background: 'rgba(14,18,25,0.8)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#5a6a88', cursor: 'pointer', fontSize: 'clamp(12px,1.5vw,13px)',
        fontFamily: "'Outfit',sans-serif", backdropFilter: 'blur(12px)', zIndex: 10,
      }}>← Back</button>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 'clamp(20px,3vw,28px)', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 'clamp(44px,8vw,56px)', height: 'clamp(44px,8vw,56px)', borderRadius: '16px',
          background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'clamp(22px,4vw,28px)', margin: '0 auto 12px',
          boxShadow: '0 0 28px rgba(56,189,248,0.4)',
        }}>🎓</div>
        <div style={{ fontSize: 'clamp(18px,3vw,22px)', fontWeight: 800, letterSpacing: '-0.5px', background: 'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          EduBot
        </div>
        <div style={{ color: '#5a6a88', fontSize: 'clamp(12px,1.5vw,13px)', marginTop: '4px' }}>
          Emotion-Aware AI Tutor
        </div>
      </div>

      {/* Toggle */}
      <div style={{
        display: 'flex', borderRadius: '12px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 'clamp(16px,3vw,22px)', position: 'relative', zIndex: 1,
        background: 'rgba(14,18,25,0.8)',
      }}>
        {['signin','signup'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: 'clamp(8px,1.5vw,10px) clamp(20px,4vw,28px)',
            fontSize: 'clamp(12px,1.5vw,13px)', fontWeight: 600,
            fontFamily: "'Outfit',sans-serif", cursor: 'pointer', border: 'none',
            background: mode === m ? 'linear-gradient(135deg,#38bdf8,#818cf8)' : 'transparent',
            color: mode === m ? '#07090f' : '#5a6a88', transition: 'all 0.2s',
          }}>
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Clerk — constrained width on large screens, full on mobile */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 'min(480px, 100%)' }}>
        {mode === 'signin'
          ? <SignIn routing="hash" fallbackRedirectUrl="/#/chat" appearance={appearance} />
          : <SignUp routing="hash" fallbackRedirectUrl="/#/chat" appearance={appearance} />
        }
      </div>
    </div>
  );
}
