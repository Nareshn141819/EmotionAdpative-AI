import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function AuthPage() {
  const navigate  = useNavigate();
  const [mode,    setMode]    = useState('signin'); // signin | signup | phone
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [phone,   setPhone]   = useState('');
  const [otp,     setOtp]     = useState('');
  const [step,    setStep]    = useState('form'); // form | otp
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const recapRef  = useRef(null);
  const confirmRef= useRef(null);

  const err = msg => { setError(msg); setLoading(false); };

  // ── Email / Password ──────────────────────────────────────────
  async function handleEmail(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
      navigate('/chat');
    } catch(ex) { err(ex.message.replace('Firebase: ','').replace(/\(.*\)/,'')); }
  }

  // ── Google ────────────────────────────────────────────────────
  async function handleGoogle() {
    setError(''); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/chat');
    } catch(ex) { err(ex.message.replace('Firebase: ','')); }
  }

  // ── Phone OTP ─────────────────────────────────────────────────
  async function handleSendOTP(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (!recapRef.current) {
        recapRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      confirmRef.current = await signInWithPhoneNumber(auth, phone, recapRef.current);
      setStep('otp'); setLoading(false);
    } catch(ex) { err(ex.message.replace('Firebase: ','')); }
  }

  async function handleVerifyOTP(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await confirmRef.current.confirm(otp);
      navigate('/chat');
    } catch(ex) { err('Invalid OTP. Try again.'); }
  }

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    background: '#141c28', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e8eef8', fontSize: '14px', fontFamily: "'Outfit',sans-serif",
    outline: 'none', marginBottom: '12px', boxSizing: 'border-box',
  };
  const btn = (bg='linear-gradient(135deg,#38bdf8,#818cf8)', color='#07090f') => ({
    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    background: bg, color, fontSize: '14px', fontWeight: 600,
    fontFamily: "'Outfit',sans-serif", cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1, marginBottom: '10px',
  });

  return (
    <div style={{ minHeight:'100vh', background:'#07090f', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Outfit',sans-serif", padding:'clamp(16px,4vw,40px)', position:'relative' }}>

      <div style={{ position:'fixed', inset:0, pointerEvents:'none', background:`radial-gradient(ellipse 60% 40% at 20% 10%, rgba(56,189,248,0.07) 0,transparent 60%), radial-gradient(ellipse 50% 50% at 80% 80%, rgba(129,140,248,0.07) 0,transparent 60%)` }} />

      <button onClick={() => navigate('/')} style={{ position:'fixed', top:'clamp(12px,2vw,20px)', left:'clamp(12px,2vw,20px)', padding:'7px 14px', borderRadius:'9px', background:'rgba(14,18,25,0.8)', border:'1px solid rgba(255,255,255,0.08)', color:'#5a6a88', cursor:'pointer', fontSize:'13px', fontFamily:"'Outfit',sans-serif", zIndex:10 }}>
        ← Back
      </button>

      <div style={{ textAlign:'center', marginBottom:'24px', zIndex:1 }}>
        <div style={{ width:'52px', height:'52px', borderRadius:'16px', background:'linear-gradient(135deg,#38bdf8,#818cf8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', margin:'0 auto 12px', boxShadow:'0 0 28px rgba(56,189,248,0.4)' }}>🧠</div>
        <div style={{ fontSize:'22px', fontWeight:800, letterSpacing:'-0.5px', background:'linear-gradient(90deg,#38bdf8,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Emotion AI</div>
        <div style={{ color:'#5a6a88', fontSize:'13px', marginTop:'4px' }}>Emotion-Aware AI Tutor</div>
      </div>

      {/* Mode tabs */}
      <div style={{ display:'flex', borderRadius:'12px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)', marginBottom:'20px', background:'rgba(14,18,25,0.8)', zIndex:1 }}>
        {['signin','signup','phone'].map(m => (
          <button key={m} onClick={() => { setMode(m); setStep('form'); setError(''); }} style={{ padding:'9px clamp(14px,3vw,22px)', fontSize:'13px', fontWeight:600, fontFamily:"'Outfit',sans-serif", cursor:'pointer', border:'none', background: mode===m ? 'linear-gradient(135deg,#38bdf8,#818cf8)' : 'transparent', color: mode===m ? '#07090f' : '#5a6a88', transition:'all 0.2s' }}>
            {m==='signin' ? 'Sign In' : m==='signup' ? 'Sign Up' : '📱 Phone'}
          </button>
        ))}
      </div>

      <div style={{ width:'100%', maxWidth:'min(420px,100%)', zIndex:1 }}>

        {/* Error */}
        {error && (
          <div style={{ padding:'10px 14px', borderRadius:'10px', background:'rgba(248,113,113,0.1)', border:'1px solid rgba(248,113,113,0.3)', color:'#f87171', fontSize:'13px', marginBottom:'14px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Email / Password form */}
        {(mode === 'signin' || mode === 'signup') && (
          <form onSubmit={handleEmail}>
            {mode === 'signup' && (
              <input style={inp} placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
            )}
            <input style={inp} type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} required />
            <input style={inp} type="password" placeholder="Password" value={pass} onChange={e=>setPass(e.target.value)} required />
            <button type="submit" style={btn()}>
              {loading ? '⏳ Please wait…' : mode==='signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Phone OTP */}
        {mode === 'phone' && step === 'form' && (
          <form onSubmit={handleSendOTP}>
            <input style={inp} type="tel" placeholder="+91XXXXXXXXXX (with country code)" value={phone} onChange={e=>setPhone(e.target.value)} required />
            <div id="recaptcha-container" />
            <button type="submit" style={btn()}>
              {loading ? '⏳ Sending OTP…' : 'Send OTP'}
            </button>
          </form>
        )}

        {mode === 'phone' && step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <div style={{ textAlign:'center', color:'#5a6a88', fontSize:'13px', marginBottom:'14px' }}>
              OTP sent to {phone}
            </div>
            <input style={{ ...inp, textAlign:'center', fontSize:'20px', letterSpacing:'8px' }} type="text" placeholder="------" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} required />
            <button type="submit" style={btn()}>
              {loading ? '⏳ Verifying…' : 'Verify OTP'}
            </button>
            <button type="button" onClick={() => { setStep('form'); setOtp(''); }} style={btn('rgba(255,255,255,0.05)','#e8eef8')}>
              ← Change number
            </button>
          </form>
        )}

        {/* Divider */}
        {mode !== 'phone' && (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'4px 0 12px' }}>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
              <span style={{ color:'#5a6a88', fontSize:'12px' }}>or</span>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
            </div>
            <button onClick={handleGoogle} style={btn('rgba(255,255,255,0.05)','#e8eef8')}>
              <span style={{ marginRight:'8px' }}>🌐</span> Continue with Google
            </button>
          </>
        )}

      </div>
    </div>
  );
}
