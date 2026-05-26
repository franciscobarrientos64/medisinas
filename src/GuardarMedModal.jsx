import { useState } from 'react';

const C = {
  verde:'#0A7B5E', verdePale:'#E8F7F3', blanco:'#FFFFFF',
  gris50:'#F9FAFB', gris200:'#E5E7EB', gris400:'#9CA3AF',
  gris600:'#6B7280', gris900:'#111827', rojo:'#EF4444',
};

const FRECUENCIAS = [
  { label: '7 días',  dias: 7,  desc: 'Semanal' },
  { label: '15 días', dias: 15, desc: 'Quincenal' },
  { label: '30 días', dias: 30, desc: 'Mensual' },
  { label: '60 días', dias: 60, desc: 'Bimestral' },
  { label: '90 días', dias: 90, desc: 'Trimestral' },
];

export function GuardarMedModal({ open, onClose, variante, user, onSuccess }) {
  const [frecuencia, setFrecuencia] = useState(30);
  const [comprado, setComprado]     = useState(true);
  const [loading, setLoading]       = useState(false);
  const [ok, setOk]                 = useState(false);
  const [error, setError]           = useState('');

  if (!open) return null;
  document.body.style.overflow = 'hidden';
  const handleClose = () => { document.body.style.overflow = ''; setOk(false); setError(''); onClose(); };

  async function handleGuardar() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/save-medicamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          medicamento: variante,
          frecuencia_dias: frecuencia,
          compraste_hoy: comprado,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar.'); return; }
      setOk(true);
      onSuccess?.();
    } catch { setError('Error de red.'); }
    finally { setLoading(false); }
  }

  const proxima = () => {
    if (!comprado) return null;
    const d = new Date();
    d.setDate(d.getDate() + frecuencia);
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
  };

  return (
    <div style={overlay} onClick={handleClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={bar}/>
        <button onClick={handleClose} style={closeBtn}>✕</button>

        {ok ? (
          <div style={{textAlign:'center',padding:'20px 0 10px'}}>
            <div style={{fontSize:52,marginBottom:12}}>✅</div>
            <h2 style={title}>¡Guardado!</h2>
            <p style={{fontSize:14,color:C.gris600,lineHeight:1.6,marginBottom:20}}>
              <strong>{variante?.nombreProducto} {variante?.concent}</strong> está en tu lista.
              {comprado && proxima() && (
                <><br/>Te recordaremos comprar el <strong style={{color:C.verde}}>{proxima()}</strong>.</>
              )}
            </p>
            <button style={primaryBtn} onClick={handleClose}>Entendido</button>
          </div>
        ) : (
          <>
            <div style={{textAlign:'center',marginBottom:16}}>
              <span style={{fontSize:36}}>💊</span>
              <h2 style={title}>Guardar medicamento</h2>
              <p style={subtitle}><strong>{variante?.nombreProducto} {variante?.concent}</strong></p>
            </div>

            {/* Frecuencia */}
            <p style={fieldLabel}>¿Cada cuántos días lo compras?</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>
              {FRECUENCIAS.map(f => (
                <button key={f.dias} onClick={() => setFrecuencia(f.dias)} style={{
                  padding:'8px 16px', borderRadius:20,
                  border:`2px solid ${frecuencia===f.dias ? C.verde : C.gris200}`,
                  background: frecuencia===f.dias ? C.verdePale : C.blanco,
                  color: frecuencia===f.dias ? C.verde : C.gris600,
                  fontSize:13, fontWeight:600, cursor:'pointer',
                }}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* ¿Compraste hoy? */}
            <div style={checkRow} onClick={() => setComprado(c => !c)}>
              <div style={{...checkbox, background: comprado ? C.verde : C.blanco, borderColor: comprado ? C.verde : C.gris200}}>
                {comprado && <span style={{color:'#fff',fontSize:14,fontWeight:700}}>✓</span>}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:600,color:C.gris900}}>Acabo de comprarlo</div>
                <div style={{fontSize:12,color:C.gris400}}>
                  {comprado && proxima() ? `Te recordamos el ${proxima()}` : 'Marca cuando lo compres desde Mis medicamentos'}
                </div>
              </div>
            </div>

            {error && <p style={{color:C.rojo,fontSize:13,textAlign:'center',marginTop:8}}>{error}</p>}

            <button style={{...primaryBtn,opacity:loading?0.7:1,marginTop:16}} onClick={handleGuardar} disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar medicamento'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const overlay   = {position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center'};
const sheet     = {background:C.blanco,width:'100%',maxWidth:480,borderRadius:'24px 24px 0 0',padding:'12px 24px 40px',position:'relative',maxHeight:'90vh',overflowY:'auto'};
const bar       = {width:40,height:4,background:C.gris200,borderRadius:2,margin:'0 auto 20px'};
const closeBtn  = {position:'absolute',top:16,right:20,background:'none',border:'none',fontSize:18,color:C.gris400,cursor:'pointer'};
const title     = {fontSize:20,fontWeight:700,color:C.gris900,textAlign:'center',marginBottom:4};
const subtitle  = {fontSize:13,color:C.gris600,textAlign:'center',marginBottom:0};
const fieldLabel= {fontSize:12,fontWeight:600,color:C.gris600,marginBottom:8};
const checkRow  = {display:'flex',alignItems:'flex-start',gap:12,background:C.gris50,border:`1px solid ${C.gris200}`,borderRadius:12,padding:'12px 14px',cursor:'pointer',marginBottom:8};
const checkbox  = {width:22,height:22,borderRadius:6,border:'2px solid',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1};
const primaryBtn= {width:'100%',padding:'14px',background:C.verde,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer'};
