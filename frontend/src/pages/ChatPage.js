import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

// ── Backend URL ──────────────────────────────────────────────────
const API = process.env.REACT_APP_BACKEND_URL || 'https://YOUR-APP.onrender.com';

// ── Emotion config ───────────────────────────────────────────────
const EMO = {
  confused:   { icon: '😕', color: '#f472b6', label: 'Confused' },
  frustrated: { icon: '😤', color: '#f87171', label: 'Frustrated' },
  excited:    { icon: '🤩', color: '#34d399', label: 'Excited' },
  happy:      { icon: '😊', color: '#fbbf24', label: 'Happy' },
  sad:        { icon: '😔', color: '#60a5fa', label: 'Sad' },
  curious:    { icon: '🧐', color: '#a78bfa', label: 'Curious' },
  bored:      { icon: '😑', color: '#78716c', label: 'Bored' },
  neutral:    { icon: '😐', color: '#94a3b8', label: 'Neutral' },
};

const EMO_KW = {
  confused:   ["confused","understand","what","how","why","unclear","lost","stuck","help me","explain","don't get"],
  frustrated: ["frustrated","annoyed","angry","difficult","hard","can't","impossible","ugh","nothing works"],
  excited:    ["excited","amazing","wow","awesome","love","fantastic","cool","interesting","want to know more"],
  happy:      ["happy","good","thanks","thank you","nice","got it","makes sense","clear"],
  sad:        ["sad","depressed","tired","whatever","fine","i guess"],
  curious:    ["curious","wonder","tell me","more about","what if","why does","fascinating"],
  bored:      ["boring","bored","not interested","skip","move on","already know"],
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
    gridTemplateColumns: '240px 1fr', gridTemplateRows: '60px 1fr',
    fontFamily: "'Outfit', sans-serif", color: '#e8eef8', overflow: 'hidden',
  },
  topbar: {
    gridColumn: '1/-1', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '0 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(7,9,15,0.9)', backdropFilter: 'blur(20px)',
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
  modelSel: {
    padding: '5px 10px', borderRadius: '8px',
    background: '#141c28', border: '1px solid rgba(255,255,255,0.08)',
    color: '#5a6a88', fontSize: '11px', fontFamily: "'Space Mono', monospace",
    cursor: 'pointer', outline: 'none',
  },
  sidebar: {
    borderRight: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(14,18,25,0.7)', backdropFilter: 'blur(12px)',
    display: 'flex', flexDirection: 'column', padding: '16px 12px',
    gap: '6px', overflowY: 'auto',
  },
  sideLabel: {
    fontSize: '10px', color: '#5a6a88', textTransform: 'uppercase',
    letterSpacing: '1px', fontFamily: "'Space Mono', monospace",
    padding: '8px 8px 4px',
  },
  chip: {
    padding: '8px 12px', borderRadius: '9px', fontSize: '12.5px',
    background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
    color: '#5a6a88', cursor: 'pointer', textAlign: 'left',
    fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: '7px',
  },
  main: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  chat: {
    flex: 1, overflowY: 'auto', padding: '24px 28px',
    display: 'flex', flexDirection: 'column', gap: '18px',
    scrollbarWidth: 'thin', scrollbarColor: '#1b2438 transparent',
  },
  inputZone: {
    padding: '14px 28px 18px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(7,9,15,0.8)', backdropFilter: 'blur(16px)',
  },
  vstatus: {
    fontSize: '11.5px', color: '#5a6a88', fontFamily: "'Space Mono', monospace",
    marginBottom: '9px', minHeight: '18px', display: 'flex', alignItems: 'center', gap: '8px',
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
    display: 'flex', alignItems: 'center', gap: '0',
    padding: '8px 28px', borderTop: '1px solid rgba(255,255,255,0.05)',
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
    <ReactMarkdown
      components={{
        p: ({ children }) => <p style={{ marginBottom: '8px', lineHeight: 1.7 }}>{children}</p>,
        strong: ({ children }) => <strong style={{ color: '#38bdf8' }}>{children}</strong>,
        code: ({ inline, children }) => inline
          ? <code style={{ fontFamily: "'Space Mono'", fontSize: '12px', background: 'rgba(56,189,248,0.08)', color: '#38bdf8', padding: '2px 7px', borderRadius: '5px' }}>{children}</code>
          : <pre style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '14px', margin: '10px 0', overflowX: 'auto', fontFamily: "'Space Mono'", fontSize: '12px' }}><code>{children}</code></pre>,
        ul: ({ children }) => <ul style={{ paddingLeft: '20px', margin: '6px 0' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: '20px', margin: '6px 0' }}>{children}</ol>,
        li: ({ children }) => <li style={{ marginBottom: '4px', lineHeight: 1.65 }}>{children}</li>,
        h1: ({ children }) => <h3 style={{ color: '#38bdf8', marginBottom: '8px', fontWeight: 700 }}>{children}</h3>,
        h2: ({ children }) => <h4 style={{ color: '#818cf8', marginBottom: '6px', fontWeight: 600 }}>{children}</h4>,
        h3: ({ children }) => <strong style={{ color: '#38bdf8', display: 'block', marginBottom: '6px' }}>{children}</strong>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function ChatPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [emotion, setEmotion] = useState('neutral');
  const [vstatus, setVstatus] = useState('Press 🎤 to speak, or type below');
  const [model, setModel] = useState('llama-3.3-70b-versatile');
  const [voice, setVoice] = useState('en-US-natalie');
  const [pipeState, setPipeState] = useState(null); // null | {voice,emotion,groq,murf}
  const [toast, setToast] = useState(null);

  const chatRef = useRef(null);
  const textRef = useRef(null);
  const recogRef = useRef(null);

  // scroll to bottom
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // welcome message
  useEffect(() => {
    const name = user?.firstName || 'there';
    addBotMsg(
      `**Hey ${name}! Welcome to EduBot** 🎓\n\nI'm your emotion-aware AI tutor. I detect your emotional state from your words and **adapt my teaching style** accordingly.\n\n- 😕 **Confused?** I break it down step-by-step\n- 🤩 **Excited?** I go deep with advanced concepts  \n- 😤 **Frustrated?** I stay patient and find a new angle\n- 🧐 **Curious?** I feed you rich, fascinating detail\n\nSpeak 🎤 or type to get started. What would you like to learn?`,
      'happy'
    );
  }, []); // eslint-disable-line

  function showToast(msg, type = '') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function addBotMsg(text, emo, audioUrl = null) {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(), role: 'bot', text, emotion: emo, audioUrl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }

  function addUserMsg(text, emo) {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(), role: 'user', text, emotion: emo,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  }

  // pipeline step helper
  function pset(updates) {
    setPipeState(prev => ({ ...(prev || {}), ...updates }));
  }

  // ── Speech recognition ────────────────────────────────
  const toggleMic = useCallback(() => {
    if (recording) {
      recogRef.current?.stop();
      setRecording(false);
      setVstatus('Press 🎤 to speak, or type below');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Speech recognition not supported in Chrome/Edge', 'err'); return; }

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

    r.start();
    setRecording(true);
    setVstatus('🎤 Listening…');
  }, [recording]); // eslint-disable-line

  // ── Send message ──────────────────────────────────────
  const sendMsg = useCallback(async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || busy) return;

    setInput('');
    if (textRef.current) textRef.current.style.height = 'auto';
    setBusy(true);
    setPipeState({ voice: 'done', emotion: 'active', groq: '', murf: '' });

    const emo = detectEmotion(text);
    setEmotion(emo);
    addUserMsg(text, emo);

    const thinkId = Date.now();
    setMessages(prev => [...prev, { id: thinkId, role: 'thinking' }]);

    try {
      // voice + emotion done
      pset({ emotion: 'done', groq: 'active' });

      const token = await getToken();

      // 1. Chat
      const chatRes = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, history: history.slice(-8), model }),
      });

      if (!chatRes.ok) {
        const err = await chatRes.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${chatRes.status}`);
      }

      const { reply, emotion: serverEmo } = await chatRes.json();
      const finalEmo = serverEmo || emo;
      setEmotion(finalEmo);
      pset({ groq: 'done', murf: 'active' });

      // remove thinking
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
        if (ttsRes.ok) {
          const td = await ttsRes.json();
          audioUrl = td.audioUrl || null;
        }
      } catch (e) { console.warn('TTS non-fatal:', e); }

      pset({ murf: 'done' });

      // save history
      setHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ]);

      addBotMsg(reply, finalEmo, audioUrl);

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== thinkId));
      addBotMsg(`⚠️ **Error:** ${err.message}\n\nCheck that the backend is running and your API keys are set on Render.`, 'neutral');
      showToast(err.message, 'err');
      setPipeState(null);
    }

    setBusy(false);
    setVstatus('Press 🎤 to speak, or type below');
    setTimeout(() => setPipeState(null), 3000);
  }, [input, busy, history, model, voice, getToken]); // eslint-disable-line

  // ── Audio ──────────────────────────────────────────────
  function playAudio(url, btnRef) {
    const a = new Audio(url);
    if (btnRef.current) btnRef.current.textContent = '⏸ Playing…';
    a.play();
    a.onended = () => { if (btnRef.current) btnRef.current.textContent = '▶ Play Response'; };
  }

  function browserTTS(text, btnRef) {
    if (!window.speechSynthesis) return;
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      if (btnRef.current) btnRef.current.textContent = '▶ Play (TTS)';
      return;
    }
    const u = new SpeechSynthesisUtterance(text.replace(/[*`#]/g, '').substring(0, 600));
    u.rate = 1; u.pitch = 1;
    const voices = speechSynthesis.getVoices();
    const v = voices.find(x => x.lang === 'en-US' && x.name.includes('Google')) || voices.find(x => x.lang === 'en-US');
    if (v) u.voice = v;
    speechSynthesis.speak(u);
    if (btnRef.current) btnRef.current.textContent = '⏸ Playing…';
    const t = setInterval(() => {
      if (!speechSynthesis.speaking) {
        clearInterval(t);
        if (btnRef.current) btnRef.current.textContent = '▶ Play (TTS)';
      }
    }, 300);
  }

  const emoData = EMO[emotion] || EMO.neutral;

  // ── Render ─────────────────────────────────────────────
  return (
    <div style={S.shell}>
      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `radial-gradient(ellipse 55% 35% at 15% 5%, rgba(56,189,248,0.05) 0, transparent 60%),
          radial-gradient(ellipse 45% 45% at 85% 85%, rgba(129,140,248,0.05) 0, transparent 60%)` }} />

      {/* Topbar */}
      <header style={S.topbar}>
        <div style={S.brand}>
          <div style={S.brandMark}>🎓</div>
          <div style={S.brandName}>EduBot</div>
        </div>
        <div style={S.topRight}>
          <div style={{ ...S.emoPill, borderColor: `${emoData.color}33` }}>
            <div style={{ ...S.emoDot, background: emoData.color, boxShadow: `0 0 6px ${emoData.color}` }} />
            <span style={{ color: '#e8eef8', fontSize: '12px' }}>{emoData.icon} {emoData.label}</span>
          </div>
          <select style={S.modelSel} value={model} onChange={e => setModel(e.target.value)}>
            <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
            <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
            <option value="llama3-8b-8192">Llama 3 8B</option>
            <option value="gemma2-9b-it">Gemma 2 9B</option>
            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
          </select>
          <div style={{ fontSize: '11px', color: '#34d399', fontFamily: "'Space Mono'", display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'blink 2s infinite' }} />
            LIVE
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sideLabel}>Quick Topics</div>
        {[
          ['⚛️', 'Quantum Physics', 'Explain quantum entanglement simply'],
          ['💻', 'Recursion', 'Help me understand recursion in programming'],
          ['📚', 'French Revolution', 'What is the French Revolution?'],
          ['📐', 'Derivatives', 'Explain calculus derivatives step by step'],
          ['🌱', 'Photosynthesis', 'How does photosynthesis work?'],
          ['🤖', 'Neural Networks', 'What is machine learning and how do neural networks work?'],
          ['🍎', "Newton's Laws", "Explain Newton's laws of motion"],
          ['🧬', 'DNA', 'What is DNA and how does it work?'],
        ].map(([icon, label, prompt]) => (
          <button key={label} style={S.chip}
            onClick={() => sendMsg(prompt)}
            onMouseEnter={e => { e.currentTarget.style.background = '#141c28'; e.currentTarget.style.color = '#e8eef8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5a6a88'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
          >
            <span>{icon}</span> {label}
          </button>
        ))}

        <div style={{ ...S.sideLabel, marginTop: '8px' }}>Voice</div>
        <select style={{ ...S.modelSel, width: '100%', padding: '8px 10px', borderRadius: '9px', fontSize: '12px', color: '#e8eef8' }}
          value={voice} onChange={e => setVoice(e.target.value)}>
          <option value="en-US-natalie">🇺🇸 Natalie (F)</option>
          <option value="en-US-marcus">🇺🇸 Marcus (M)</option>
          <option value="en-US-julia">🇺🇸 Julia (F)</option>
          <option value="en-IN-aarav">🇮🇳 Aarav (M)</option>
          <option value="en-IN-priya">🇮🇳 Priya (F)</option>
          <option value="en-GB-hazel">🇬🇧 Hazel (F)</option>
        </select>

        {/* Emotion radar */}
        <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={S.sideLabel}>Emotion Radar</div>
          {Object.entries(EMO).map(([k, v]) => (
            <div key={k} style={{ marginBottom: '7px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                <span style={{ color: '#5a6a88' }}>{v.icon} {v.label}</span>
                <span style={{ color: '#e8eef8', fontFamily: "'Space Mono'", fontSize: '10px' }}>
                  {emotion === k ? '85%' : '0%'}
                </span>
              </div>
              <div style={{ height: '3px', background: '#1b2438', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '2px',
                  background: v.color,
                  width: emotion === k ? '85%' : '0%',
                  transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {/* Chat */}
        <div ref={chatRef} style={S.chat}>
          {messages.map(msg => (
            msg.role === 'thinking'
              ? <ThinkingBubble key={msg.id} />
              : <Message key={msg.id} msg={msg} playAudio={playAudio} browserTTS={browserTTS} />
          ))}
        </div>

        {/* Pipeline */}
        {pipeState && (
          <div style={S.pipeline}>
            {[
              { id: 'voice', label: '🎤 Voice' },
              { id: 'emotion', label: '😊 Emotion' },
              { id: 'groq', label: '🧠 Groq' },
              { id: 'murf', label: '🔊 Murf' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.id}>
                <div style={{
                  ...S.pstep,
                  ...(pipeState[s.id] === 'active' ? { color: '#38bdf8', background: 'rgba(56,189,248,0.08)' } : {}),
                  ...(pipeState[s.id] === 'done' ? { color: '#34d399' } : {}),
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
            {recording && (
              <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                {[0, 0.1, 0.2, 0.3, 0.4].map((d, i) => (
                  <span key={i} style={{
                    width: '3px', background: '#38bdf8', borderRadius: '2px', display: 'inline-block',
                    animation: `wave 0.7s ease ${d}s infinite`,
                  }} />
                ))}
              </span>
            )}
            {vstatus}
          </div>
          <div style={S.irow}>
            <textarea
              ref={textRef}
              style={S.textarea}
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
            }} onClick={toggleMic} title="Voice input">
              {recording ? '⏹' : '🎤'}
            </button>
            <button style={{
              ...S.ibtn,
              background: busy ? 'rgba(56,189,248,0.15)' : 'linear-gradient(135deg, #38bdf8, #818cf8)',
              color: busy ? '#38bdf8' : '#07090f',
              boxShadow: busy ? 'none' : '0 0 16px rgba(56,189,248,0.3)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }} onClick={() => sendMsg()} disabled={busy}>
              {busy ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '90px', left: '50%',
          transform: 'translateX(-50%)',
          padding: '9px 18px', borderRadius: '10px',
          background: '#0e1219', fontSize: '13px', zIndex: 999,
          border: toast.type === 'err' ? '1px solid rgba(248,113,113,0.35)' : '1px solid rgba(52,211,153,0.35)',
          color: toast.type === 'err' ? '#f87171' : '#34d399',
          animation: 'fadeUp 0.3s ease',
        }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes wave { 0%,100%{height:4px} 50%{height:14px} }
        @keyframes micpulse { 0%,100%{box-shadow:0 0 0 0 rgba(244,114,182,0.4)} 50%{box-shadow:0 0 0 8px rgba(244,114,182,0)} }
        @keyframes fadeUp { from{opacity:0;transform:translate(-50%,8px)} to{opacity:1;transform:translate(-50%,0)} }
        @keyframes bounceUp { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-7px)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #1b2438; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────
function ThinkingBubble() {
  return (
    <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>🤖</div>
      <div style={{ padding: '12px 16px', background: '#141c28', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', borderTopLeftRadius: '4px', display: 'flex', gap: '5px', alignItems: 'center' }}>
        {[0, 0.18, 0.36].map((d, i) => (
          <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#38bdf8', display: 'inline-block', animation: `bounceUp 1.1s ease ${d}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function Message({ msg, playAudio, browserTTS }) {
  const isBot = msg.role === 'bot';
  const emo = EMO[msg.emotion] || EMO.neutral;
  const audioBtnRef = useRef(null);

  return (
    <div style={{ display: 'flex', gap: '10px', alignSelf: isBot ? 'flex-start' : 'flex-end', flexDirection: isBot ? 'row' : 'row-reverse', maxWidth: '80%', animation: 'fadeUp 0.3s ease' }}>
      <div style={{ width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', background: isBot ? 'rgba(56,189,248,0.1)' : 'rgba(244,114,182,0.1)', border: `1px solid ${isBot ? 'rgba(56,189,248,0.2)' : 'rgba(244,114,182,0.2)'}` }}>
        {isBot ? '🤖' : '👤'}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '10.5px', color: '#5a6a88', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Space Mono'", justifyContent: isBot ? 'flex-start' : 'flex-end' }}>
          {isBot ? 'EduBot' : 'You'} · {msg.time}
          <span style={{ padding: '2px 9px', borderRadius: '100px', fontSize: '10px', fontWeight: 600, color: emo.color, background: `${emo.color}11`, border: `1px solid ${emo.color}33` }}>
            {emo.icon} {emo.label}
          </span>
        </div>
        <div style={{ padding: '12px 16px', borderRadius: '14px', fontSize: '14px', background: isBot ? '#141c28' : 'rgba(56,189,248,0.07)', border: `1px solid ${isBot ? 'rgba(255,255,255,0.07)' : 'rgba(56,189,248,0.12)'}`, borderTopLeftRadius: isBot ? '4px' : '14px', borderTopRightRadius: isBot ? '14px' : '4px' }}>
          <MsgContent text={msg.text} />
          {isBot && (
            <button ref={audioBtnRef} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', padding: '5px 13px', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: '100px', color: '#38bdf8', fontSize: '11.5px', cursor: 'pointer', fontFamily: "'Space Mono'", transition: 'all 0.2s' }}
              onClick={() => msg.audioUrl ? playAudio(msg.audioUrl, audioBtnRef) : browserTTS(msg.text, audioBtnRef)}>
              ▶ {msg.audioUrl ? 'Play Response' : 'Play (TTS)'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
