import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [mode, setMode] = useState('signin');
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh', background: '#07090f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit', sans-serif", padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 40% at 20% 10%, rgba(56,189,248,0.07) 0, transparent 60%),
          radial-gradient(ellipse 50% 50% at 80% 80%, rgba(129,140,248,0.07) 0, transparent 60%)
        `,
      }} />

      {/* Back button */}
      <button onClick={() => navigate('/')} style={{
        position: 'fixed', top: '24px', left: '24px',
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 16px', borderRadius: '10px',
        background: 'rgba(14,18,25,0.8)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#5a6a88', cursor: 'pointer', fontSize: '13px',
        fontFamily: "'Outfit', sans-serif",
        backdropFilter: 'blur(12px)',
        transition: 'color 0.2s',
        zIndex: 10,
      }}
        onMouseEnter={e => e.currentTarget.style.color = '#e8eef8'}
        onMouseLeave={e => e.currentTarget.style.color = '#5a6a88'}
      >
        ← Back
      </button>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', margin: '0 auto 14px',
          boxShadow: '0 0 32px rgba(56,189,248,0.4)',
        }}>🎓</div>
        <div style={{
          fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px',
          background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>EduBot</div>
        <div style={{ color: '#5a6a88', fontSize: '13px', marginTop: '4px' }}>
          Emotion-Aware AI Tutor
        </div>
      </div>

      {/* Toggle */}
      <div style={{
        display: 'flex', borderRadius: '12px', overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        marginBottom: '24px', position: 'relative', zIndex: 1,
        background: 'rgba(14,18,25,0.8)',
      }}>
        {['signin', 'signup'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '10px 28px', fontSize: '13px', fontWeight: 600,
            fontFamily: "'Outfit', sans-serif", cursor: 'pointer', border: 'none',
            background: mode === m ? 'linear-gradient(135deg, #38bdf8, #818cf8)' : 'transparent',
            color: mode === m ? '#07090f' : '#5a6a88',
            transition: 'all 0.2s',
          }}>
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Clerk component */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {mode === 'signin' ? (
          <SignIn
            afterSignInUrl="/chat"
            routing="hash"
            appearance={{
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
                card: { boxShadow: '0 24px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.07)' },
                formButtonPrimary: { background: 'linear-gradient(135deg, #38bdf8, #818cf8)', border: 'none' },
                footerActionLink: { color: '#38bdf8' },
              }
            }}
          />
        ) : (
          <SignUp
            afterSignUpUrl="/chat"
            routing="hash"
            appearance={{
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
                card: { boxShadow: '0 24px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.07)' },
                formButtonPrimary: { background: 'linear-gradient(135deg, #38bdf8, #818cf8)', border: 'none' },
                footerActionLink: { color: '#38bdf8' },
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
