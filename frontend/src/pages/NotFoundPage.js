import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div style={{
      minHeight: '100vh', background: '#07090f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Outfit',sans-serif", textAlign: 'center',
      padding: '24px',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 40% at 50% 50%, rgba(56,189,248,0.06) 0,transparent 60%)` }} />

      <h1 style={{ fontSize: 'clamp(60px,12vw,120px)', fontWeight: 800,
        letterSpacing: '-4px', margin: '0 0 8px',
        background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        404
      </h1>
      <p style={{ fontSize: '20px', color: '#5a6a88',
        marginBottom: '8px', fontWeight: 600 }}>
        Page not found
      </p>

      <p style={{ fontSize: '18px', color: '#5a6a88',
        maxWidth: '360px', lineHeight: 1.7, marginBottom: '32px' }}>
        Looks like this page doesn't exist. Don't worry — let's get you back on track!
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap',
        justifyContent: 'center' }}>
        <button onClick={() => navigate(-1)} style={{
          padding: '12px 24px', borderRadius: '12px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#e8eef8', cursor: 'pointer', fontSize: '14px',
          fontFamily: "'Outfit',sans-serif",
        }}>← Go Back</button>

        <button onClick={() => navigate('/')} style={{
          padding: '12px 24px', borderRadius: '12px',
          background: 'linear-gradient(135deg,#38bdf8,#818cf8)',
          border: 'none', color: '#07090f', cursor: 'pointer',
          fontSize: '14px', fontWeight: 600,
          fontFamily: "'Outfit',sans-serif",
          boxShadow: '0 0 20px rgba(56,189,248,0.3)',
        }}>🏠 Go Home</button>
      </div>

      <style>{`
        @keyframes float {
          0%,100%{transform:translateY(0)}
          50%{transform:translateY(-12px)}
        }
      `}</style>
         <style>{` 
         @keyframes fadeUp {
         from {
           opacity: 0;
           transform: translateY(30px);
         }
         to {
            opacity: 1;
            transform: translateY(0);
          }
         }`}
    </style>
    </div>
  );
}
