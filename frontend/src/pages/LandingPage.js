import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const styles = {
  page: {
    minHeight: '100vh', background: '#07090f', color: '#e8eef8',
    fontFamily: "'Outfit', sans-serif", overflowX: 'hidden', position: 'relative',
  },
  noise: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
  },
  glow: {
    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
    background: `
      radial-gradient(ellipse 60% 40% at 20% 10%, rgba(56,189,248,0.08) 0, transparent 60%),
      radial-gradient(ellipse 50% 50% at 80% 80%, rgba(129,140,248,0.08) 0, transparent 60%),
      radial-gradient(ellipse 40% 60% at 50% 50%, rgba(244,114,182,0.04) 0, transparent 70%)
    `,
  },
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 48px', height: '64px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(7,9,15,0.85)', backdropFilter: 'blur(20px)',
  },
  navBrand: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  navMark: {
    width: '34px', height: '34px', borderRadius: '10px',
    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '18px', boxShadow: '0 0 16px rgba(56,189,248,0.3)',
  },
  navName: {
    fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px',
    background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  hero: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh',
    padding: '100px 24px 60px', textAlign: 'center',
  },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    padding: '6px 16px', borderRadius: '100px',
    background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
    fontSize: '12px', color: '#38bdf8', fontFamily: "'Space Mono', monospace",
    marginBottom: '32px', letterSpacing: '0.5px',
  },
  h1: {
    fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 800,
    letterSpacing: '-2px', lineHeight: 1.05, marginBottom: '24px',
    maxWidth: '800px',
  },
  h1grad: {
    background: 'linear-gradient(135deg, #e8eef8 0%, #38bdf8 40%, #818cf8 70%, #f472b6 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  sub: {
    fontSize: '18px', color: '#5a6a88', maxWidth: '520px',
    lineHeight: 1.75, marginBottom: '48px',
  },
  ctaRow: {
    display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap',
    justifyContent: 'center', marginBottom: '80px',
  },
  ctaPrimary: {
    padding: '14px 32px', borderRadius: '13px', fontSize: '15px', fontWeight: 600,
    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
    border: 'none', color: '#07090f', cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif",
    boxShadow: '0 0 32px rgba(56,189,248,0.3)',
    transition: 'all 0.2s',
  },
  ctaSecondary: {
    padding: '14px 32px', borderRadius: '13px', fontSize: '15px', fontWeight: 500,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e8eef8', cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
    transition: 'all 0.2s',
  },
  pipeline: {
    display: 'flex', alignItems: 'center', gap: '0',
    padding: '20px 32px', borderRadius: '16px',
    background: 'rgba(14,18,25,0.8)', border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(12px)', flexWrap: 'wrap', justifyContent: 'center',
    marginBottom: '100px',
  },
  pStep: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    padding: '8px 20px',
  },
  pIcon: { fontSize: '24px' },
  pLabel: { fontSize: '11px', color: '#5a6a88', fontFamily: "'Space Mono', monospace" },
  pArrow: { color: 'rgba(255,255,255,0.15)', fontSize: '20px', padding: '0 4px' },
  features: {
    position: 'relative', zIndex: 1,
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px', maxWidth: '1000px', margin: '0 auto', padding: '0 24px 100px',
  },
  featCard: {
    padding: '28px', borderRadius: '16px',
    background: 'rgba(14,18,25,0.6)', border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(8px)',
    transition: 'border-color 0.3s, transform 0.3s',
  },
  featIcon: { fontSize: '32px', marginBottom: '14px' },
  featTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: '#e8eef8' },
  featDesc: { fontSize: '13.5px', color: '#5a6a88', lineHeight: 1.7 },
  emotions: {
    position: 'relative', zIndex: 1,
    maxWidth: '900px', margin: '0 auto', padding: '0 24px 100px', textAlign: 'center',
  },
  sectionLabel: {
    fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase',
    letterSpacing: '2px', fontFamily: "'Space Mono', monospace", marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '16px',
  },
  sectionSub: { fontSize: '14px', color: '#5a6a88', marginBottom: '40px' },
  emotionGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px',
  },
  emoCard: {
    padding: '20px 16px', borderRadius: '14px',
    background: 'rgba(14,18,25,0.8)', border: '1px solid rgba(255,255,255,0.07)',
    textAlign: 'left',
  },
  footer: {
    position: 'relative', zIndex: 1, textAlign: 'center',
    padding: '32px 24px', borderTop: '1px solid rgba(255,255,255,0.06)',
    color: '#5a6a88', fontSize: '13px', fontFamily: "'Space Mono', monospace",
  },
};

const FEATURES = [
  { icon: '🎤', title: 'Voice-First Input', desc: 'Speak naturally in your own words. Real-time speech-to-text transcription powered by Web Speech API.' },
  { icon: '😊', title: 'Emotion Detection', desc: 'Detects 8 emotional states from your language patterns — no wearables, no extra setup required.' },
  { icon: '🧠', title: 'Groq-Powered AI', desc: 'Llama 3.3 70B generates responses adapted to your emotional state — simpler when confused, deeper when excited.' },
  { icon: '🔊', title: 'Murf AI Voice', desc: 'Human-like voice responses with emotion-tuned pitch and pace. Feels like a real tutor, not a robot.' },
  { icon: '🔒', title: 'Secure Auth', desc: 'Clerk authentication — sign up with email or Google. Your API keys stay safely on the server.' },
  { icon: '⚡', title: 'Blazing Fast', desc: 'Groq inference is 10–25× faster than GPT-4. Get answers in under 2 seconds.' },
];

const EMOTIONS = [
  { icon: '😕', name: 'Confused', color: '#f472b6', style: 'Step-by-step breakdowns with analogies' },
  { icon: '😤', name: 'Frustrated', color: '#f87171', style: 'Empathetic, direct solutions' },
  { icon: '🤩', name: 'Excited', color: '#34d399', style: 'Deep dives & advanced concepts' },
  { icon: '😊', name: 'Happy', color: '#fbbf24', style: 'Reinforce & extend understanding' },
  { icon: '😔', name: 'Sad', color: '#60a5fa', style: 'Gentle, warm & encouraging' },
  { icon: '🧐', name: 'Curious', color: '#a78bfa', style: 'Rich details & connections' },
  { icon: '😑', name: 'Bored', color: '#78716c', style: 'Surprising hooks & new angles' },
  { icon: '😐', name: 'Neutral', color: '#94a3b8', style: 'Balanced, clear explanation' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const handleStart = () => navigate(isSignedIn ? '/chat' : '/auth');

  return (
    <div style={styles.page}>
      <div style={styles.noise} />
      <div style={styles.glow} />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <div style={styles.navMark}>🎓</div>
          <div style={styles.navName}>EduBot</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={styles.ctaSecondary} onClick={() => navigate('/auth')}>Sign In</button>
          <button style={{ ...styles.ctaPrimary, padding: '10px 22px', fontSize: '14px' }} onClick={handleStart}>
            Get Started →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.badge}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
          AI Tutor that feels what you feel
        </div>
        <h1 style={styles.h1}>
          <span style={styles.h1grad}>Learn Smarter</span>
          <br />
          <span style={{ color: '#e8eef8' }}>With Emotional AI</span>
        </h1>
        <p style={styles.sub}>
          EduBot detects your emotion from voice or text and adapts its teaching style in real time — 
          patient when you're confused, energetic when you're excited.
        </p>
        <div style={styles.ctaRow}>
          <button
            style={styles.ctaPrimary}
            onClick={handleStart}
            onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            🚀 Start Learning Free
          </button>
          <button
            style={styles.ctaSecondary}
            onClick={() => navigate('/auth')}
            onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.background = 'transparent'; }}
          >
            Sign In
          </button>
        </div>

        {/* Pipeline */}
        <div style={styles.pipeline}>
          {[
            { icon: '🎤', label: 'Voice Input' },
            { icon: '📝', label: 'Transcribe' },
            { icon: '😊', label: 'Detect Emotion' },
            { icon: '🧠', label: 'Groq LLM' },
            { icon: '🔊', label: 'Murf TTS' },
            { icon: '💬', label: 'Response' },
          ].map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <div style={styles.pStep}>
                <div style={styles.pIcon}>{s.icon}</div>
                <div style={styles.pLabel}>{s.label}</div>
              </div>
              {i < arr.length - 1 && <div style={styles.pArrow}>›</div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Features */}
      <div style={styles.features}>
        {FEATURES.map(f => (
          <div key={f.title} style={styles.featCard}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.25)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={styles.featIcon}>{f.icon}</div>
            <div style={styles.featTitle}>{f.title}</div>
            <div style={styles.featDesc}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Emotions */}
      <div style={styles.emotions}>
        <div style={styles.sectionLabel}>Emotion Intelligence</div>
        <h2 style={styles.sectionTitle}>8 Emotions. 8 Teaching Styles.</h2>
        <p style={styles.sectionSub}>Every emotional state gets a different response strategy, automatically.</p>
        <div style={styles.emotionGrid}>
          {EMOTIONS.map(e => (
            <div key={e.name} style={{ ...styles.emoCard, borderColor: `${e.color}22` }}
              onMouseEnter={el => el.currentTarget.style.borderColor = `${e.color}55`}
              onMouseLeave={el => el.currentTarget.style.borderColor = `${e.color}22`}
            >
              <div style={{ fontSize: '22px', marginBottom: '8px' }}>{e.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: e.color, marginBottom: '4px' }}>{e.name}</div>
              <div style={{ fontSize: '12px', color: '#5a6a88', lineHeight: 1.6 }}>{e.style}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA section */}
      <div style={{ ...styles.emotions, textAlign: 'center', paddingBottom: '80px' }}>
        <h2 style={{ ...styles.sectionTitle, fontSize: '36px' }}>Ready to learn differently?</h2>
        <p style={{ ...styles.sectionSub, marginBottom: '32px' }}>
          Free to use. No credit card needed.
        </p>
        <button style={styles.ctaPrimary} onClick={handleStart}
          onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          🎓 Start Learning Now
        </button>
      </div>

      <footer style={styles.footer}>
        © 2025 EduBot · Built with Groq + Murf AI + Clerk · Deployed on GitHub Pages + Render
      </footer>

      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}
