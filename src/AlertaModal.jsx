import { useState } from 'react';

const C = {
  verde:'#0A7B5E', verdePale:'#E8F7F3', verdeClaro:'#12A87E',
  blanco:'#FFFFFF', gris50:'#F9FAFB', gris200:'#E5E7EB',
  gris400:'#9CA3AF', gris600:'#6B7280', gris900:'#111827',
  rojo:'#EF4444', amarillo:'#F59E0B',
};

export function AlertaBtn({ onClick, activa }) {
  return (
    <button onClick={onClick} title={activa ? 'Alerta activa' : 'Crear alerta de precio'}
      style={{
        padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer',
        background: activa ? C.verdePale : C.gris50,
        color: activa ? C.verde : C.gris600,
        fontSize:16, transition:'all .15s',
      }}>
      {activa ? '🔔' : '🔕'}
    </button>
  );
}

export function AlertaModal({ open, onClose, variante, precioActual, distrito, user, onSuccess }) {
  const sugerido = precioActual ? Math.max(0.01, (precioActual * 0.9)).toFixed(2) : '';
  const [precio, setPrecio]   = useState(sugerido);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [ok, setOk]           = useState(false);

  if (!open) return null;
  document.body.style.overflow = 'hidden';
  const handleClose = () => { document.body.style.overflow = ''; setOk(false); setError(''); onClose(); };

  async function handleGuardar() {
    setError('');
    const p = parseFloat(precio);
    if (!precio || isNaN(p) || p <= 0) { setError('Ingresa un precio válido.'); return; }
    if (precioActual && p >= precioActual) {
      setError(`El precio objetivo debe ser menor al actual (S/ ${precioActual.toFixed(2)}).`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/save-alerta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          telefono: user.telefono,
          nombre_producto: variante.nombreProducto,
          concent: variante.concent,
          grupo: variante.grupo,
          cod_grupo_ff: String(variante.codGrupoFF),
          precio_objetivo: p,
          distrito: distrito || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar.'); return; }
      setOk(true);
      onSuccess?.();
    } catch { setError('Error de red. Intenta de nuevo.'); }
    finally { setLoading(false); }
  }

  return (
    <div style={overlay} onClick={handleClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={bar}/>
        <button onClick={handleClose} style={closeBtn}>✕</button>

        {ok ? (
          /* ── Confirmación ── */
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:52,marginBottom:12}}>🔔</div>
            <h2 style={title}>¡Alerta activada!</h2>
            <p style={{...subtitle,marginBottom:20}}>
              Te avisaremos por WhatsApp al{' '}
              <strong>{user.telefono}</strong>{' '}
              cuando <strong>{variante.nombreProducto} {variante.concent}</strong>{' '}
              baje de <strong style={{color:C.verde}}>S/ {parseFloat(precio).toFixed(2)}</strong>
              {distrito ? ` en ${distrito}` : ''}.
            </p>
            <button style={primaryBtn} onClick={handleClose}>Entendido</button>
          </div>
        ) : (
          /* ── Formulario ── */
          <>
            <div style={{textAlign:'center',marginBottom:16}}>
              <span style={{fontSize:36}}>🔔</span>
              <h2 style={title}>Alerta de precio</h2>
              <p style={subtitle}>
                <strong>{variante?.nombreProducto} {variante?.concent}</strong>
              </p>
            </div>

            {precioActual && (
              <div style={precioActualBadge}>
                Precio actual más bajo:&nbsp;
                <strong style={{color:C.verde}}>S/ {precioActual.toFixed(2)}</strong>
                {distrito ? ` en ${distrito}` : ''}
              </div>
            )}

            <p style={fieldLabel}>Avísame cuando baje de:</p>
            <div style={inputRow}>
              <span style={prefijo}>S/</span>
              <input
                style={montoInput}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={precio}
                onChange={e => setPrecio(e.target.value)}
                autoFocus
              />
            </div>

            {precioActual && parseFloat(precio) && (
              <p style={ahorroText}>
                Ahorrarías{' '}
                <strong style={{color:C.verde}}>
                  S/ {(precioActual - parseFloat(precio)).toFixed(2)}
                </strong>{' '}
                ({Math.round((1 - parseFloat(precio)/precioActual)*100)}% menos)
              </p>
            )}

            <p style={fieldLabel}>Ubicación</p>
            <div style={distritoTag}>
              📍 {distrito || 'Todo Lima'}
            </div>

            <p style={whatsappNote}>
              📱 Recibirás un WhatsApp al{' '}
              <strong>{user?.telefono}</strong>
            </p>

            {error && <p style={errText}>{error}</p>}

            <button
              style={{...primaryBtn, opacity: loading ? 0.7 : 1}}
              onClick={handleGuardar}
              disabled={loading}
            >
              {loading ? 'Guardando…' : 'Activar alerta'}
            </button>

            <p style={{fontSize:11,color:C.gris400,textAlign:'center',marginTop:12,lineHeight:1.5}}>
              Revisamos precios cada mañana. Puedes cancelar la alerta en cualquier momento.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Styles ── */
const overlay      = {position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',zIndex:9999,display:'flex',alignItems:'flex-end',justifyContent:'center'};
const sheet        = {background:C.blanco,width:'100%',maxWidth:460,borderRadius:'24px 24px 0 0',padding:'12px 24px 40px',position:'relative',maxHeight:'90vh',overflowY:'auto'};
const bar          = {width:40,height:4,background:C.gris200,borderRadius:2,margin:'0 auto 20px'};
const closeBtn     = {position:'absolute',top:16,right:20,background:'none',border:'none',fontSize:18,color:C.gris400,cursor:'pointer'};
const title        = {fontSize:20,fontWeight:700,color:C.gris900,textAlign:'center',marginBottom:4};
const subtitle     = {fontSize:13,color:C.gris600,textAlign:'center',marginBottom:0,lineHeight:1.5};
const precioActualBadge = {background:C.verdePale,border:`1px solid #A7F3D0`,borderRadius:10,padding:'8px 14px',fontSize:13,color:C.gris900,textAlign:'center',marginBottom:16};
const fieldLabel   = {fontSize:12,fontWeight:600,color:C.gris600,marginBottom:8,marginTop:16};
const inputRow     = {display:'flex',border:`2px solid ${C.verde}`,borderRadius:12,overflow:'hidden',marginBottom:6};
const prefijo      = {padding:'14px 14px',background:C.verdePale,fontSize:16,fontWeight:700,color:C.verde,borderRight:`1px solid #A7F3D0`};
const montoInput   = {flex:1,padding:'14px 14px',border:'none',outline:'none',fontSize:22,fontWeight:700,color:C.gris900};
const ahorroText   = {fontSize:12,color:C.gris600,marginBottom:0,textAlign:'center'};
const distritoTag  = {background:C.gris50,border:`1px solid ${C.gris200}`,borderRadius:8,padding:'8px 14px',fontSize:13,color:C.gris600};
const whatsappNote = {fontSize:12,color:C.gris600,marginTop:12,padding:'8px 14px',background:'#F0FDF4',borderRadius:8,border:'1px solid #BBF7D0'};
const errText      = {color:C.rojo,fontSize:13,textAlign:'center',marginTop:8};
const primaryBtn   = {width:'100%',padding:'14px',background:C.verde,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer',marginTop:14};
