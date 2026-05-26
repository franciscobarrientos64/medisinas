import { useState } from 'react';

const C = {
  verde:'#0A7B5E', verdePale:'#E8F7F3', blanco:'#FFFFFF',
  gris50:'#F9FAFB', gris200:'#E5E7EB', gris400:'#9CA3AF',
  gris600:'#6B7280', gris900:'#111827', rojo:'#EF4444',
};

const FRECUENCIAS = [
  { label:'7 días',  dias:7  },
  { label:'15 días', dias:15 },
  { label:'30 días', dias:30 },
  { label:'60 días', dias:60 },
  { label:'90 días', dias:90 },
];

const CUANDO_COMPRASTE = [
  { label:'Hoy',        dias:0 },
  { label:'Ayer',       dias:1 },
  { label:'Hace 3 días',dias:3 },
  { label:'Hace 1 sem', dias:7 },
  { label:'No recuerdo',dias:null },
];

export function GuardarMedModal({ open, onClose, variante, user, onSuccess }) {
  const [frecuencia, setFrecuencia] = useState(30);
  const [diasAtras, setDiasAtras]   = useState(0);
  const [unidades, setUnidades]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [ok, setOk]                 = useState(false);
  const [error, setError]           = useState('');

  if (!open) return null;
  document.body.style.overflow = 'hidden';
  const handleClose = () => { document.body.style.overflow = ''; setOk(false); setError(''); onClose(); };

  const fechaCompra = () => {
    if (diasAtras === null) return null;
    const d = new Date();
    d.setDate(d.getDate() - diasAtras);
    return d.toISOString().split('T')[0];
  };

  const proximaCompra = () => {
    const fc = fechaCompra();
    if (!fc) return null;
    // Si hay unidades, calcular por unidades (asumiendo 1 por día como default)
    const dias = unidades && parseInt(unidades) > 0
      ? parseInt(unidades)  // si compraste 100 unidades = ~100 días
      : frecuencia;
    const d = new Date(fc);
    d.setDate(d.getDate() + dias);
    return d.toLocaleDateString('es-PE', { day:'numeric', month:'long' });
  };

  async function handleGuardar() {
    setLoading(true); setError('');
    try {
      const fc = fechaCompra();
      const unidadesNum = parseInt(unidades) || null;
      // frecuencia_dias: si hay unidades, usamos eso; si no, la frecuencia declarada
      const frecDias = unidadesNum || frecuencia;

      const res = await fetch('/api/save-medicamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          medicamento: variante,
          frecuencia_dias: frecDias,
          cantidad_unidades: unidadesNum,
          compraste_hoy: false,
          ultima_compra: fc,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar.'); return; }
      setOk(true);
      onSuccess?.();
    } catch { setError('Error de red.'); }
    finally { setLoading(false); }
  }

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
              {proximaCompra() && (
                <><br/>Te recordamos comprar el <strong style={{color:C.verde}}>{proximaCompra()}</strong>.</>
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

            {/* ¿Cuándo compraste? */}
            <p style={fieldLabel}>¿Cuándo lo compraste?</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:20}}>
              {CUANDO_COMPRASTE.map(op => (
                <button key={op.label} onClick={() => setDiasAtras(op.dias)} style={{
                  padding:'8px 14px', borderRadius:20,
                  border:`2px solid ${diasAtras===op.dias ? C.verde : C.gris200}`,
                  background: diasAtras===op.dias ? C.verdePale : C.blanco,
                  color: diasAtras===op.dias ? C.verde : C.gris600,
                  fontSize:13, fontWeight:600, cursor:'pointer',
                }}>
                  {op.label}
                </button>
              ))}
            </div>

            {/* Cuántas unidades */}
            <p style={fieldLabel}>¿Cuántas unidades compraste? <span style={{fontWeight:400,color:C.gris400}}>(ej: 100 pastillas)</span></p>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <div style={{display:'flex',border:`1.5px solid ${C.gris200}`,borderRadius:12,overflow:'hidden',flex:1}}>
                <input
                  style={{flex:1,padding:'12px 14px',border:'none',outline:'none',fontSize:16,fontWeight:600,color:C.gris900}}
                  type="number" inputMode="numeric" min="1" max="1000"
                  placeholder="ej: 100"
                  value={unidades}
                  onChange={e => setUnidades(e.target.value)}
                />
                <span style={{padding:'12px 14px',background:C.gris50,fontSize:13,color:C.gris600,borderLeft:`1px solid ${C.gris200}`}}>
                  unidades
                </span>
              </div>
            </div>

            {/* Frecuencia — solo si no hay unidades */}
            {!unidades && (
              <>
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
              </>
            )}

            {/* Preview del recordatorio */}
            {proximaCompra() && (
              <div style={{background:'#F0FDF4',border:'1px solid #86EFAC',borderRadius:10,padding:'10px 14px',marginBottom:16,fontSize:13,color:'#166534'}}>
                🔔 Te recordaremos comprar el <strong>{proximaCompra()}</strong>
                {unidades && <span style={{color:C.gris600}}> — basado en {unidades} unidades</span>}
              </div>
            )}

            {error && <p style={{color:C.rojo,fontSize:13,textAlign:'center',marginTop:8}}>{error}</p>}

            <button style={{...primaryBtn,opacity:loading?0.7:1}} onClick={handleGuardar} disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar medicamento'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const overlay   = {position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center'};
const sheet     = {background:C.blanco,width:'100%',maxWidth:480,borderRadius:'24px 24px 0 0',padding:'12px 24px 40px',position:'relative',maxHeight:'92vh',overflowY:'auto'};
const bar       = {width:40,height:4,background:C.gris200,borderRadius:2,margin:'0 auto 20px'};
const closeBtn  = {position:'absolute',top:16,right:20,background:'none',border:'none',fontSize:18,color:C.gris400,cursor:'pointer'};
const title     = {fontSize:20,fontWeight:700,color:C.gris900,textAlign:'center',marginBottom:4};
const subtitle  = {fontSize:13,color:C.gris600,textAlign:'center',marginBottom:0};
const fieldLabel= {fontSize:12,fontWeight:600,color:C.gris600,marginBottom:8};
const primaryBtn= {width:'100%',padding:'14px',background:C.verde,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer'};
