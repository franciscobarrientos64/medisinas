import React, { useState, useRef } from "react";

function formatPhone(raw) {
  const d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("51")) return "+" + d;
  return "+51" + d;
}

export default function Login({ go, onAuthed }) {
  const [step, setStep] = useState("choose"); // choose | otp | profile
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [userData, setUserData] = useState(null);
  const [perfil, setPerfil] = useState({ nombre: "", apellido: "", anio_nacimiento: "", genero: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  async function handleGoogle() {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.REACT_APP_SUPABASE_URL, process.env.REACT_APP_SUPABASE_ANON_KEY);
    await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  }

  async function enviarOTP() {
    setError("");
    const f = formatPhone(phone);
    if (f.length < 12) { setError("Ingresa un número válido de 9 dígitos."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: f }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Error al enviar el código."); return; }
      setStep("otp");
    } catch { setError("Error de red."); } finally { setLoading(false); }
  }

  async function verificarOTP() {
    setError("");
    const code = otp.join("");
    if (code.length < 6) { setError("Ingresa los 6 dígitos."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: formatPhone(phone), code }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Código incorrecto."); setOtp(["", "", "", "", "", ""]); refs[0].current?.focus(); return; }
      if (d.user?.nombre) { onAuthed(d.user); return; }
      setUserData(d.user); setStep("profile");
    } catch { setError("Error de red."); } finally { setLoading(false); }
  }

  async function guardarPerfil() {
    if (!perfil.nombre.trim()) { setError("El nombre es requerido."); return; }
    const anio = parseInt(perfil.anio_nacimiento, 10);
    if (!anio || anio < 1920 || anio > 2015) { setError("Año de nacimiento válido (ej. 1955)."); return; }
    if (!perfil.genero) { setError("Selecciona el género."); return; }
    setLoading(true);
    try {
      await fetch("/api/data?action=update-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: userData?.id, nombre: perfil.nombre.trim(), apellido: perfil.apellido.trim() || null, anio_nacimiento: anio, genero: perfil.genero }) });
    } catch {}
    setLoading(false);
    onAuthed({ ...userData, ...perfil, anio_nacimiento: anio });
  }

  function onOtpChange(i, v) {
    const c = v.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[i] = c; setOtp(next);
    if (c && i < 5) refs[i + 1].current?.focus();
  }

  return (
    <main className="flex flex-col md:flex-row min-h-[calc(100vh-72px)]">
      {/* Ether */}
      <section className="relative w-full md:w-[42%] flex flex-col justify-between p-margin-page overflow-hidden text-white" style={{ background: "linear-gradient(135deg, #3c51c2 0%, #8135c5 100%)" }}>
        <div className="relative z-10 mt-8">
          <h2 className="font-display-lg text-display-lg leading-tight mb-6">Protegiendo tu acceso.</h2>
          <p className="text-white/80 font-body-md max-w-sm">Tu seguridad es nuestra prioridad. Verificamos tu identidad con un código por WhatsApp.</p>
        </div>
        <div className="relative z-10 mt-auto glass-card rounded-lg p-6 max-w-xs">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="font-label-caps text-label-caps uppercase">Acceso seguro</span>
          </div>
          <p className="text-body-sm text-white/90">Datos oficiales DIGEMID · MINSA.</p>
        </div>
      </section>

      {/* Clinical */}
      <section className="flex-1 bg-surface-container-lowest flex items-center justify-center p-margin-page">
        <div className="w-full max-w-md">
          {step === "choose" && (
            <>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">Ingresa o regístrate</h3>
              <p className="text-on-surface-variant text-body-md mb-8">Te enviamos un código por WhatsApp.</p>
              <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Número de celular</label>
              <div className="flex items-center gap-2 mb-4">
                <span className="px-4 py-4 bg-surface-container-low rounded-DEFAULT text-body-md text-on-surface-variant">+51</span>
                <input className="flex-1 bg-surface-container-low border border-outline-variant/30 rounded-DEFAULT py-4 px-4 text-body-md focus:ring-2 focus:ring-primary/20" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="999 999 999" inputMode="numeric" />
              </div>
              {error && <p className="text-error text-body-sm mb-4">{error}</p>}
              <button onClick={enviarOTP} disabled={loading} className="w-full bg-primary text-white py-4 rounded-full font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <>Enviar código <span className="material-symbols-outlined">arrow_forward</span></>}
              </button>
              <div className="flex items-center gap-4 my-6"><div className="flex-1 h-px bg-outline-variant/40" /><span className="text-on-surface-variant text-body-sm">o</span><div className="flex-1 h-px bg-outline-variant/40" /></div>
              <button onClick={handleGoogle} className="w-full border-2 border-outline-variant text-on-surface py-4 rounded-full font-bold hover:bg-surface-container transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">account_circle</span> Continuar con Google
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">Verifica tu número</h3>
              <p className="text-on-surface-variant text-body-md mb-8">Código de 6 dígitos enviado a tu WhatsApp.</p>
              <div className="flex justify-between gap-2 mb-6">
                {otp.map((v, i) => (
                  <input key={i} ref={refs[i]} value={v} maxLength={1} inputMode="numeric"
                    onChange={(e) => onOtpChange(i, e.target.value)}
                    onKeyDown={(e) => e.key === "Backspace" && !v && i > 0 && refs[i - 1].current?.focus()}
                    className="w-12 h-16 text-center font-display-lg text-[28px] bg-surface-container-low border border-outline-variant/30 rounded-DEFAULT focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" />
                ))}
              </div>
              {error && <p className="text-error text-body-sm mb-4">{error}</p>}
              <button onClick={verificarOTP} disabled={loading} className="w-full bg-primary text-white py-4 rounded-full font-bold active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <>Verificar y entrar <span className="material-symbols-outlined">arrow_forward</span></>}
              </button>
              <button onClick={() => setStep("choose")} className="w-full text-on-surface-variant text-body-sm mt-4 hover:text-primary">Cambiar número</button>
            </>
          )}

          {step === "profile" && (
            <>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">Completa tu perfil</h3>
              <p className="text-on-surface-variant text-body-md mb-8">Para personalizar tus recordatorios.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input className="bg-surface-container-low border border-outline-variant/30 rounded-DEFAULT py-3 px-4 text-body-md" placeholder="Nombre" value={perfil.nombre} onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })} />
                  <input className="bg-surface-container-low border border-outline-variant/30 rounded-DEFAULT py-3 px-4 text-body-md" placeholder="Apellido" value={perfil.apellido} onChange={(e) => setPerfil({ ...perfil, apellido: e.target.value })} />
                </div>
                <input type="number" className="w-full bg-surface-container-low border border-outline-variant/30 rounded-DEFAULT py-3 px-4 text-body-md" placeholder="Año de nacimiento (ej. 1955)" value={perfil.anio_nacimiento} onChange={(e) => setPerfil({ ...perfil, anio_nacimiento: e.target.value })} />
                <div className="flex gap-2">
                  {["Femenino", "Masculino", "Otro"].map((g) => (
                    <button key={g} onClick={() => setPerfil({ ...perfil, genero: g })} className={`flex-1 py-3 rounded-full text-body-sm ${perfil.genero === g ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}>{g}</button>
                  ))}
                </div>
              </div>
              {error && <p className="text-error text-body-sm mt-4">{error}</p>}
              <button onClick={guardarPerfil} disabled={loading} className="w-full bg-primary text-white py-4 rounded-full font-bold active:scale-95 transition-all disabled:opacity-50 mt-6">{loading ? "Guardando…" : "Entrar a Medisinas"}</button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
