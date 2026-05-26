import { useState, useEffect } from 'react';

const C = {
  verde:'#0A7B5E', verdeClaro:'#12A87E', verdePale:'#E8F7F3',
  azul:'#0B2D5E', blanco:'#FFFFFF', gris50:'#F9FAFB',
  gris100:'#F3F4F6', gris200:'#E5E7EB', gris400:'#9CA3AF',
  gris600:'#6B7280', gris900:'#111827', rojo:'#EF4444',
};

export function MisMedicamentosBtn({ user, onClick }) {
  if (!user) return null;
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:6,
      padding:'7px 13px', background:'rgba(255,255,255,0.15)',
      border:'1px solid rgba(255,255,255,0.3)', borderRadius:8,
      color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer',
      whiteSpace:'nowrap',
    }}>
      💊 Mis medicamentos
    </button>
  );
}

export function MisMedicamentosPanel({ user, open, onClose, onBuscar }) {
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [guardando, setGuardando]       = useState(null);

  useEffect(() => {
    if (open && user?.id) cargarMedicamentos();
  }, [open, user]);

  async function cargarMedicamentos() {
    setLoading(true);
    try {
      const res = await fetch(`/api/get-medicamentos?userId=${user.id}`);
      const data = await res.json();
      setMedicamentos(data.medicamentos || []);
    } catch {}
    finally { setLoading(false); }
  }

  async function eliminar(id) {
    setGuardando(id);
    try {
      await fetch('/api/delete-medicamento', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId: user.id, medicamentoId: id }),
      });
      setMedicamentos(prev => prev.filter(m => m.id !== id));
    } catch {}
    finally { setGuardando(null); }
  }

  if (!open) return null;
  document.body.style.overflow = 'hidden';
  const handleClose = () => { document.body.style.overflow = ''; onClose(); };

  return (
    <div style={overlay} onClick={handleClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={panelHeader}>
          <div>
            <h2 style={panelTitle}>💊 Mis medicamentos</h2>
            <p style={panelSub}>
              {user.nombre ? `${user.nombre}, aquí están tus medicamentos guardados.` : 'Tus medicamentos guardados.'}
            </p>
          </div>
          <button onClick={handleClose} style={closeBtn}>✕</button>
        </div>

        {/* Contenido */}
        <div style={panelBody}>
          {loading ? (
            <div style={empty}>
              <div style={{fontSize:32,marginBottom:8}}>⏳</div>
              <p>Cargando tus medicamentos...</p>
            </div>
          ) : medicamentos.length === 0 ? (
            <div style={empty}>
              <div style={{fontSize:48,marginBottom:12}}>💊</div>
              <p style={{fontWeight:600,color:C.gris900,marginBottom:6}}>Aún no tienes medicamentos guardados</p>
              <p style={{fontSize:13,color:C.gris400,lineHeight:1.5}}>
                Cuando busques un medicamento, toca 🔔 para guardarlo aquí y recibir alertas de precio.
              </p>
            </div>
          ) : (
            <>
              <p style={{fontSize:12,color:C.gris400,marginBottom:14}}>
                {medicamentos.length} medicamento{medicamentos.length !== 1 ? 's' : ''} guardado{medicamentos.length !== 1 ? 's' : ''}
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {medicamentos.map(med => (
                  <MedItem
                    key={med.id}
                    med={med}
                    onBuscar={() => { handleClose(); onBuscar(med); }}
                    onEliminar={() => eliminar(med.id)}
                    eliminando={guardando === med.id}
                    onCompreHoy={() => cargarMedicamentos()}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={panelFooter}>
          <p style={{fontSize:11,color:C.gris400,textAlign:'center',lineHeight:1.5}}>
            Próximamente: alertas de precio automáticas por WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}

function MedItem({ med, onBuscar, onEliminar, eliminando, onCompreHoy }) {
  const [comprando, setComprando] = useState(false);

  const proxima = () => {
    if (!med.ultima_compra || !med.frecuencia_dias) return null;
    const d = new Date(med.ultima_compra);
    d.setDate(d.getDate() + med.frecuencia_dias);
    return d;
  };

  const diasRestantes = () => {
    const p = proxima();
    if (!p) return null;
    return Math.ceil((p - Date.now()) / 86400000);
  };

  const dias = diasRestantes();
  const estaVencido = dias !== null && dias < 0;
  const estaPorVencer = dias !== null && dias >= 0 && dias <= 5;

  async function handleCompreHoy() {
    setComprando(true);
    try {
      await fetch('/api/compre-hoy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: med.usuario_id, medicamentoId: med.id }),
      });
      onCompreHoy?.();
    } catch {}
    finally { setComprando(false); }
  }

  return (
    <div style={{...itemCard, borderColor: estaVencido ? '#FCA5A5' : estaPorVencer ? '#FDE68A' : C.gris200}}>
      <div style={{flex:1}}>
        <p style={{fontSize:15,fontWeight:700,color:C.gris900,marginBottom:3}}>
          {med.nombre_producto}
        </p>
        <p style={{fontSize:12,color:C.gris600}}>
          {med.concent}{med.forma_farmaceutica ? ` · ${med.forma_farmaceutica}` : ''}
        </p>

        {/* Estado de recompra */}
        {dias !== null && (
          <p style={{fontSize:12,marginTop:5,fontWeight:600,
            color: estaVencido ? '#DC2626' : estaPorVencer ? '#D97706' : C.verde}}>
            {estaVencido
              ? `⚠️ Debías recomprar hace ${Math.abs(dias)} día${Math.abs(dias)!==1?'s':''}`
              : dias === 0
              ? '🔔 Recomprar hoy'
              : estaPorVencer
              ? `⏰ Recomprar en ${dias} día${dias!==1?'s':''}`
              : `✅ Próxima compra en ${dias} días`
            }
          </p>
        )}
        {!med.frecuencia_dias && (
          <p style={{fontSize:11,color:C.gris400,marginTop:3}}>Sin frecuencia configurada</p>
        )}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
        <button onClick={onBuscar} style={btnBuscar}>🔍 Ver precio</button>
        <button onClick={handleCompreHoy} disabled={comprando} style={btnCompre}>
          {comprando ? '...' : '✅ Compré'}
        </button>
        <button onClick={onEliminar} disabled={eliminando} style={btnEliminar}>
          {eliminando ? '...' : '🗑'}
        </button>
      </div>
    </div>
  );
}

// ── Función helper para guardar desde resultados ──────────────────────────────
export async function guardarMedicamento(userId, variante) {
  try {
    const res = await fetch('/api/save-medicamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, medicamento: variante }),
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const overlay    = {position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',zIndex:9998,display:'flex',alignItems:'flex-end',justifyContent:'center'};
const panel      = {background:C.blanco,width:'100%',maxWidth:520,borderRadius:'24px 24px 0 0',display:'flex',flexDirection:'column',maxHeight:'85vh'};
const panelHeader= {padding:'20px 24px 16px',borderBottom:`1px solid ${C.gris200}`,display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexShrink:0};
const panelTitle = {fontSize:18,fontWeight:700,color:C.gris900,marginBottom:4};
const panelSub   = {fontSize:13,color:C.gris600};
const closeBtn   = {background:'none',border:'none',fontSize:18,color:C.gris400,cursor:'pointer',padding:4,flexShrink:0};
const panelBody  = {flex:1,overflowY:'auto',padding:'16px 24px'};
const panelFooter= {padding:'12px 24px 28px',borderTop:`1px solid ${C.gris200}`,flexShrink:0};
const empty      = {textAlign:'center',padding:'40px 20px',color:C.gris600};
const itemCard   = {background:C.gris50,border:`1px solid ${C.gris200}`,borderRadius:12,padding:'14px 16px',display:'flex',gap:12,alignItems:'flex-start'};
const btnBuscar  = {padding:'7px 14px',background:C.verde,color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'};
const btnEliminar= {padding:'6px 10px',background:'none',border:`1px solid ${C.gris200}`,borderRadius:8,fontSize:14,cursor:'pointer',color:C.gris400};
const btnCompre  = {padding:'6px 10px',background:'#F0FDF4',border:`1px solid #86EFAC`,borderRadius:8,fontSize:12,cursor:'pointer',color:'#166534',fontWeight:600,whiteSpace:'nowrap'};
