import { useState, useEffect, useRef } from 'react';

const C = {
  verde:'#0A7B5E', verdePale:'#E8F7F3', blanco:'#FFFFFF',
  gris50:'#F9FAFB', gris200:'#E5E7EB', gris400:'#9CA3AF',
  gris600:'#6B7280', gris900:'#111827', rojo:'#EF4444',
};

function formatPhone(raw) {
  const d = raw.replace(/\D/g,'');
  return d.startsWith('51') ? `+${d}` : `+51${d}`;
}

const SESSION_KEY = 'medisinas_user';
export function getLocalUser() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
}
function saveLocalUser(u) { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); }
function clearLocalUser() { localStorage.removeItem(SESSION_KEY); }

export function useAuth() {
  const [user, setUser] = useState(() => getLocalUser());

  // Detectar sesión OAuth de Google/Apple al cargar
  useEffect(() => {
    async function checkSupabaseSession() {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
          process.env.REACT_APP_SUPABASE_URL,
          process.env.REACT_APP_SUPABASE_ANON_KEY
        );
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user && !getLocalUser()) {
          const u = {
            id: session.user.id,
            nombre: session.user.user_metadata?.full_name?.split(' ')[0] || '',
            apellido: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            email: session.user.email,
            telefono: session.user.phone || null,
            provider: session.user.app_metadata?.provider,
          };
          saveLocalUser(u);
          setUser(u);
        }
        // Escuchar cambios de sesión OAuth
        sb.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const u = {
              id: session.user.id,
              nombre: session.user.user_metadata?.full_name?.split(' ')[0] || '',
              apellido: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              email: session.user.email,
              telefono: session.user.phone || null,
              provider: session.user.app_metadata?.provider,
            };
            saveLocalUser(u);
            setUser(u);
          } else if (!getLocalUser()) {
            setUser(null);
          }
        });
      } catch {}
    }
    checkSupabaseSession();
  }, []);

  const signOut = async () => {
    clearLocalUser();
    setUser(null);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );
      await sb.auth.signOut();
    } catch {}
  };
  const signIn = (u) => { saveLocalUser(u); setUser(u); };
  return { user, signOut, signIn };
}

export function AuthModal({ open, onClose, onSuccess }) {
  const [step, setStep]               = useState('choose');
  const [phone, setPhone]             = useState('');
  const [otp, setOtp]                 = useState(['','','','','','']);
  const [nombre, setNombre]           = useState('');
  const [email, setEmail]             = useState('');
  const [apellido, setApellido]       = useState('');
  const [anio, setAnio]               = useState('');
  const [genero, setGenero]           = useState('');
  const [condiciones, setCondiciones] = useState([]);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [userData, setUserData]       = useState(null);
  const otpRefs = [useRef(),useRef(),useRef(),useRef(),useRef(),useRef()];

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r-1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  if (!open) return null;
  document.body.style.overflow = 'hidden';

  const reset = () => {
    document.body.style.overflow = '';
    setStep('choose'); setPhone(''); setOtp(['','','','','','']); setError('');
  };
  const handleClose = () => { reset(); onClose(); };

  async function handleGoogle() {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }});
  }

  async function handleApple() {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );
    await sb.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: window.location.origin }});
  }

  async function handleSendOTP() {
    setError('');
    const formatted = formatPhone(phone);
    if (formatted.length < 12) { setError('Ingresa un número válido de 9 dígitos.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al enviar el código.'); return; }
      setStep('otp'); setResendTimer(30);
    } catch { setError('Error de red. Verifica tu conexión.'); }
    finally { setLoading(false); }
  }

  async function handleVerifyOTP() {
    setError('');
    const code = otp.join('');
    if (code.length < 6) { setError('Ingresa los 6 dígitos.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhone(phone), code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Código incorrecto.');
        setOtp(['','','','','','']);
        otpRefs[0].current?.focus();
        return;
      }
      setUserData(data.user); setStep('profile');
    } catch { setError('Error de red.'); }
    finally { setLoading(false); }
  }

  async function handleSaveProfile() {
    if (!nombre.trim()) { setError('El nombre es requerido.'); return; }
    if (!apellido.trim()) { setError('El apellido es requerido.'); return; }
    const anioNum = parseInt(anio);
    if (!anio || anioNum < 1920 || anioNum > 2010) { setError('Ingresa un año de nacimiento válido (ej: 1978).'); return; }
    if (!genero) { setError('Selecciona tu género.'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Ingresa un email válido.'); return; }
    setLoading(true);
    const perfil = {
      nombre: nombre.trim(),
      apellido: apellido.trim() || null,
      anio_nacimiento: anio ? anioNum : null,
      email: email.trim() || null,
      genero: genero || null,

    };
    try {
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData?.id, nombre: perfil.nombre, apellido: perfil.apellido, anio_nacimiento: perfil.anio_nacimiento, genero: perfil.genero }),
      });
      await res.json();
    } catch {}
    const u = { ...userData, ...perfil };
    saveLocalUser(u);
    handleClose();
    onSuccess?.(u);
    setLoading(false);
  }



  function handleOtpChange(idx, val) {
    const v = val.replace(/\D/g,'').slice(-1);
    const next = [...otp]; next[idx] = v; setOtp(next);
    if (v && idx < 5) otpRefs[idx+1].current?.focus();
  }
  function handleOtpKey(idx, e) {
    if (e.key==='Backspace' && !otp[idx] && idx>0) otpRefs[idx-1].current?.focus();
    if (e.key==='Enter') handleVerifyOTP();
  }
  async function handleResend() {
    if (resendTimer > 0) return;
    setError(''); setOtp(['','','','','','']); setLoading(true);
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatPhone(phone) }),
      });
      const data = await res.json();
      if (res.ok) setResendTimer(30); else setError(data.error || 'Error al reenviar.');
    } catch { setError('Error de red.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={overlay} onClick={handleClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={bar}/>
        <button onClick={handleClose} style={closeBtn}>✕</button>

        {step === 'choose' && <>
          <div style={{textAlign:'center',marginBottom:20}}>
            <span style={{display:'inline-block',background:C.verde,color:'#fff',fontWeight:700,fontSize:12,letterSpacing:1.5,padding:'4px 12px',borderRadius:6}}>MEDISINAS</span>
          </div>
          <h2 style={title}>Guarda tus medicamentos</h2>
          <p style={subtitle}>Tu historial de precios y alertas, siempre disponibles.</p>
          <SocialBtn icon={<GoogleIcon/>} label="Continuar con Google" onClick={handleGoogle} disabled={loading}/>
          <SocialBtn icon={<AppleIcon/>}  label="Continuar con Apple"  onClick={handleApple}  disabled={loading} dark/>
          <div style={divider}><div style={line}/><span style={divText}>o con tu número</span><div style={line}/></div>
          <div style={phoneRow}>
            <span style={prefix}>+51</span>
            <input style={phoneInput} type="tel" inputMode="numeric" placeholder="987 654 321"
              maxLength={9} value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,9))}
              onKeyDown={e => e.key==='Enter' && handleSendOTP()}/>
          </div>
          {error && <p style={errText}>{error}</p>}
          <button style={{...primaryBtn, opacity: loading||phone.length<9 ? 0.6:1}}
            onClick={handleSendOTP} disabled={loading||phone.length<9}>
            {loading ? 'Enviando…' : 'Recibir código por WhatsApp'}
          </button>
          <p style={note}>Te llega un mensaje con 6 números. Gratis. No compartimos tu número.</p>
        </>}

        {step === 'otp' && <>
          <div style={{fontSize:38,textAlign:'center',marginBottom:6}}>💬</div>
          <h2 style={title}>Ingresa el código</h2>
          <p style={subtitle}>Enviamos 6 números por WhatsApp al<br/><strong>+51 {phone}</strong></p>
          <div style={otpRow}>
            {otp.map((digit,i) => (
              <input key={i} ref={otpRefs[i]}
                style={{...otpBox, borderColor: digit ? C.verde : C.gris200}}
                type="tel" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKey(i, e)}
                autoFocus={i===0}/>
            ))}
          </div>
          {error && <p style={errText}>{error}</p>}
          <button style={{...primaryBtn, opacity: loading||otp.join('').length<6 ? 0.6:1}}
            onClick={handleVerifyOTP} disabled={loading||otp.join('').length<6}>
            {loading ? 'Verificando…' : 'Verificar'}
          </button>
          <p style={{textAlign:'center',fontSize:13,color:C.gris400,marginTop:14}}>
            {resendTimer > 0
              ? `¿No llegó? Espera ${resendTimer}s`
              : <button style={linkBtn} onClick={handleResend}>¿No llegó? Reenviar código</button>}
          </p>
          <button style={backBtn} onClick={() => { setStep('choose'); setError(''); }}>← Cambiar número</button>
        </>}

        {step === 'profile' && <>
          <div style={{fontSize:36,textAlign:'center',marginBottom:6}}>✅</div>
          <h2 style={{...title,fontSize:20}}>Cuéntanos un poco sobre ti</h2>
          <p style={{...subtitle,marginBottom:16}}>Solo unos datos más — casi listo.</p>

          <div style={{display:'flex',gap:8,marginBottom:10}}>
            <input style={{...nameInput,marginBottom:0,flex:1}} type="text" placeholder="Nombre *"
              value={nombre} onChange={e => setNombre(e.target.value)} autoFocus/>
            <input style={{...nameInput,marginBottom:0,flex:1}} type="text" placeholder="Apellido *"
              value={apellido} onChange={e => setApellido(e.target.value)}/>
          </div>

          <input style={{...nameInput}} type="number" placeholder="Año de nacimiento * (ej: 1978)"
            min="1920" max="2010" value={anio} onChange={e => setAnio(e.target.value)}/>

          <input style={{...nameInput}} type="email" inputMode="email"
            placeholder="Tu email para alertas de precio (opcional)"
            value={email} onChange={e => setEmail(e.target.value)}/>

          <p style={{fontSize:12,color:'#6B7280',marginBottom:8,fontWeight:600}}>Género *</p>
          <div style={{display:'flex',gap:8,marginBottom:14}}>
            {['Hombre','Mujer','Prefiero no decir'].map(g => (
              <button key={g} onClick={() => setGenero(g === genero ? '' : g)}
                style={{flex:1,padding:'9px 4px',borderRadius:10,border:`2px solid ${g===genero?'#0A7B5E':'#E5E7EB'}`,background:g===genero?'#E8F7F3':'#fff',color:g===genero?'#0A7B5E':'#6B7280',fontSize:12,fontWeight:600,cursor:'pointer'}}>
                {g}
              </button>
            ))}
          </div>

          {error && <p style={errText}>{error}</p>}
          <button style={{...primaryBtn, opacity: loading ? 0.6:1}} onClick={handleSaveProfile} disabled={loading}>
            {loading ? 'Guardando…' : 'Entrar a MediSinas'}
          </button>
          <button style={backBtn} onClick={() => { handleClose(); onSuccess?.(userData); }}>Omitir por ahora</button>
        </>}
      </div>
    </div>
  );
}

function SocialBtn({ icon, label, onClick, disabled, dark }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display:'flex',alignItems:'center',justifyContent:'center',gap:10,
      width:'100%',padding:'13px 16px',
      border: dark ? 'none' : `1.5px solid ${C.gris200}`,
      borderRadius:12, background: dark ? C.gris900 : C.blanco,
      color: dark ? C.blanco : C.gris900, fontSize:15, fontWeight:500,
      cursor: disabled ? 'not-allowed':'pointer', marginBottom:10, opacity: disabled ? 0.6:1,
    }}>{icon}{label}</button>
  );
}

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.5-2.9-11.2-7.1l-6.5 5C9.8 39.8 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.5l6.2 5.2C41 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>;
}

function AppleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>;
}

export function AuthButton({ user, onOpen, onSignOut }) {
  if (user) {
    const display = user.nombre || user.telefono?.slice(-4) || 'Mi cuenta';
    return (
      <button style={headerUserBtn} onClick={onSignOut} title="Cerrar sesión">
        <span style={avatarDot}>{(user.nombre?.[0]||'#').toUpperCase()}</span>
        <span style={{fontSize:13}}>{display}</span>
      </button>
    );
  }
  return <button style={headerLoginBtn} onClick={onOpen}>Guardar mis medicamentos</button>;
}

const overlay     = {position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center'};
const sheet       = {background:C.blanco,width:'100%',maxWidth:480,borderRadius:'24px 24px 0 0',padding:'12px 24px 44px',position:'relative',maxHeight:'92vh',overflowY:'auto'};
const bar         = {width:40,height:4,background:C.gris200,borderRadius:2,margin:'0 auto 20px'};
const closeBtn    = {position:'absolute',top:16,right:20,background:'none',border:'none',fontSize:18,color:C.gris400,cursor:'pointer'};
const title       = {fontSize:22,fontWeight:700,color:C.gris900,textAlign:'center',marginBottom:6};
const subtitle    = {fontSize:14,color:C.gris600,textAlign:'center',marginBottom:24,lineHeight:1.5};
const divider     = {display:'flex',alignItems:'center',gap:10,margin:'4px 0 14px'};
const line        = {flex:1,height:1,background:C.gris200};
const divText     = {fontSize:12,color:C.gris400,whiteSpace:'nowrap'};
const phoneRow    = {display:'flex',border:`1.5px solid ${C.gris200}`,borderRadius:12,overflow:'hidden',marginBottom:12};
const prefix      = {padding:'14px 12px',background:C.gris50,fontSize:15,fontWeight:600,color:C.gris600,borderRight:`1px solid ${C.gris200}`};
const phoneInput  = {flex:1,padding:'14px 12px',border:'none',outline:'none',fontSize:18,fontWeight:500,letterSpacing:1,color:C.gris900,background:'transparent'};
const primaryBtn  = {width:'100%',padding:'15px',background:C.verde,color:C.blanco,border:'none',borderRadius:12,fontSize:16,fontWeight:600,cursor:'pointer',marginTop:4};
const note        = {fontSize:12,color:C.gris400,textAlign:'center',marginTop:12,lineHeight:1.5};
const otpRow      = {display:'flex',gap:8,justifyContent:'center',marginBottom:20};
const otpBox      = {width:46,height:56,textAlign:'center',fontSize:24,fontWeight:700,border:'2px solid',borderRadius:12,outline:'none',color:C.gris900};
const errText     = {color:C.rojo,fontSize:13,textAlign:'center',marginBottom:10};
const linkBtn     = {background:'none',border:'none',color:C.verde,fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'underline'};
const backBtn     = {display:'block',margin:'12px auto 0',background:'none',border:'none',color:C.gris400,fontSize:13,cursor:'pointer'};
const nameInput   = {width:'100%',padding:'14px 16px',border:`1.5px solid ${C.gris200}`,borderRadius:12,fontSize:16,outline:'none',marginBottom:14,color:C.gris900,boxSizing:'border-box'};
const headerLoginBtn = {padding:'8px 14px',background:C.verde,color:C.blanco,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'};
const headerUserBtn  = {display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:C.verdePale,border:'none',borderRadius:8,cursor:'pointer',color:C.verde,fontWeight:600};
const avatarDot   = {width:26,height:26,background:C.verde,color:'#fff',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700};
// v2.1.1 - auth WhatsApp integrado Thu May 21 18:40:19 UTC 2026
// trigger 1779390968
// redeploy trigger 1779766375
