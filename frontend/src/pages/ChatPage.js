import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import ReactMarkdown from 'react-markdown';

const API = process.env.REACT_APP_BACKEND_URL || 'https://emotion-adpative-ai.onrender.com';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const VOICES = [
  { id: 'en-US-natalie', label: '👩 Female' },
  { id: 'en-US-marcus',  label: '👨 Male' },
];

const EMO = {
  confused:   { icon: '😕', color: '#f472b6', label: 'Confused'   },
  frustrated: { icon: '😤', color: '#f87171', label: 'Frustrated' },
  excited:    { icon: '🤩', color: '#34d399', label: 'Excited'    },
  happy:      { icon: '😊', color: '#fbbf24', label: 'Happy'      },
  sad:        { icon: '😔', color: '#60a5fa', label: 'Sad'        },
  curious:    { icon: '🧐', color: '#a78bfa', label: 'Curious'    },
  bored:      { icon: '😑', color: '#78716c', label: 'Bored'      },
  neutral:    { icon: '😐', color: '#94a3b8', label: 'Neutral'    },
};

const EMO_KW = {
  confused:   ['confused','understand','what','how','why','unclear','lost','stuck','help me',"don't get"],
  frustrated: ['frustrated','annoyed','angry','difficult','hard',"can't",'impossible','ugh','nothing works'],
  excited:    ['excited','amazing','wow','awesome','love','fantastic','cool','interesting','want to know more'],
  happy:      ['happy','good','thanks','thank you','nice','got it','makes sense','clear'],
  sad:        ['sad','depressed','tired','whatever','fine','i guess'],
  curious:    ['curious','wonder','tell me','more about','what if','why does','fascinating'],
  bored:      ['boring','bored','not interested','skip','move on','already know'],
};

function detectEmotion(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [em, kws] of Object.entries(EMO_KW))
    scores[em] = kws.filter(k => lower.includes(k)).length;
  scores.neutral = 0.4;
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

// ── Audio manager (singleton) ────────────────────────────────────
const AudioManager = {
  current: null, synthActive: false,
  play(url, onEnd) {
    this.stopAll();
    const a = new Audio(url);
    this.current = a;
    a.play().catch(() => {});
    a.onended = () => { this.current = null; onEnd?.(); };
    a.onerror = () => { this.current = null; onEnd?.(); };
  },
  speakTTS(text, onEnd) {
    this.stopAll();
    if (!window.speechSynthesis) { onEnd?.(); return; }
    this.synthActive = true;
    const u = new SpeechSynthesisUtterance(text.replace(/[*`#]/g,'').substring(0,600));
    u.rate = 1; u.pitch = 1;
    const vs = speechSynthesis.getVoices();
    const v = vs.find(x => x.lang==='en-US' && x.name.includes('Google')) || vs.find(x => x.lang==='en-US');
    if (v) u.voice = v;
    u.onend  = () => { this.synthActive = false; onEnd?.(); };
    u.onerror= () => { this.synthActive = false; onEnd?.(); };
    speechSynthesis.speak(u);
  },
  stopAll() {
    if (this.current) { try { this.current.pause(); } catch(e){} this.current = null; }
    if (this.synthActive && window.speechSynthesis) { speechSynthesis.cancel(); this.synthActive = false; }
  },
};

// ── Markdown ─────────────────────────────────────────────────────
function MsgContent({ text }) {
  return (
    <ReactMarkdown components={{
      p:      ({ children }) => <p style={{ marginBottom:'8px', lineHeight:1.7 }}>{children}</p>,
      strong: ({ children }) => <strong style={{ color:'#38bdf8' }}>{children}</strong>,
      code:   ({ inline, children }) => inline
        ? <code style={{ fontFamily:'monospace', fontSize:'12px', background:'rgba(56,189,248,0.08)', color:'#38bdf8', padding:'2px 6px', borderRadius:'5px' }}>{children}</code>
        : <pre style={{ background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'10px', padding:'12px', margin:'8px 0', overflowX:'auto', fontFamily:'monospace', fontSize:'12px' }}><code>{children}</code></pre>,
      ul: ({ children }) => <ul style={{ paddingLeft:'18px', margin:'6px 0' }}>{children}</ul>,
      ol: ({ children }) => <ol style={{ paddingLeft:'18px', margin:'6px 0' }}>{children}</ol>,
      li: ({ children }) => <li style={{ marginBottom:'3px', lineHeight:1.65 }}>{children}</li>,
      h1: ({ children }) => <strong style={{ color:'#38bdf8', display:'block', marginBottom:'8px', fontSize:'15px' }}>{children}</strong>,
      h2: ({ children }) => <strong style={{ color:'#818cf8', display:'block', marginBottom:'6px' }}>{children}</strong>,
      h3: ({ children }) => <strong style={{ color:'#38bdf8', display:'block', marginBottom:'6px' }}>{children}</strong>,
    }}>{text}</ReactMarkdown>
  );
}

// ── Thinking bubble ──────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div style={{ display:'flex', gap:'10px', alignSelf:'flex-start', animation:'fadeUp 0.3s ease' }}>
      <div style={{ width:'32px', height:'32px', borderRadius:'9px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.2)' }}>🤖</div>
      <div style={{ padding:'12px 16px', background:'#141c28', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'13px', borderTopLeftRadius:'4px', display:'flex', gap:'5px', alignItems:'center' }}>
        {[0,0.18,0.36].map((d,i) => <span key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#38bdf8', display:'inline-block', animation:`bounceUp 1.1s ease ${d}s infinite` }} />)}
      </div>
    </div>
  );
}

// ── Message ──────────────────────────────────────────────────────
function Message({ msg, isPlaying, onTogglePlay }) {
  const isBot = msg.role === 'bot';
  const emo   = EMO[msg.emotion] || EMO.neutral;
  return (
    <div style={{ display:'flex', gap:'9px', alignSelf: isBot ? 'flex-start' : 'flex-end', flexDirection: isBot ? 'row' : 'row-reverse', maxWidth: 'min(85%, 700px)', animation:'fadeUp 0.3s ease' }}>
      <div style={{ width:'32px', height:'32px', borderRadius:'9px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', background: isBot ? 'rgba(56,189,248,0.1)' : 'rgba(244,114,182,0.1)', border:`1px solid ${isBot ? 'rgba(56,189,248,0.2)' : 'rgba(244,114,182,0.2)'}` }}>
        {isBot ? '🤖' : '👤'}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        <div style={{ fontSize:'10px', color:'#5a6a88', display:'flex', alignItems:'center', gap:'7px', fontFamily:'monospace', justifyContent: isBot ? 'flex-start' : 'flex-end', flexWrap:'wrap' }}>
          {isBot ? 'AI' : 'You'} · {msg.time}
          <span style={{ padding:'2px 8px', borderRadius:'100px', fontSize:'10px', fontWeight:600, color:emo.color, background:`${emo.color}11`, border:`1px solid ${emo.color}33` }}>
            {emo.icon} {emo.label}
          </span>
        </div>
        <div style={{ padding:'11px 15px', borderRadius:'13px', fontSize:'clamp(13px,2vw,14px)', background: isBot ? '#141c28' : 'rgba(56,189,248,0.07)', border:`1px solid ${isBot ? 'rgba(255,255,255,0.07)' : 'rgba(56,189,248,0.12)'}`, borderTopLeftRadius: isBot ? '4px' : '13px', borderTopRightRadius: isBot ? '13px' : '4px' }}>
          <MsgContent text={msg.text} />
          {isBot && (
            <button onClick={onTogglePlay} style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'9px', padding:'5px 13px', background: isPlaying ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.07)', border:`1px solid ${isPlaying ? 'rgba(56,189,248,0.5)' : 'rgba(56,189,248,0.2)'}`, borderRadius:'100px', color:'#38bdf8', fontSize:'11px', cursor:'pointer', fontFamily:'monospace' }}>
              {isPlaying ? '⏸ Playing…' : '▶ Play'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar content ──────────────────────────────────────────────
function SidebarContent({ voice, setVoice, emotion, sendMsg, onClose }) {
  const topics = [
    ['⚛️','Quantum Physics','Explain quantum entanglement simply'],
    ['💻','Recursion','Help me understand recursion in programming'],
    ['📚','French Revolution','What is the French Revolution?'],
    ['📐','Derivatives','Explain calculus derivatives step by step'],
    ['🌱','Photosynthesis','How does photosynthesis work?'],
    ['🤖','Neural Networks','What is machine learning?'],
    ['🍎',"Newton's Laws","Explain Newton's laws of motion"],
    ['🧬','DNA','What is DNA and how does it work?'],
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px', padding:'14px 10px', height:'100%', overflowY:'auto' }}>
      <div style={{ fontSize:'10px', color:'#5a6a88', textTransform:'uppercase', letterSpacing:'1px', fontFamily:'monospace', padding:'4px 8px 2px' }}>Quick Topics</div>
      {topics.map(([icon, label, prompt]) => (
        <button key={label} style={{ padding:'8px 10px', borderRadius:'9px', fontSize:'clamp(11px,1.5vw,12px)', background:'transparent', border:'1px solid rgba(255,255,255,0.06)', color:'#5a6a88', cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif", transition:'all 0.2s', display:'flex', alignItems:'center', gap:'7px' }}
          onClick={() => { sendMsg(prompt); onClose?.(); }}
          onMouseEnter={e => { e.currentTarget.style.background='#141c28'; e.currentTarget.style.color='#e8eef8'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#5a6a88'; }}
        >
          <span>{icon}</span>{label}
        </button>
      ))}

      <div style={{ fontSize:'10px', color:'#5a6a88', textTransform:'uppercase', letterSpacing:'1px', fontFamily:'monospace', padding:'10px 8px 4px' }}>Voice</div>
      {VOICES.map(v => (
        <button key={v.id} style={{ padding:'9px 12px', borderRadius:'9px', fontSize:'clamp(12px,1.5vw,13px)', background: voice===v.id ? 'rgba(56,189,248,0.1)' : 'transparent', border:`1px solid ${voice===v.id ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.08)'}`, color: voice===v.id ? '#38bdf8' : '#5a6a88', cursor:'pointer', textAlign:'left', fontFamily:"'Outfit',sans-serif", transition:'all 0.2s', display:'flex', alignItems:'center', gap:'8px', width:'100%' }}
          onClick={() => setVoice(v.id)}>
          <span style={{ width:7, height:7, borderRadius:'50%', background: voice===v.id ? '#38bdf8' : '#5a6a88', flexShrink:0 }} />
          {v.label}
        </button>
      ))}

      <div style={{ marginTop:'auto', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:'10px', color:'#5a6a88', textTransform:'uppercase', letterSpacing:'1px', fontFamily:'monospace', marginBottom:'8px' }}>Emotion Radar</div>
        {Object.entries(EMO).map(([k, v]) => (
          <div key={k} style={{ marginBottom:'6px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'3px' }}>
              <span style={{ color:'#5a6a88' }}>{v.icon} {v.label}</span>
              <span style={{ color:'#e8eef8', fontFamily:'monospace', fontSize:'10px' }}>{emotion===k ? '85%' : '0%'}</span>
            </div>
            <div style={{ height:'3px', background:'#1b2438', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ height:'100%', borderRadius:'2px', background:v.color, width: emotion===k ? '85%' : '0%', transition:'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────
export default function ChatPage() {
  const { getToken } = useAuth();
  const { user }     = useUser();

  const [messages,   setMessages]   = useState([]);
  const [history,    setHistory]    = useState([]);
  const [input,      setInput]      = useState('');
  const [busy,       setBusy]       = useState(false);
  const [recording,  setRecording]  = useState(false);
  const [emotion,    setEmotion]    = useState('neutral');
  const [vstatus,    setVstatus]    = useState('Press 🎤 to speak, or type below');
  const [voice,      setVoice]      = useState(VOICES[0].id);
  const [pipeState,  setPipeState]  = useState(null);
  const [toast,      setToast]      = useState(null);
  const [playingId,  setPlayingId]  = useState(null);
  const [sideOpen,   setSideOpen]   = useState(false); // mobile drawer
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('edubot-theme') || 'dark');

  // Detect mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
  const themes = {
    dark: {
      '--t-bg':       '#07090f',
      '--t-surface':  '#0e1219',
      '--t-surface2': '#141c28',
      '--t-surface3': '#1b2438',
      '--t-border':   'rgba(255,255,255,0.07)',
      '--t-text':     '#e8eef8',
      '--t-muted':    '#5a6a88',
      '--t-bubble-bot': '#141c28',
      '--t-bubble-user': 'rgba(56,189,248,0.07)',
      '--t-sidebar':  'rgba(14,18,25,0.95)',
      '--t-topbar':   'rgba(7,9,15,0.95)',
      '--t-input':    '#0e1219',
    },
    white: {
      '--t-bg':       '#f8fafc',
      '--t-surface':  '#ffffff',
      '--t-surface2': '#f1f5f9',
      '--t-surface3': '#e2e8f0',
      '--t-border':   'rgba(0,0,0,0.08)',
      '--t-text':     '#0f172a',
      '--t-muted':    '#64748b',
      '--t-bubble-bot': '#f1f5f9',
      '--t-bubble-user': 'rgba(56,189,248,0.08)',
      '--t-sidebar':  'rgba(248,250,252,0.98)',
      '--t-topbar':   'rgba(255,255,255,0.95)',
      '--t-input':    '#ffffff',
    },
    system: {
      '--t-bg':       '',
      '--t-surface':  '',
      '--t-surface2': '',
      '--t-surface3': '',
      '--t-border':   '',
      '--t-text':     '',
      '--t-muted':    '',
      '--t-bubble-bot': '',
      '--t-bubble-user': '',
      '--t-sidebar':  '',
      '--t-topbar':   '',
      '--t-input':    '',
    },
  };

  const selected = themes[theme] || themes.dark;
  const root = document.documentElement;
  Object.entries(selected).forEach(([k, v]) => root.style.setProperty(k, v));
  document.body.style.background = selected['--t-bg'];
  document.body.style.color = selected['--t-text'];
  localStorage.setItem('edubot-theme', theme);
}, [theme]);
  
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const chatRef  = useRef(null);
  const textRef  = useRef(null);
  const recogRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const name = user?.firstName || 'there';
    addBotMsg(
      `**Hey ${name}! Welcome to Emotion AI Bot** \n\nI'm your emotion-aware AI tutor. I detect your emotional state and **adapt my teaching style** to make you understand good.\nSpeak 🎤 or type to get started!`,
      'happy', null, true
    );
  }, []); // eslint-disable-line

  function showToast(msg, type='') { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }

  function addBotMsg(text, emo, audioUrl=null, autoplay=false) {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, role:'bot', text, emotion:emo, audioUrl, time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) }]);
    if (autoplay) {
      setTimeout(() => {
        setPlayingId(id);
        if (audioUrl) AudioManager.play(audioUrl, () => setPlayingId(null));
        else AudioManager.speakTTS(text, () => setPlayingId(null));
      }, 600);
    }
  }

  function addUserMsg(text, emo) {
    setMessages(prev => [...prev, { id: Date.now()+Math.random(), role:'user', text, emotion:emo, time: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) }]);
  }

  function pset(u) { setPipeState(prev => ({ ...(prev||{}), ...u })); }

  function togglePlay(msg) {
    if (playingId === msg.id) { AudioManager.stopAll(); setPlayingId(null); return; }
    AudioManager.stopAll(); setPlayingId(msg.id);
    if (msg.audioUrl) AudioManager.play(msg.audioUrl, () => setPlayingId(null));
    else AudioManager.speakTTS(msg.text, () => setPlayingId(null));
  }

  // ── Mic ──────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (recording) { recogRef.current?.stop(); setRecording(false); setVstatus(''); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Use Chrome/Edge for voice input','err'); return; }
    const r = new SR();
    r.lang='en-US'; r.continuous=false; r.interimResults=true;
    recogRef.current = r;
    r.onresult = e => {
      let fin='', inter='';
      for (let i=e.resultIndex; i<e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else inter += e.results[i][0].transcript;
      }
      const cur = fin||inter;
      setInput(cur); setVstatus('🎤 '+(cur||'Listening…'));
      if (fin) { setRecording(false); setTimeout(() => sendMsg(cur), 200); }
    };
    r.onerror = e => { setRecording(false); if(e.error!=='no-speech') showToast('Mic: '+e.error,'err'); };
    r.onend   = () => setRecording(false);
    r.start(); setRecording(true); setVstatus('🎤 Listening…');
  }, [recording]); // eslint-disable-line

  // ── Send ─────────────────────────────────────────────────────
  const sendMsg = useCallback(async (overrideText) => {
    const text = (overrideText||input).trim();
    if (!text||busy) return;
    setInput('');
    if (textRef.current) textRef.current.style.height='auto';
    setBusy(true);
    AudioManager.stopAll(); setPlayingId(null);
    setPipeState({ voice:'done', emotion:'active', groq:'', murf:'' });

    const emo = detectEmotion(text);
    setEmotion(emo);
    addUserMsg(text, emo);

    const thinkId = Date.now();
    setMessages(prev => [...prev, { id:thinkId, role:'thinking' }]);

    try {
      pset({ emotion:'done', groq:'active' });
      const token = await getToken();

      const chatRes = await fetch(`${API}/api/chat`, {
        method:'POST',
        headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
        body: JSON.stringify({ text, history:history.slice(-8), model:GROQ_MODEL }),
      });

      if (!chatRes.ok) { const e=await chatRes.json().catch(()=>({})); throw new Error(e.error||`Server error ${chatRes.status}`); }
      const { reply, emotion:serverEmo } = await chatRes.json();
      const finalEmo = serverEmo||emo;
      setEmotion(finalEmo);
      pset({ groq:'done', murf:'active' });
      setMessages(prev => prev.filter(m => m.id!==thinkId));

      let audioUrl = null;
      try {
        const ttsRes = await fetch(`${API}/api/tts`, {
          method:'POST',
          headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) },
          body: JSON.stringify({ text:reply, emotion:finalEmo, voiceId:voice }),
        });
        if (ttsRes.ok) { const td=await ttsRes.json(); audioUrl=td.audioUrl||null; }
      } catch(e) { console.warn('TTS:',e); }

      pset({ murf:'done' });
      setHistory(prev => [...prev, { role:'user', content:text }, { role:'assistant', content:reply }]);
      addBotMsg(reply, finalEmo, audioUrl, true);

    } catch(err) {
      setMessages(prev => prev.filter(m => m.id!==thinkId));
      addBotMsg(`⚠️ **Error:** ${err.message}`, 'neutral', null, false);
      showToast(err.message, 'err');
      setPipeState(null);
    }

    setBusy(false);
    setVstatus('');
    setTimeout(() => setPipeState(null), 3000);
  }, [input, busy, history, voice, getToken]); // eslint-disable-line

  const emoData = EMO[emotion]||EMO.neutral;

  const SettingsPanel = () => (
  <>
    {/* Overlay */}
    <div onClick={() => setSettingsOpen(false)} style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }} />

    {/* Panel */}
    <div style={{
      position: 'fixed', top: '68px', right: 'clamp(12px,3vw,20px)',
      zIndex: 201, width: 'clamp(260px, 80vw, 300px)',
      background: '#0e1219', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px', padding: '20px',
      boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      animation: 'slideDown 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <span style={{ fontWeight: 700, fontSize: '15px', color: '#e8eef8' }}>⚙️ Settings</span>
        <button onClick={() => setSettingsOpen(false)} style={{ background: 'none', border: 'none', color: '#5a6a88', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
      </div>

      {/* Appearance */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', color: '#5a6a88', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace', marginBottom: '10px' }}>
          🎨 App Appearance
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { value: 'dark',   label: '🌙 Dark',           desc: 'Dark background' },
            { value: 'white',  label: '☀️ Light',          desc: 'White background' },
            { value: 'system', label: '💻 System Default', desc: 'Follows your device' },
          ].map(opt => (
            <button key={opt.value} onClick={() => setTheme(opt.value)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
              background: theme === opt.value ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${theme === opt.value ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: theme === opt.value ? '#38bdf8' : '#e8eef8',
              fontFamily: "'Outfit',sans-serif", fontSize: '13px',
              transition: 'all 0.2s', textAlign: 'left',
            }}>
              <span>{opt.label}</span>
              <span style={{ fontSize: '11px', color: theme === opt.value ? '#38bdf8' : '#5a6a88' }}>
                {opt.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', marginBottom: '16px' }} />

      {/* Get Help */}
      <a href="mailto:support@edubot.ai" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        color: '#e8eef8', textDecoration: 'none',
        fontSize: '13px', fontFamily: "'Outfit',sans-serif",
        marginBottom: '8px', transition: 'all 0.2s',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
      >
        <span>📧</span>
        <div>
          <div style={{ fontWeight: 600 }}>Get Help</div>
          <div style={{ fontSize: '11px', color: '#5a6a88' }}>Contact support</div>
        </div>
      </a>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '12px 0' }} />

      {/* Sign Out */}
      <button
        onClick={() => { setSettingsOpen(false); window.location.href = '/EmotionAdpative-AI/'; }}
        style={{
          width: '100%', padding: '11px', borderRadius: '10px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: '#f87171', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600,
          fontFamily: "'Outfit',sans-serif",
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.15)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
      >
        🚪 Sign Out
      </button>
    </div>
  </>
  );
  return (
    <div style={{ height:'100vh', background: 'var(--t-bg)', display:'flex', flexDirection:'column', fontFamily:"'Outfit',sans-serif", color:'#e8eef8', overflow:'hidden', position:'relative' }}>

      {/* Ambient */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, background:`radial-gradient(ellipse 55% 35% at 15% 5%, rgba(56,189,248,0.04) 0,transparent 60%), radial-gradient(ellipse 45% 45% at 85% 85%, rgba(129,140,248,0.04) 0,transparent 60%)` }} />

      {/* ── TOPBAR ── */}
      <header style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 clamp(12px,3vw,20px)', height:'clamp(52px,8vw,60px)', borderBottom:'1px solid rgba(255,255,255,0.06)', background: 'var(--t-topbar)', backdropFilter: 'blur(20px)', zIndex:50, position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {/* Hamburger on mobile */}
          {isMobile && (
            <button onClick={() => setSideOpen(o=>!o)} style={{ width:'36px', height:'36px', borderRadius:'9px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'#5a6a88', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
              ☰
            </button>
          )}
          <div style={{ width:'30px', height:'30px', borderRadius:'9px', background:'linear-gradient(135deg,#38bdf8,#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', boxShadow:'0 0 10px rgba(56,189,248,0.3)', flexShrink:0 }}>🎓</div>
          <span style={{ fontSize:'clamp(15px,2.5vw,17px)', fontWeight:800, letterSpacing:'-0.5px', background:'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Eomtion AI</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'clamp(6px,1.5vw,12px)' }}>
          {/* Emotion pill — hide label on very small screens */}
          {/* Model badge — hide on mobile */}
          {!isMobile && (
            <div style={{ padding:'4px 11px', borderRadius:'8px', background:'rgba(56,189,248,0.08)', border:'1px solid rgba(56,189,248,0.2)', color:'#38bdf8', fontSize:'11px', fontFamily:'monospace', whiteSpace:'nowrap' }}>⚡ Llama 3.3 70B</div>
          )}
          <div style={{ fontSize:'11px', color:'#34d399', fontFamily:'monospace', display:'flex', alignItems:'center', gap:'4px' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#34d399', display:'inline-block', animation:'blink 2s infinite' }} />
            {!isMobile && 'LIVE'}
          </div>
            <UserButton afterSignOutUrl="/EmotionAdpative-AI/">
             <UserButton.MenuItems>
               <UserButton.Action
               label="Settings"
               labelIcon={<span>⚙️</span>}
               onClick={() => setSettingsOpen(o => !o)}
                />
             <UserButton.Action
               label="Get Help"
               labelIcon={<span>📧</span>}
               onClick={() => window.open('mailto:support@edubot.ai')}
                />
           </UserButton.MenuItems>
           </UserButton>
        </div>
      </header>

      {/* ── BODY (sidebar + chat) ── */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* Mobile overlay */}
        {isMobile && sideOpen && (
          <div onClick={() => setSideOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:40, backdropFilter:'blur(4px)' }} />
        )}

        {/* Sidebar — fixed drawer on mobile, static on desktop */}
        <aside style={{
          width: isMobile ? 'clamp(240px,75vw,300px)' : '220px',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          background: 'var(--t-sidebar)',
          backdropFilter: 'blur(16px)',
          overflowY: 'auto',
          zIndex: isMobile ? 45 : 1,
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? '0' : 'auto',
          bottom: isMobile ? '0' : 'auto',
          left: isMobile ? (sideOpen ? '0' : '-320px') : 'auto',
          transition: isMobile ? 'left 0.3s ease' : 'none',
          paddingTop: isMobile ? 'clamp(52px,8vw,60px)' : '0',
        }}>
          <SidebarContent voice={voice} setVoice={setVoice} emotion={emotion} sendMsg={sendMsg} onClose={() => setSideOpen(false)} />
        </aside>

        {/* Chat + input */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

          {/* Messages */}
          <div ref={chatRef} style={{ flex:1, overflowY:'auto',background: 'var(--t-bubble-bot)', padding:'clamp(16px,3vw,24px) clamp(12px,3vw,28px)', display:'flex', flexDirection:'column', gap:'16px', scrollbarWidth:'thin', scrollbarColor:'#1b2438 transparent' }}>
            {messages.map(msg =>
              msg.role==='thinking'
                ? <ThinkingBubble key={msg.id} />
                : <Message key={msg.id} msg={msg} isPlaying={playingId===msg.id} onTogglePlay={() => togglePlay(msg)} />
            )}
          </div>

          {/* Pipeline */}
          {pipeState && (
            <div style={{ display:'flex', alignItems:'center', padding:'6px clamp(12px,3vw,28px)', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(14,18,25,0.5)', overflowX:'auto', flexShrink:0 }}>
              {[{id:'voice',label:'🎤'},{id:'emotion',label:'😊'},{id:'groq',label:'⚡Concept Preparing'},{id:'murf',label:'🔊 Voice Generating'}].map((s,i,arr) => (
                <React.Fragment key={s.id}>
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'7px', fontSize:'11px', fontFamily:'monospace', whiteSpace:'nowrap', color: pipeState[s.id]==='active' ? '#38bdf8' : pipeState[s.id]==='done' ? '#34d399' : '#5a6a88', background: pipeState[s.id]==='active' ? 'rgba(56,189,248,0.08)' : 'transparent', transition:'all 0.3s' }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', flexShrink:0 }} />{s.label}
                  </div>
                  {i<arr.length-1 && <span style={{ color:'rgba(255,255,255,0.15)', padding:'0 1px' }}>›</span>}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Input zone */}
          <div style={{ padding:'clamp(10px,2vw,14px) clamp(12px,3vw,28px) clamp(12px,2vw,18px)', borderTop:'1px solid rgba(255,255,255,0.06)', background: 'var(--t-topbar)', backdropFilter:'blur(16px)', flexShrink:0 }}>
            <div style={{ fontSize:'11px', color:'#5a6a88', fontFamily:'monospace', marginBottom:'7px', minHeight:'16px', display:'flex', alignItems:'center', gap:'7px' }}>
              {recording && [0,0.1,0.2,0.3,0.4].map((d,i) => <span key={i} style={{ width:'3px', background:'#38bdf8', borderRadius:'2px', display:'inline-block', animation:`wave 0.7s ease ${d}s infinite` }} />)}
              <span>{vstatus}</span>
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
              <textarea ref={textRef} value={input}
                placeholder="Ask anything…"
                rows={1}
                style={{ flex:1, padding:'clamp(10px,2vw,12px) clamp(12px,2vw,15px)', background: 'var(--t-input)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', color:'#e8eef8', fontFamily:"'Outfit',sans-serif", fontSize:'clamp(13px,2vw,14px)', outline:'none', resize:'none', minHeight:'46px', maxHeight:'120px', lineHeight:1.55, transition:'border-color 0.2s' }}
                onChange={e => { setInput(e.target.value); e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,120)+'px'; }}
                onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg();} }}
                onFocus={e => e.target.style.borderColor='rgba(56,189,248,0.35)'}
                onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.08)'}
              />
              <button style={{ width:'clamp(42px,7vw,48px)', height:'clamp(42px,7vw,46px)', borderRadius:'11px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, transition:'all 0.2s', background: recording ? 'rgba(244,114,182,0.12)' : '#141c28', borderWidth:'1px', borderStyle:'solid', borderColor: recording ? '#f472b6' : 'rgba(255,255,255,0.08)', color: recording ? '#f472b6' : '#5a6a88', animation: recording ? 'micpulse 1s ease infinite' : 'none' }} onClick={toggleMic}>
                {recording ? '⏹' : '🎤'}
              </button>
              <button style={{ width:'clamp(42px,7vw,48px)', height:'clamp(42px,7vw,46px)', borderRadius:'11px', border:'none', cursor: busy ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, transition:'all 0.2s', background: busy ? 'rgba(56,189,248,0.1)' : 'linear-gradient(135deg,#38bdf8,#818cf8)', color: busy ? '#38bdf8' : '#07090f', boxShadow: busy ? 'none' : '0 0 14px rgba(56,189,248,0.3)' }} onClick={() => sendMsg()} disabled={busy}>
                {busy ? '⏳' : '➤'}
              </button>
            </div>
          {/* Disclaimer */}
         <div style={{
              fontSize: '11px',
              color: '#5a6a88',
              background: 'rgba(251,191,36,0.06)',
              borderRadius: '8px',
              padding: '7px 12px',
              marginBottom: '8px',
              marginTop: '8px',
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
          }}>
          <span>Emotion detection is AI-based and may not always be accurate, it can make mistakes. Feel free to clarify your mood. Please double check responses</span>
         </div>
         </div>

        </div>
      </div>

      {/* Settings Panel */}
        {settingsOpen && <SettingsPanel />}
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%)', padding:'8px 16px', borderRadius:'10px', background:'#0e1219', fontSize:'13px', zIndex:999, border: toast.type==='err' ? '1px solid rgba(248,113,113,0.35)' : '1px solid rgba(52,211,153,0.35)', color: toast.type==='err' ? '#f87171' : '#34d399', animation:'fadeUp 0.3s ease', whiteSpace:'nowrap' }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes wave     { 0%,100%{height:4px} 50%{height:13px} }
        @keyframes micpulse { 0%,100%{box-shadow:0 0 0 0 rgba(244,114,182,0.4)} 50%{box-shadow:0 0 0 8px rgba(244,114,182,0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translate(-50%,8px)} to{opacity:1;transform:translate(-50%,0)} }
        @keyframes bounceUp { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        :root {
  --t-bg: #07090f;
  --t-surface: #0e1219;
  --t-surface2: #141c28;
  --t-surface3: #1b2438;
  --t-border: rgba(255,255,255,0.07);
  --t-text: #e8eef8;
  --t-muted: #5a6a88;
  --t-bubble-bot: #141c28;
  --t-bubble-user: rgba(56,189,248,0.07);
  --t-sidebar: rgba(14,18,25,0.95);
  --t-topbar: rgba(7,9,15,0.95);
  --t-input: #0e1219;
}

/* Theme transitions */
*, *::before, *::after {
  transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease !important;
}
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1b2438; border-radius: 2px; }
        textarea { -webkit-appearance: none; }
      `}</style>
    </div>
  );
}
