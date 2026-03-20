import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

// ── Backend URL ──────────────────────────────────────────────────
const API = process.env.REACT_APP_BACKEND_URL || 'https://YOUR-APP.onrender.com';

// ── Fixed model ──────────────────────────────────────────────────
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// ── Only 2 voices ────────────────────────────────────────────────
const VOICES = [
  { id: 'en-US-natalie', label: '👩 Female (Natalie)' },
  { id: 'en-US-marcus',  label: '👨 Male (Marcus)'   },
];

// ── Emotion config ───────────────────────────────────────────────
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

// ── Styles ───────────────────────────────────────────────────────
const S = {
  shell: {
    height: '100vh', background: '#07090f', display: 'grid',
    gridTemplateColumns: '220px 1fr', gridTemplateRows: '60px 1fr',
    fontFamily: "'Outfit', sans-serif", color: '#e8eef8', overflow: 'hidden',
  },
  topbar: {
    gridColumn: '1/-1', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(7,9,15,0.95)', backdropFilter: 'blur(20px)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '9px' },
  brandMark: {
    width: '30px', height: '30px', borderRadius: '9px',
    background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
    boxShadow: '0 0 12px rgba(56,189,248,0.3)',
  },
  brandName: {
    fontSize: '17px', fontWeight: 800, letterSpacing: '-0.5px',
    background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
  },
  topRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  emoPill: {
    display: 'flex', alignItems: 'center', gap: '7px',
    padding: '5px 13px', borderRadius: '100px',
    background: '#0e1219', border: '1px solid rgba(255,255,255,0.08)',
    fontSize: '12px', transition: 'all 0.4s',
  },
  emoDot: { width: '7px', height: '7px', borderRadius: '50%', transition: 'all 0.4s' },
  modelBadge: {
    padding: '5px 12px', borderRadius: '8px',
    background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
    color: '#38bdf8', fontSize: '11px', fontFamily: "'Space Mono', monospace",
    letterSpacing: '0.3px',
  },
  sidebar: {
    borderRight: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(14,18,25,0.7)', backdropFilter: 'blur(12px)',
    display: 'flex', flexDirection: 'column', padding: '14px 10px',
    gap: '5px', overflowY: 'auto',
  },
  sideLabel: {
    fontSize: '10px', color: '#5a6a88', textTransform: 'uppercase',
    letterSpacing: '1px', fontFamily: "'Space Mono', monospace",
    padding: '8px 8px 4px',
  },
  chip: {
    padding: '8px 10px', borderRadius: '9px', fontSize: '12px',
    background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
    color: '#5a6a88', cursor: 'pointer', textAlign: 'left',
    fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: '7px',
  },
  voiceBtn: {
    padding: '9px 12px', borderRadius: '9px', fontSize: '13px',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer', textAlign: 'left',
    fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
  },
  main: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chat: {
    flex: 1, overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: '18px',
    scrollbarWidth: 'thin', scrollbarColor: '#1b2438 transparent',
  },
  inputZone: {
    padding: '12px 28px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(7,9,15,0.8)', backdropFilter: 'blur(16px)',
  },
  vstatus: {
    fontSize: '11.5px', color: '#5a6a88', fontFamily: "'Space Mono', monospace",
    marginBottom: '8px', minHeight: '18px', display: 'flex', alignItems: 'center', gap: '8px',
  },
  irow: { display: 'flex', gap: '9px', alignItems: 'flex-end' },
  textarea: {
    flex: 1, padding: '12px 15px', background: '#0e1219',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
    color: '#e8eef8', fontFamily: "'Outfit', sans-serif", fontSize: '14px',
    outline: 'none', resize: 'none', minHeight: '48px', maxHeight: '120px',
    lineHeight: 1.55, transition: 'border-color 0.2s',
  },
  ibtn: {
    width: '48px', height: '48px', borderRadius: '11px', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '19px', flexShrink: 0, transition: 'all 0.2s',
  },
  pipeline: {
    display: 'flex', alignItems: 'center',
    padding: '6px 28px', borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(14,18,25,0.5)', overflowX: 'auto',
    transition: 'opacity 0.3s',
  },
  pstep: {
    display: 'flex', alignItems: 'center', gap: '5px',
    padding: '4px 10px', borderRadius: '7px', fontSize: '11px',
    fontFamily: "'Space Mono', monospace", color: '#5a6a88',
    transition: 'all 0.3s', whiteSpace: 'nowrap',
  },
};

// ── Markdown renderer ────────────────────────────────────────────
function MsgContent({ text }) {
  return (
    <ReactMarkdown components={{
      p: ({ children }) => <p style={{ marginBottom: '8px', lineHeight: 1.7 }}>{children}</p>,
      strong: ({ children }) => <strong style={{ color: '#38bdf8' }}>{children}</strong>,
      code: ({ inline, children }) => inline
        ? <code style={{ fontFamily: 'monospace', fontSize: '12px', background: 'rgba(56,189,248,0.08)', color: '#38bdf8', padding: '2px 7px', borderRadius: '5px' }}>{children}</code>
        : <pre style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px', margin: '10px 0', overflowX: 'auto', fontFamily: 'monospace', fontSize: '12px' }}><code>{children}</code></pre>,
      ul: ({ children }) => <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>{children}</ul>,
      ol: ({ children }) => <ol style={{ paddingLeft: '20px', margin: '6px 0' }}>{children}</ol>,
      li: ({ children }) => <li style={{ marginBottom: '4px', lineHeight: 1.65 }}>{children}</li>,
      h1: ({ children }) => <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '8px', fontSize: '15px' }}>{children}</strong>,
      h2: ({ children }) => <strong style={{ color: '#818cf8', display: 'block', marginBottom: '6px' }}>{children}</strong>,
      h3: ({ children }) => <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '6px' }}>{children}</strong>,
    }}>
      {text}
    </ReactMarkdown>
  );
}

// ── Global audio manager — only ONE playing at a time ────────────
const AudioManager = {
  current: null,
  currentSynth: false,
  play(url, onEnd) {
    this.stopAll();
    const a = new Audio(url);
    this.current = a;
    this.currentSynth = false;
    a.play().catch(() => {});
    a.onended = () => { this.current = null; onEnd && onEnd(); };
    a.onerror = () => { this.current = null; onEnd && onEnd(); };
  },
  speakTTS(text, onEnd) {
    this.stopAll();
    if (!window.speechSynthesis) { onEnd && onEnd(); return; }
    this.currentSynth = true;
    const u = new SpeechSynthesisUtterance(text.replace(/[*`#]/g, '').substring(0, 600));
    u.rate = 1; u.pitch = 1;
    const voices = speechSynthesis.getVoices();
    const v = voices.find(x => x.lang === 'en-US' && x.name.includes('Google')) || voices.find(x => x.lang === 'en-US');
    if (v) u.voice = v;
    u.onend  = () => { this.currentSynth = false; onEnd && onEnd(); };
    u.onerror= () => { this.currentSynth = false; onEnd && onEnd(); };
    speechSynthesis.speak(u);
  },
  stopAll() {
    if (this.current) { try { this.current.pause(); this.current.currentTime = 0; } catch(e){} this.current = null; }
    if (this.currentSynth && window.speechSynthesis) { speechSynthesis.cancel(); this.currentSynth = false; }
  },
};

// ── Main Component ───────────────────────────────────────────────
export default function ChatPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [messages, setMessages]   = useState([]);
  const [history, setHistory]     = useState([]);
  const [input, setInput]         = useState('');
  const [busy, setBusy]           = useState(false);
  const [recording, setRecording] = useState(false);
  const [emotion, setEmotion]     = useState('neutral');
  const [vstatus, setVstatus]     = useState('Press 🎤 to speak, or type below');
  const [voice, setVoice]         = useState(VOICES[0].id);
  const [pipeState, setPipeState] = useState(null);
  const [toast, setToast]         = useState(null);
  const [playingId, setPlayingId] = useState(null); // which message is playing

  const chatRef  = useRef(null);
  const textRef  = useRef(null);
  const recogRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const name = user?.firstName || 'there';
    addBotMsg(
      `**Hey ${name}! Welcome to Emotion AI Bot** 🎓\n\nI'm your emotion-aware AI tutor. I detect your emotional state and **adapt my teaching style** to make you understand good.\nSpeak 🎤 or type to get started!`,
      'happy', null, true // autoplay welcome
    );
  }, []); // eslint-disable-line

  function showToast(msg, type = '') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // autoplay = true means play immediately when added
  function addBotMsg(text, emo, audioUrl = null, autoplay = false) {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, {
      id, role: 'bot', text, emotion: emo, audioUrl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
    // auto-play after a short delay so audio element is ready
    if (autoplay) {
      setTimeout(() => {
        if (audioUrl) {
          setPlayingId(id);
          AudioManager.play(audioUrl, () => setPlayingId(null));
        } else {
          setPlayingId(id);
          AudioManager.speakTTS(text, () => setPlayingId(null));
        }
      }, 600);
    }
  }

  function addUserMsg(text, emo) {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(), role: 'user', text, emotion: emo,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }

  function pset(updates) { setPipeState(prev => ({ ...(prev || {}), ...updates })); }

  // ── Toggle play for a message ──────────────────────────────────
  function togglePlay(msg) {
    if (playingId === msg.id) {
      AudioManager.stopAll();
      setPlayingId(null);
      return;
    }
    AudioManager.stopAll();
    setPlayingId(msg.id);
    if (msg.audioUrl) {
      AudioManager.play(msg.audioUrl, () => setPlayingId(null));
    } else {
      AudioManager.speakTTS(msg.text, () => setPlayingId(null));
    }
  }

  // ── Speech recognition ─────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (recording) { recogRef.current?.stop(); setRecording(false); setVstatus('Press 🎤 to speak, or type below'); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Use Chrome/Edge for voice input', 'err'); return; }
    const r = new SR();
    r.lang = 'en-US'; r.continuous = false; r.interimResults = true;
    recogRef.current = r;
    r.onresult = e => {
      let fin = '', inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else inter += e.results[i][0].transcript;
      }
      const cur = fin || inter;
      setInput(cur);
      setVstatus('🎤 ' + (cur || 'Listening…'));
      if (fin) { setRecording(false); setTimeout(() => sendMsg(cur), 200); }
    };
    r.onerror = e => { setRecording(false); if (e.error !== 'no-speech') showToast('Mic: ' + e.error, 'err'); };
    r.onend   = () => setRecording(false);
    r.start(); setRecording(true); setVstatus('🎤 Listening…');
  }, [recording]); // eslint-disable-line

  // ── Send message ───────────────────────────────────────────────
  const sendMsg = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || busy) return;
    setInput('');
    if (textRef.current) textRef.current.style.height = 'auto';
    setBusy(true);
    AudioManager.stopAll(); setPlayingId(null);
    setPipeState({ voice: 'done', emotion: 'active', groq: '', murf: '' });

    const emo = detectEmotion(text);
    setEmotion(emo);
    addUserMsg(text, emo);

    const thinkId = Date.now();
    setMessages(prev => [...prev, { id: thinkId, role: 'thinking' }]);

    try {
      pset({ emotion: 'done', groq: 'active' });
      const token = await getToken();

      // 1. Chat
      const chatRes = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, history: history.slice(-8), model: GROQ_MODEL }),
      });

      if (!chatRes.ok) {
        const err = await chatRes.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${chatRes.status}`);
      }

      const { reply, emotion: serverEmo } = await chatRes.json();
      const finalEmo = serverEmo || emo;
      setEmotion(finalEmo);
      pset({ groq: 'done', murf: 'active' });
      setMessages(prev => prev.filter(m => m.id !== thinkId));

      // 2. TTS
      let audioUrl = null;
      try {
        const ttsRes = await fetch(`${API}/api/tts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: reply, emotion: finalEmo, voiceId: voice }),
        });
        if (ttsRes.ok) { const td = await ttsRes.json(); audioUrl = td.audioUrl || null; }
      } catch (e) { console.warn('TTS non-fatal:', e); }

      pset({ murf: 'done' });
      setHistory(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: reply }]);

      // Add message and AUTO-PLAY immediately
      addBotMsg(reply, finalEmo, audioUrl, true);

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== thinkId));
      addBotMsg(`⚠️ **Error:** ${err.message}`, 'neutral', null, false);
      showToast(err.message, 'err');
      setPipeState(null);
    }

    setBusy(false);
    setVstatus('Press 🎤 to speak, or type below');
    setTimeout(() => setPipeState(null), 3000);
  }, [input, busy, history, voice, getToken]); // eslint-disable-line

  const emoData = EMO[emotion] || EMO.neutral;

  return (
    <div style={S.shell}>
      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 55% 35% at 15% 5%, rgba(56,189,248,0.04) 0, transparent 60%),
          radial-gradient(ellipse 45% 45% at 85% 85%, rgba(129,140,248,0.04) 0, transparent 60%)` }} />

      {/* Topbar */}
      <header style={S.topbar}>
        <a href="https://nareshn141819.github.io/EmotionAdpative-AI/">
          <div style={S.brand}>
            <div style={S.brandMark}>🎓</div>
            <div style={S.brandName}>AI Assist</div>
          </div>
        </a>
        <div style={S.topRight}>
          {/* Emotion pill */}

        
          {/* Fixed model badge */}
          <div style={S.modelBadge}>⚡ Llama 3.3 70B</div>
          {/* Live indicator */}
          <div style={{ fontSize: '11px', color: '#34d399', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'blink 2s infinite' }} />
            LIVE
          </div>
          <UserButton afterSignOutUrl="/#/" />
        </div>
      </header>

      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sideLabel}>Quick Topics</div>
        {[
          ['⚛️','Quantum Physics','Explain quantum entanglement simply'],
          ['💻','Recursion','Help me understand recursion in programming'],
          ['📚','French Revolution','What is the French Revolution?'],
          ['📐','Derivatives','Explain calculus derivatives step by step'],
          ['🌱','Photosynthesis','How does photosynthesis work?'],
          ['🤖','Neural Networks','What is machine learning?'],
          ['🍎',"Newton's Laws","Explain Newton's laws of motion"],
          ['🧬','DNA','What is DNA and how does it work?'],
        ].map(([icon, label, prompt]) => (
          <button key={label} style={S.chip}
            onClick={() => sendMsg(prompt)}
            onMouseEnter={e => { e.currentTarget.style.background = '#141c28'; e.currentTarget.style.color = '#e8eef8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5a6a88'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <span>{icon}</span>{label}
          </button>
        ))}

        {/* Voice selector — only 2 options */}
        <div style={{ ...S.sideLabel, marginTop: '8px' }}>Voice</div>
        {VOICES.map(v => (
          <button key={v.id} style={{
            ...S.voiceBtn,
            background: voice === v.id ? 'rgba(56,189,248,0.1)' : 'transparent',
            borderColor: voice === v.id ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.08)',
            color: voice === v.id ? '#38bdf8' : '#5a6a88',
          }} onClick={() => setVoice(v.id)}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: voice === v.id ? '#38bdf8' : '#5a6a88', flexShrink: 0 }} />
            {v.label}
          </button>
        ))}

        {/* Emotion radar */}
        <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={S.sideLabel}>Emotion </div>
          {Object.entries(EMO).map(([k, v]) => (
            <div key={k} style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                <span style={{ color: '#5a6a88' }}>{v.icon} {v.label}</span>
                <span style={{ color: '#e8eef8', fontFamily: 'monospace', fontSize: '10px' }}>{emotion === k ? '85%' : '0%'}</span>
              </div>
              <div style={{ height: '3px', background: '#1b2438', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: v.color, width: emotion === k ? '85%' : '0%', transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <div ref={chatRef} style={S.chat}>
          {messages.map(msg =>
            msg.role === 'thinking'
              ? <ThinkingBubble key={msg.id} />
              : <Message key={msg.id} msg={msg} isPlaying={playingId === msg.id} onTogglePlay={() => togglePlay(msg)} />
          )}
        </div>

        {/* Pipeline */}
        {pipeState && (
          <div style={S.pipeline}>
            {[
              { id: 'voice',   label: '🎤 Voice'   },
              { id: 'emotion', label: '😊 Emotion'  }, 
              { id: 'groq', label: '🧠 Concept Preparing' },
              { id: 'murf', label: '🔊 Audio generating' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.id}>
                <div style={{
                  ...S.pstep,
                  ...(pipeState[s.id] === 'active' ? { color: '#38bdf8', background: 'rgba(56,189,248,0.08)' } : {}),
                  ...(pipeState[s.id] === 'done'   ? { color: '#34d399' } : {}),
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                  {s.label}
                </div>
                {i < arr.length - 1 && <div style={{ color: 'rgba(255,255,255,0.15)', padding: '0 2px' }}>›</div>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={S.inputZone}>
          <div style={S.vstatus}>
            {recording && [0,0.1,0.2,0.3,0.4].map((d,i) => (
              <span key={i} style={{ width:'3px', background:'#38bdf8', borderRadius:'2px', display:'inline-block', animation:`wave 0.7s ease ${d}s infinite` }} />
            ))}
            {vstatus}
          </div>
          <div style={S.irow}>
            <textarea ref={textRef} style={S.textarea}
              value={input}
              placeholder="Ask anything… I'll teach based on how you're feeling"
              rows={1}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
              onFocus={e => e.target.style.borderColor = 'rgba(56,189,248,0.35)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
            <button style={{
              ...S.ibtn,
              background: recording ? 'rgba(244,114,182,0.12)' : '#141c28',
              border: `1px solid ${recording ? '#f472b6' : 'rgba(255,255,255,0.08)'}`,
              color: recording ? '#f472b6' : '#5a6a88',
              animation: recording ? 'micpulse 1s ease infinite' : 'none',
            }} onClick={toggleMic}>
              {recording ? '⏹' : '🎤'}
            </button>
            <button style={{
              ...S.ibtn,
              background: busy ? 'rgba(56,189,248,0.1)' : 'linear-gradient(135deg, #38bdf8, #818cf8)',
              color: busy ? '#38bdf8' : '#07090f',
              boxShadow: busy ? 'none' : '0 0 16px rgba(56,189,248,0.3)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }} onClick={() => sendMsg()} disabled={busy}>
              {busy ? '⏳' : '➤'}
            </button>
            <p>EmotionAdaptive AI can make mistakes.Please double check responses</p>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)',
          padding: '9px 18px', borderRadius: '10px', background: '#0e1219', fontSize: '13px', zIndex: 999,
          border: toast.type === 'err' ? '1px solid rgba(248,113,113,0.35)' : '1px solid rgba(52,211,153,0.35)',
          color: toast.type === 'err' ? '#f87171' : '#34d399',
          animation: 'fadeUp 0.3s ease',
        }}>{toast.msg}</div>
      )}

      <style>{`
        @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes wave     { 0%,100%{height:4px} 50%{height:14px} }
        @keyframes micpulse { 0%,100%{box-shadow:0 0 0 0 rgba(244,114,182,0.4)} 50%{box-shadow:0 0 0 8px rgba(244,114,182,0)} }
        @keyframes fadeUp   { from{opacity:0;transform:translate(-50%,8px)} to{opacity:1;transform:translate(-50%,0)} }
        @keyframes bounceUp { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }
        @keyframes spin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1b2438; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ── Thinking bubble ──────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div style={{ display:'flex', gap:'10px', alignSelf:'flex-start', animation:'fadeUp 0.3s ease' }}>
      <div style={{ width:'34px', height:'34px', borderRadius:'10px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', background:'rgba(56,189,248,0.1)', border:'1px solid rgba(56,189,248,0.2)' }}>🤖</div>
      <div style={{ padding:'13px 17px', background:'#141c28', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px', borderTopLeftRadius:'4px', display:'flex', gap:'5px', alignItems:'center' }}>
        {[0,0.18,0.36].map((d,i) => (
          <span key={i} style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#38bdf8', display:'inline-block', animation:`bounceUp 1.1s ease ${d}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────
function Message({ msg, isPlaying, onTogglePlay }) {
  const isBot = msg.role === 'bot';
  const emo   = EMO[msg.emotion] || EMO.neutral;

  return (
    <div style={{ display:'flex', gap:'10px', alignSelf: isBot ? 'flex-start' : 'flex-end', flexDirection: isBot ? 'row' : 'row-reverse', maxWidth:'82%', animation:'fadeUp 0.3s ease' }}>
      <div style={{ width:'34px', height:'34px', borderRadius:'10px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', background: isBot ? 'rgba(56,189,248,0.1)' : 'rgba(244,114,182,0.1)', border:`1px solid ${isBot ? 'rgba(56,189,248,0.2)' : 'rgba(244,114,182,0.2)'}` }}>
        {isBot ? '🤖' : '👤'}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
        <div style={{ fontSize:'10.5px', color:'#5a6a88', display:'flex', alignItems:'center', gap:'8px', fontFamily:'monospace', justifyContent: isBot ? 'flex-start' : 'flex-end' }}>
          {isBot ? 'EduBot' : 'You'} · {msg.time}
          <span style={{ padding:'2px 9px', borderRadius:'100px', fontSize:'10px', fontWeight:600, color:emo.color, background:`${emo.color}11`, border:`1px solid ${emo.color}33` }}>
            {emo.icon} {emo.label}
          </span>
        </div>
        <div style={{ padding:'12px 16px', borderRadius:'14px', fontSize:'14px', background: isBot ? '#141c28' : 'rgba(56,189,248,0.07)', border:`1px solid ${isBot ? 'rgba(255,255,255,0.07)' : 'rgba(56,189,248,0.12)'}`, borderTopLeftRadius: isBot ? '4px' : '14px', borderTopRightRadius: isBot ? '14px' : '4px' }}>
          <MsgContent text={msg.text} />
          {isBot && (
            <button
              onClick={onTogglePlay}
              style={{
                display:'inline-flex', alignItems:'center', gap:'6px',
                marginTop:'10px', padding:'5px 14px',
                background: isPlaying ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.07)',
                border:`1px solid ${isPlaying ? 'rgba(56,189,248,0.5)' : 'rgba(56,189,248,0.2)'}`,
                borderRadius:'100px', color:'#38bdf8', fontSize:'11.5px',
                cursor:'pointer', fontFamily:'monospace', transition:'all 0.2s',
                animation: isPlaying ? 'glow 1s ease infinite alternate' : 'none',
              }}
            >
              {isPlaying ? '⏸ Playing…' : '▶ Play'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
