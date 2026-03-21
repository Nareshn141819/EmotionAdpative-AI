import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const FEATURES = [
  { icon: '🎤', title: 'Voice-First Input', desc: 'Speak naturally — real-time speech-to-text transcription.' },
  { icon: '😊', title: 'Emotion Detection', desc: '8 emotional states detected from your language patterns.' },
  { icon: '🔒', title: 'Secure Auth', desc: 'Safe Authentication with— email or Google sign-in.' },
  { icon: '⚡', title: 'Blazing Fast', desc: 'LLM Inference — answers in under few seconds.' },
];

const EMOTIONS = [
  { icon: '😕', name: 'Confused',   color: '#f472b6', style: 'Step-by-step breakdowns' },
  { icon: '😤', name: 'Frustrated', color: '#f87171', style: 'Empathetic, direct help' },
  { icon: '🤩', name: 'Excited',    color: '#34d399', style: 'Deep dives and advanced' },
  { icon: '😊', name: 'Happy',      color: '#fbbf24', style: 'Reinforce and extend' },
  { icon: '😔', name: 'Sad',        color: '#60a5fa', style: 'Gentle and encouraging' },
  { icon: '🧐', name: 'Curious',    color: '#a78bfa', style: 'Rich details and facts' },
  { icon: '😑', name: 'Bored',      color: '#78716c', style: 'Surprising new angles' },
  { icon: '😐', name: 'Neutral',    color: '#94a3b8', style: 'Balanced explanation' },
];

const PIPELINE = [
  ['🎤','Voice'],['📝','Transcribe'],['😊','Emotion'],['💬','Response']
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const go = () => navigate(isSignedIn ? '/chat' : '/auth');

  return (
    <div style={{ minHeight:'100vh', background:'#07090f', color:'#e8eef8', fontFamily:"'Outfit',sans-serif", overflowX:'hidden' }}>

      {/* Ambient */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:`radial-gradient(ellipse 60% 40% at 20% 10%, rgba(56,189,248,0.07) 0,transparent 60%),
          radial-gradient(ellipse 50% 50% at 80% 80%, rgba(129,140,248,0.07) 0,transparent 60%)` }} />

      {/* Nav */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 clamp(16px,4vw,48px)', height:'60px',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        background:'rgba(7,9,15,0.9)', backdropFilter:'blur(20px)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'9px',
            background:'linear-gradient(135deg,#38bdf8,#818cf8)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'17px', boxShadow:'0 0 14px rgba(56,189,248,0.3)' }}>🎓</div>
          <span style={{ fontSize:'17px', fontWeight:800, letterSpacing:'-0.5px',
            background:'linear-gradient(90deg,#38bdf8,#818cf8)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Emotion AI</span>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={() => navigate('/auth')} style={{ padding:'8px 18px', borderRadius:'10px',
            background:'transparent', border:'1px solid rgba(255,255,255,0.1)',
            color:'#e8eef8', cursor:'pointer', fontSize:'13px',
            fontFamily:"'Outfit',sans-serif" }}>Sign In</button>
          <button onClick={go} style={{ padding:'8px 18px', borderRadius:'10px',
            background:'linear-gradient(135deg,#38bdf8,#818cf8)', border:'none',
            color:'#07090f', cursor:'pointer', fontSize:'13px', fontWeight:600,
            fontFamily:"'Outfit',sans-serif" }}>Get Started</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position:'relative', zIndex:1,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', padding:'clamp(80px,12vw,120px) clamp(16px,4vw,48px) 60px',
        textAlign:'center' }}>

        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px',
          padding:'6px 16px', borderRadius:'100px',
          background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)',
          fontSize:'clamp(11px,2vw,12px)', color:'#38bdf8', fontFamily:'monospace',
          marginBottom:'28px' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#38bdf8', display:'inline-block' }} />
          AI Tutor that feels what you feel
        </div>

        <div 
         style={{
            width:'88px',
            height:'88px',
            borderRadius:'26px',
            background:'linear-gradient(135deg,rgba(56,189,248,.12),rgba(129,140,248,.12))',
            border:'1px solid rgba(56,189,248,.25)',
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            fontSize:'38px',
            boxShadow:'0 0 40px rgba(56,189,248,.1)',
            animation:'float 5s ease-in-out infinite' }}
        >
          🧠
        </div>

        <h1 style={{ fontSize:'clamp(32px,7vw,80px)', fontWeight:800, letterSpacing:'-2px',
          lineHeight:1.05, marginBottom:'20px', maxWidth:'800px' }}>
          <span style={{ background:'linear-gradient(135deg,#e8eef8 0%,#38bdf8 40%,#818cf8 70%,#f472b6 100%)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Learn Smarter</span>
          <br />
          <span style={{ color:'#e8eef8' }}>With Emotional AI</span>
        </h1>

        <p style={{ fontSize:'clamp(14px,2vw,18px)', color:'#5a6a88', maxWidth:'500px',
          lineHeight:1.75, marginBottom:'40px' }}>
          Eomotion AI detects your emotion from voice and adapts its teaching style in real time — Emotion detection may occasionally be imprecise, so feel free to clarify how you're feeling!
        </p>

        <div style={{ display:'flex', gap:'12px', flexWrap:'wrap',
          justifyContent:'center', marginBottom:'60px' }}>
          <button onClick={go} style={{ padding:'clamp(12px,2vw,14px) clamp(24px,4vw,32px)',
            borderRadius:'13px', fontSize:'clamp(13px,2vw,15px)', fontWeight:600,
            background:'linear-gradient(135deg,#38bdf8,#818cf8)', border:'none',
            color:'#07090f', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
            boxShadow:'0 0 28px rgba(56,189,248,0.3)' }}>
            Start Learning Free
          </button>
          <button onClick={() => navigate('/auth')} style={{
            padding:'clamp(12px,2vw,14px) clamp(24px,4vw,32px)',
            borderRadius:'13px', fontSize:'clamp(13px,2vw,15px)',
            background:'transparent', border:'1px solid rgba(255,255,255,0.1)',
            color:'#e8eef8', cursor:'pointer', fontFamily:"'Outfit',sans-serif" }}>
            Sign In
          </button>
        </div>

        {/* Pipeline */}
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap',
          justifyContent:'center', gap:'4px',
          padding:'clamp(14px,3vw,20px) clamp(16px,4vw,32px)',
          borderRadius:'16px', background:'rgba(14,18,25,0.8)',
          border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(12px)',
          maxWidth:'700px', width:'100%' }}>
          {PIPELINE.map(([icon, label], i, arr) => (
            <React.Fragment key={label}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
                gap:'6px', padding:'6px 12px' }}>
                <span style={{ fontSize:'clamp(18px,3vw,24px)' }}>{icon}</span>
                <span style={{ fontSize:'clamp(9px,1.5vw,11px)', color:'#5a6a88',
                  fontFamily:'monospace', whiteSpace:'nowrap' }}>{label}</span>
              </div>
              {i < arr.length - 1 && (
                <span style={{ color:'rgba(255,255,255,0.15)', fontSize:'18px' }}>›</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ position:'relative', zIndex:1,
        padding:'0 clamp(16px,4vw,48px) 80px', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <div style={{ fontSize:'11px', color:'#38bdf8', textTransform:'uppercase',
            letterSpacing:'2px', fontFamily:'monospace', marginBottom:'10px' }}>Features</div>
          <h2 style={{ fontSize:'clamp(24px,4vw,36px)', fontWeight:800, letterSpacing:'-1px' }}>
            Everything you need to learn
          </h2>
        </div>
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap:'16px' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ padding:'clamp(20px,3vw,28px)', borderRadius:'16px',
              background:'rgba(14,18,25,0.6)', border:'1px solid rgba(255,255,255,0.07)',
              backdropFilter:'blur(8px)' }}>
              <div style={{ fontSize:'clamp(24px,4vw,32px)', marginBottom:'12px' }}>{f.icon}</div>
              <div style={{ fontSize:'clamp(14px,2vw,16px)', fontWeight:700, marginBottom:'8px' }}>{f.title}</div>
              <div style={{ fontSize:'clamp(12px,1.5vw,13.5px)', color:'#5a6a88', lineHeight:1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Emotions */}
      <section style={{ position:'relative', zIndex:1,
        padding:'0 clamp(16px,4vw,48px) 80px', maxWidth:'1000px',
        margin:'0 auto', textAlign:'center' }}>
        <div style={{ fontSize:'11px', color:'#38bdf8', textTransform:'uppercase',
          letterSpacing:'2px', fontFamily:'monospace', marginBottom:'10px' }}>
          Emotion Intelligence
        </div>
        <h2 style={{ fontSize:'clamp(22px,4vw,32px)', fontWeight:800,
          letterSpacing:'-1px', marginBottom:'12px' }}>
          8 Emotions. 8 Teaching Styles.
        </h2>
        <p style={{ fontSize:'clamp(13px,2vw,14px)', color:'#5a6a88', marginBottom:'36px' }}>
          Every emotional state gets a different response strategy, automatically.
        </p>
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
          gap:'12px' }}>
          {EMOTIONS.map(e => (
            <div key={e.name} style={{ padding:'clamp(14px,2vw,20px)', borderRadius:'14px',
              background:'rgba(14,18,25,0.8)', border:`1px solid ${e.color}22`,
              textAlign:'left' }}>
              <div style={{ fontSize:'clamp(18px,3vw,22px)', marginBottom:'8px' }}>{e.icon}</div>
              <div style={{ fontSize:'clamp(12px,1.5vw,13px)', fontWeight:700,
                color:e.color, marginBottom:'4px' }}>{e.name}</div>
              <div style={{ fontSize:'clamp(11px,1.5vw,12px)', color:'#5a6a88',
                lineHeight:1.6 }}>{e.style}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:'relative', zIndex:1, textAlign:'center',
        padding:'0 clamp(16px,4vw,48px) 80px' }}>
        <h2 style={{ fontSize:'clamp(22px,4vw,36px)', fontWeight:800,
          letterSpacing:'-1px', marginBottom:'12px' }}>
          Ready to learn differently?
        </h2>
        <p style={{ fontSize:'clamp(13px,2vw,14px)', color:'#5a6a88', marginBottom:'28px' }}>
          Free to use. No credit card needed.
        </p>
        <button onClick={go} style={{ padding:'clamp(12px,2vw,14px) clamp(28px,5vw,40px)',
          borderRadius:'13px', fontSize:'clamp(13px,2vw,15px)', fontWeight:600,
          background:'linear-gradient(135deg,#38bdf8,#818cf8)', border:'none',
          color:'#07090f', cursor:'pointer', fontFamily:"'Outfit',sans-serif",
          boxShadow:'0 0 28px rgba(56,189,248,0.3)' }}>
          Start Learning Now
        </button>
      </section>

      {/* Footer */}
      <footer style={{ position:'relative', zIndex:1, textAlign:'center',
        padding:'clamp(20px,3vw,32px) clamp(16px,4vw,48px)',
        borderTop:'1px solid rgba(255,255,255,0.06)',
        color:'#5a6a88', fontSize:'clamp(11px,1.5vw,13px)', fontFamily:'monospace' }}>
        © 2026 Emotion AI
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
          
    </div>
  );
}

