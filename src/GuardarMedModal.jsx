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

const DOSIS = [
  { label:'1×día',  veces:1 },
  { label:'2×día',  veces:2 },
  { label:'3×día',  veces:3 },
  { label:'4×día',  veces:4 },
];

const hoy = new Date().toISOString().split('T')[0];

export function GuardarMedModal({ open, onClose, variante, user, onSuccess }) {
  const [frecuencia, setFrecuencia] = useState(30);
  const [fechaCompra, setFechaCompra] = useState(hoy);
  const [unidades, setUnidades]       = useState('');
  const [dosisDia, setDosisDia]       = useState(1);
  const [loading, setLoading]         = useState(false);
  const [ok, setOk]                   = useState(false);
  const [error, setError]             = useState('');

  if (!open) return null;
  document.body.style.overflow = 'hidden';
  const handleClose = () => { document.body.style.overflow = ''; setOk(false); setError(''); onClose(); };

  const diasHastaAgotarse = () => {
    const u = parseInt(unidades);
    if (u > 0 && dosisDia > 0) return Math.floor(u / dosisDia);
    return frecuencia;
  };

  const proximaFecha = () => {
    if (!fechaCompra) return null;
    const d = new Date(fechaCompra);
    d.setDate(d.getDate() + diasHastaAgotarse());
    return d.toLocaleDateString('es-PE', { day:'numeric', month:'long', year:'numeric' });
  };

  async function handleGuardar() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/save-medicamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          medicamento: variante,
          frecuencia_dias: diasHastaAgotarse(),
          cantidad_unidades: parseInt(unidades) || null,
          ultima_compra: fechaCompra || null,
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
              {proximaFecha() && (
                <><br/>Te recordamos comprar el <strong style={{color:C.verde}}>{proximaFecha()}</strong>.</>
              )}
            </p>
            <button style={primaryBtn} onClick={handleClose}>Entendido</button>
          </div>
        ) : (
          <>
            <div style={{textAlign:'center',marginBottom:20}}>
              <span style={{fontSize:36}}>💊</span>
              <h2 style={title}>Guardar medicamento</h2>
              <p style={subtitle}><strong>{variante?.nombreProducto} {variante?.concent}</strong></p>
            </div>

            {/* Fecha de compra */}
            <p style={fieldLabel}>¿Cuándo lo compraste?</p>
            <input
              type="date"
              max={hoy}
              value={fechaCompra}
              onChange={e => setFechaCompra(e.target.value)}
              style={dateInput}
            />

            {/* Dosis diaria */}
            <p style={{...fieldLabel, marginTop:16}}>¿Cuántas veces al día lo tomas?</p>
            <div style={{display:'flex',gap:8,marginBottom:16}}>
              {DOSIS.map(d => (
                <button key={d.veces} onClick={() => setDosisDia(d.veces)} style={{
                  flex:1, padding:'10px 4px', borderRadius:10,
                  border:`2px solid ${dosisDia===d.veces ? C.verde : C.gris200}`,
                  background: dosisDia===d.veces ? C.verdePale : C.blanco,
                  color: dosisDia===d.veces ? C.verde : C.gris600,
                  fontSize:13, fontWeight:600, cursor:'pointer',
                }}>
                  {d.label}
                </button>
              ))}
            </div>

            {/* Unidades */}
            <p style={fieldLabel}>
              ¿Cuántas unidades compraste?
              <span style={{fontWeight:400,color:C.gris400}}> (ej: 100 pastillas)</span>
            </p>
            <div style={{display:'flex',border:`1.5px solid ${C.gris200}`,borderRadius:12,overflow:'hidden',marginBottom:4}}>
              <input
                type="number" inputMode="numeric" min="1" max="1000"
                placeholder="ej: 100"
                value={unidades}
                onChange={e => setUnidades(e.target.value)}
                style={{flex:1,padding:'12px 14px',border:'none',outline:'none',fontSize:16,fontWeight:600,color:C.gris900}}
              />
              <span style={{padding:'12px 14px',background:C.gris50,fontSize:13,color:C.gris600,borderLeft:`1px solid ${C.gris200}`,display:'flex',alignItems:'center'}}>
                unidades
              </span>
            </div>

            {/* Frecuencia — solo si NO hay unidades */}
            {!unidades && (
              <>
                <p style={{...fieldLabel,marginTop:16}}>¿Cada cuántos días lo compras?</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:8}}>
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

            {/* Preview recordatorio */}
            {proximaFecha() && (
              <div style={{background:'#F0FDF4',border:'1px solid #86EFAC',borderRadius:10,padding:'10px 14px',margin:'14px 0',fontSize:13,color:'#166534',lineHeight:1.5}}>
                🔔 Te recordamos comprar el <strong>{proximaFecha()}</strong>
                {unidades && <><br/><span style={{color:C.gris600,fontSize:12}}>{unidades} unidades ÷ {dosisDia}/día = {diasHastaAgotarse()} días de tratamiento</span></>}
              </div>
            )}

            {error && <p style={{color:C.rojo,fontSize:13,textAlign:'center',marginTop:8}}>{error}</p>}

            <button style={{...primaryBtn,opacity:loading?0.7:1,marginTop:4}} onClick={handleGuardar} disabled={loading}>
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
const dateInput = {width:'100%',padding:'12px 14px',border:`1.5px solid ${C.gris200}`,borderRadius:12,fontSize:15,color:C.gris900,outline:'none',boxSizing:'border-box',fontFamily:'inherit'};
const primaryBtn= {width:'100%',padding:'14px',background:C.verde,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer'};
