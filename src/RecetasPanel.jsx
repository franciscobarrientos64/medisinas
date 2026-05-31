import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const C = {
  verde:'#0A7B5E', verdePale:'#E8F7F3', verdeClaro:'#12A87E',
  azul:'#0B2D5E', blanco:'#FFFFFF', gris50:'#F9FAFB',
  gris100:'#F3F4F6', gris200:'#E5E7EB', gris400:'#9CA3AF',
  gris600:'#6B7280', gris900:'#111827', rojo:'#EF4444',
  morado:'#7C3AED', moradoPale:'#EDE9FE',
};

const PERIODICIDADES = [
  { value:'unica',      label:'Única vez',   icon:'1️⃣' },
  { value:'mensual',    label:'Mensual',      icon:'📅' },
  { value:'trimestral', label:'Trimestral',   icon:'🗓' },
  { value:'semestral',  label:'Semestral',    icon:'📆' },
  { value:'anual',      label:'Anual',        icon:'🗂' },
];

const ESPECIALIDADES = [
  'Medicina general','Cardiología','Endocrinología','Neurología',
  'Traumatología','Gastroenterología','Neumología','Psiquiatría',
  'Reumatología','Nefrología','Otra',
];

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// ── Panel principal ───────────────────────────────────────────────────────────
export function RecetasPanel({ open, onClose, user }) {
  const [vista, setVista]         = useState('lista'); // 'lista' | 'nueva'
  const [recetas, setRecetas]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [recetaVer, setRecetaVer] = useState(null);

  useEffect(() => {
    if (open && user?.id) cargarRecetas();
  }, [open, user]);

  async function cargarRecetas() {
    setLoading(true);
    try {
      const res = await fetch(`/api/get-recetas?userId=${user.id}`);
      const data = await res.json();
      setRecetas(data.recetas || []);
    } catch {}
    setLoading(false);
  }

  if (!open) return null;
  document.body.style.overflow = 'hidden';
  const handleClose = () => { document.body.style.overflow = ''; onClose(); };

  return (
    <div style={overlay} onClick={handleClose}>
      <div style={panel} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={panelHeader}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            {vista !== 'lista' && (
              <button onClick={() => setVista('lista')} style={backBtn}>←</button>
            )}
            <div>
              <h2 style={panelTitle}>
                {vista === 'lista' ? '📋 Mis recetas' : vista === 'nueva' ? 'Nueva receta' : 'Receta'}
              </h2>
              {vista === 'lista' && <p style={panelSub}>Tus recetas médicas guardadas</p>}
            </div>
          </div>
          <button onClick={handleClose} style={closeBtn}>✕</button>
        </div>

        {/* Contenido */}
        <div style={panelBody}>
          {vista === 'lista' && (
            <ListaRecetas
              recetas={recetas}
              loading={loading}
              onNueva={() => setVista('nueva')}
              onVer={r => setRecetaVer(r)}
              onEliminar={async (id) => {
                await fetch('/api/save-receta', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({userId:user.id, recetaId:id}) });
                setRecetas(prev => prev.filter(r => r.id !== id));
              }}
            />
          )}
          {vista === 'nueva' && (
            <NuevaReceta
              user={user}
              onSuccess={() => { cargarRecetas(); setVista('lista'); }}
              onCancel={() => setVista('lista')}
            />
          )}
        </div>

        {/* Ver foto grande */}
        {recetaVer && (
          <div style={{...overlay, zIndex:99999}} onClick={() => setRecetaVer(null)}>
            <div style={{background:'#fff',borderRadius:16,padding:20,maxWidth:500,width:'95%',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}>
                <h3 style={{fontWeight:700,color:C.gris900}}>📋 Receta médica</h3>
                <button onClick={() => setRecetaVer(null)} style={closeBtn}>✕</button>
              </div>
              {recetaVer.foto_url && (
                <img src={recetaVer.foto_url} alt="Receta" style={{width:'100%',borderRadius:10,marginBottom:14,border:`1px solid ${C.gris200}`}}/>
              )}
              <RecetaDetalle receta={recetaVer}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lista de recetas ──────────────────────────────────────────────────────────
function ListaRecetas({ recetas, loading, onNueva, onVer, onEliminar }) {
  if (loading) return <div style={empty}><div style={{fontSize:32}}>⏳</div><p>Cargando...</p></div>;

  return (
    <>
      <button style={btnNueva} onClick={onNueva}>+ Nueva receta</button>
      {recetas.length === 0 ? (
        <div style={empty}>
          <div style={{fontSize:52,marginBottom:10}}>📋</div>
          <p style={{fontWeight:600,color:C.gris900,marginBottom:6}}>Sin recetas guardadas</p>
          <p style={{fontSize:13,color:C.gris400,lineHeight:1.5}}>
            Guarda tus recetas médicas para tener todo en un solo lugar.
          </p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {recetas.map(r => <RecetaCard key={r.id} receta={r} onVer={() => onVer(r)} onEliminar={() => onEliminar(r.id)}/>)}
        </div>
      )}
    </>
  );
}

// ── Tarjeta de receta ─────────────────────────────────────────────────────────
function RecetaCard({ receta, onVer, onEliminar }) {
  const vence = receta.fecha_vencimiento ? new Date(receta.fecha_vencimiento) : null;
  const diasVence = vence ? Math.ceil((vence - Date.now()) / 86400000) : null;
  const vencida = diasVence !== null && diasVence < 0;
  const porVencer = diasVence !== null && diasVence >= 0 && diasVence <= 7;

  const periodo = PERIODICIDADES.find(p => p.value === receta.periodicidad);

  return (
    <div style={{...itemCard, borderColor: vencida?'#FCA5A5':porVencer?'#FDE68A':C.gris200}}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        {/* Foto thumbnail */}
        <div style={fotoThumb} onClick={onVer}>
          {receta.foto_url
            ? <img src={receta.foto_url} alt="Receta" style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:8}}/>
            : <span style={{fontSize:28}}>📋</span>
          }
        </div>
        <div style={{flex:1}}>
          <p style={{fontWeight:700,fontSize:14,color:C.gris900,marginBottom:3}}>
            {receta.medicamentos?.join(' · ') || 'Sin medicamentos'}
          </p>
          {receta.doctor_nombre && (
            <p style={{fontSize:12,color:C.gris600,marginBottom:2}}>👨‍⚕️ {receta.doctor_nombre}{receta.especialidad?` · ${receta.especialidad}`:''}</p>
          )}
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
            {periodo && (
              <span style={tagChip}>{periodo.icon} {periodo.label}</span>
            )}
            {receta.cantidad_por_periodo && (
              <span style={tagChip}>📦 {receta.cantidad_por_periodo} u.</span>
            )}
          </div>
          {diasVence !== null && (
            <p style={{fontSize:11,marginTop:4,fontWeight:600,color:vencida?C.rojo:porVencer?'#D97706':C.gris400}}>
              {vencida ? `❌ Venció hace ${Math.abs(diasVence)} días`
               : diasVence === 0 ? '⚠️ Vence hoy'
               : porVencer ? `⚠️ Vence en ${diasVence} días`
               : `✅ Válida hasta ${vence?.toLocaleDateString('es-PE',{day:'numeric',month:'long'})}`}
            </p>
          )}
        </div>
        <button onClick={onEliminar} style={btnElim}>🗑</button>
      </div>
    </div>
  );
}

// ── Detalle de receta ─────────────────────────────────────────────────────────
function RecetaDetalle({ receta }) {
  const periodo = PERIODICIDADES.find(p => p.value === receta.periodicidad);
  const rows = [
    ['Medicamentos', receta.medicamentos?.join(', ')],
    ['Médico', receta.doctor_nombre],
    ['Especialidad', receta.especialidad],
    ['Diagnóstico', receta.diagnostico],
    ['Periodicidad', periodo ? `${periodo.icon} ${periodo.label}` : null],
    ['Cantidad por período', receta.cantidad_por_periodo ? `${receta.cantidad_por_periodo} unidades` : null],
    ['Fecha emisión', receta.fecha_emision ? new Date(receta.fecha_emision+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'}) : null],
    ['Fecha vencimiento', receta.fecha_vencimiento ? new Date(receta.fecha_vencimiento+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'}) : null],
    ['Notas', receta.notas],
  ].filter(([,v]) => v);

  return (
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {rows.map(([label, valor]) => (
        <div key={label} style={{display:'flex',gap:8}}>
          <span style={{fontSize:12,color:C.gris400,minWidth:120,flexShrink:0}}>{label}</span>
          <span style={{fontSize:13,color:C.gris900,fontWeight:500}}>{valor}</span>
        </div>
      ))}
    </div>
  );
}

// ── Formulario nueva receta ───────────────────────────────────────────────────
function NuevaReceta({ user, onSuccess, onCancel }) {
  const [foto, setFoto]               = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [medicamentos, setMedicamentos] = useState(['']);
  const [doctor, setDoctor]           = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVence, setFechaVence]   = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [periodicidad, setPeriodicidad] = useState('mensual');
  const [cantidad, setCantidad]       = useState('');
  const [notas, setNotas]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const fileRef = useRef(null);

  function handleFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFoto(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function subirFoto() {
    if (!foto) return null;
    try {
      const ext = foto.name.split('.').pop();
      const path = `recetas/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('recetas').upload(path, foto, { contentType: foto.type });
      if (error) return null;
      const { data } = supabase.storage.from('recetas').getPublicUrl(path);
      return data.publicUrl;
    } catch { return null; }
  }

  async function handleGuardar() {
    const meds = medicamentos.filter(m => m.trim());
    if (!meds.length) { setError('Agrega al menos un medicamento.'); return; }
    setLoading(true); setError('');
    try {
      const foto_url = await subirFoto();
      const res = await fetch('/api/save-receta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          foto_url,
          medicamentos: meds,
          doctor_nombre: doctor || null,
          especialidad: especialidad || null,
          fecha_emision: fechaEmision || null,
          fecha_vencimiento: fechaVence || null,
          diagnostico: diagnostico || null,
          periodicidad,
          cantidad_por_periodo: parseInt(cantidad) || null,
          notas: notas || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar.'); return; }
      onSuccess();
    } catch { setError('Error de red.'); }
    finally { setLoading(false); }
  }

  const hoy = new Date().toISOString().split('T')[0];

  return (
    <div style={{paddingBottom:20}}>
      {/* Foto */}
      <p style={fieldLabel}>Foto de la receta</p>
      <div style={fotoUploadArea} onClick={() => fileRef.current?.click()}>
        {fotoPreview
          ? <img src={fotoPreview} alt="Receta" style={{width:'100%',maxHeight:200,objectFit:'contain',borderRadius:8}}/>
          : <><span style={{fontSize:36}}>📷</span><p style={{fontSize:13,color:C.gris600,margin:'8px 0 0'}}>Toca para tomar foto o elegir archivo</p></>
        }
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{display:'none'}}/>
      </div>

      {/* Medicamentos */}
      <p style={{...fieldLabel,marginTop:16}}>Medicamentos *</p>
      {medicamentos.map((m, i) => (
        <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
          <input style={inputStyle} type="text" placeholder={`Medicamento ${i+1}`}
            value={m} onChange={e => { const arr=[...medicamentos]; arr[i]=e.target.value; setMedicamentos(arr); }}/>
          {medicamentos.length > 1 && (
            <button onClick={() => setMedicamentos(medicamentos.filter((_,j)=>j!==i))}
              style={{padding:'8px 10px',border:`1px solid ${C.gris200}`,borderRadius:8,background:'none',cursor:'pointer',color:C.rojo}}>✕</button>
          )}
        </div>
      ))}
      <button style={btnAgregarMed} onClick={() => setMedicamentos([...medicamentos,''])}>+ Agregar medicamento</button>

      {/* Médico */}
      <p style={{...fieldLabel,marginTop:14}}>Médico tratante</p>
      <input style={inputStyle} type="text" placeholder="Dr. Juan Pérez" value={doctor} onChange={e=>setDoctor(e.target.value)}/>

      {/* Especialidad */}
      <p style={{...fieldLabel,marginTop:12}}>Especialidad</p>
      <select style={inputStyle} value={especialidad} onChange={e=>setEspecialidad(e.target.value)}>
        <option value="">Seleccionar...</option>
        {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
      </select>

      {/* Diagnóstico */}
      <p style={{...fieldLabel,marginTop:12}}>Diagnóstico</p>
      <input style={inputStyle} type="text" placeholder="Ej: Hipertensión arterial" value={diagnostico} onChange={e=>setDiagnostico(e.target.value)}/>

      {/* Fechas */}
      <div style={{display:'flex',gap:10,marginTop:12}}>
        <div style={{flex:1}}>
          <p style={fieldLabel}>Fecha de emisión</p>
          <input style={inputStyle} type="date" max={hoy} value={fechaEmision} onChange={e=>setFechaEmision(e.target.value)}/>
        </div>
        <div style={{flex:1}}>
          <p style={fieldLabel}>Fecha de vencimiento</p>
          <input style={inputStyle} type="date" min={hoy} value={fechaVence} onChange={e=>setFechaVence(e.target.value)}/>
        </div>
      </div>

      {/* Periodicidad */}
      <p style={{...fieldLabel,marginTop:14}}>Periodicidad</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:4}}>
        {PERIODICIDADES.map(p => (
          <button key={p.value} onClick={() => setPeriodicidad(p.value)} style={{
            padding:'8px 14px', borderRadius:20,
            border:`2px solid ${periodicidad===p.value?C.verde:C.gris200}`,
            background: periodicidad===p.value?C.verdePale:C.blanco,
            color: periodicidad===p.value?C.verde:C.gris600,
            fontSize:13, fontWeight:600, cursor:'pointer',
          }}>
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* Cantidad */}
      <p style={{...fieldLabel,marginTop:12}}>Cantidad por período</p>
      <div style={{display:'flex',border:`1.5px solid ${C.gris200}`,borderRadius:12,overflow:'hidden'}}>
        <input style={{flex:1,padding:'11px 14px',border:'none',outline:'none',fontSize:15,fontWeight:600,color:C.gris900}}
          type="number" inputMode="numeric" min="1" placeholder="Ej: 30"
          value={cantidad} onChange={e=>setCantidad(e.target.value)}/>
        <span style={{padding:'11px 14px',background:C.gris50,fontSize:13,color:C.gris600,borderLeft:`1px solid ${C.gris200}`,display:'flex',alignItems:'center'}}>unidades</span>
      </div>

      {/* Notas */}
      <p style={{...fieldLabel,marginTop:12}}>Notas adicionales</p>
      <textarea style={{...inputStyle,minHeight:60,resize:'vertical'}} placeholder="Ej: Tomar con alimentos, horario específico..."
        value={notas} onChange={e=>setNotas(e.target.value)}/>

      {error && <p style={{color:C.rojo,fontSize:13,textAlign:'center',marginTop:8}}>{error}</p>}

      <button style={{...btnGuardar,opacity:loading?0.7:1,marginTop:16}} onClick={handleGuardar} disabled={loading}>
        {loading ? 'Guardando...' : '💾 Guardar receta'}
      </button>
    </div>
  );
}

/* ── Styles ── */
const overlay      = {position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',backdropFilter:'blur(3px)',zIndex:9998,display:'flex',alignItems:'flex-end',justifyContent:'center'};
const panel        = {background:C.blanco,width:'100%',maxWidth:520,borderRadius:'24px 24px 0 0',display:'flex',flexDirection:'column',maxHeight:'92vh'};
const panelHeader  = {padding:'14px 20px 12px',borderBottom:`1px solid ${C.gris200}`,display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0};
const panelTitle   = {fontSize:17,fontWeight:700,color:C.gris900,marginBottom:2};
const panelSub     = {fontSize:12,color:C.gris600};
const closeBtn     = {background:'none',border:'none',fontSize:18,color:C.gris400,cursor:'pointer',padding:4};
const backBtn      = {background:'none',border:'none',fontSize:18,color:C.azul,cursor:'pointer',padding:4,fontWeight:700};
const panelBody    = {flex:1,overflowY:'auto',padding:'16px 20px 30px'};
const empty        = {textAlign:'center',padding:'40px 20px',color:C.gris600};
const itemCard     = {background:C.gris50,border:`1px solid ${C.gris200}`,borderRadius:12,padding:'12px 14px'};
const fotoThumb    = {width:60,height:60,borderRadius:8,background:C.gris100,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,overflow:'hidden',border:`1px solid ${C.gris200}`};
const tagChip      = {display:'inline-block',background:C.verdePale,color:C.verde,fontSize:11,fontWeight:600,padding:'2px 8px',borderRadius:10,border:`1px solid #A7F3D0`};
const btnElim      = {padding:'6px 10px',background:'none',border:`1px solid ${C.gris200}`,borderRadius:8,fontSize:14,cursor:'pointer',color:C.gris400,flexShrink:0};
const btnNueva     = {width:'100%',padding:'12px',background:C.azul,color:'#fff',border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer',marginBottom:14};
const fotoUploadArea = {border:`2px dashed ${C.gris200}`,borderRadius:12,padding:16,textAlign:'center',cursor:'pointer',background:C.gris50,marginBottom:4};
const fieldLabel   = {fontSize:12,fontWeight:600,color:C.gris600,marginBottom:6};
const inputStyle   = {width:'100%',padding:'11px 14px',border:`1.5px solid ${C.gris200}`,borderRadius:10,fontSize:14,color:C.gris900,outline:'none',boxSizing:'border-box',fontFamily:'inherit',marginBottom:0};
const btnAgregarMed = {padding:'7px 14px',background:C.verdePale,border:`1px solid #A7F3D0`,borderRadius:8,color:C.verde,fontSize:13,fontWeight:600,cursor:'pointer',marginBottom:4};
const btnGuardar   = {width:'100%',padding:'14px',background:C.verde,color:'#fff',border:'none',borderRadius:12,fontSize:15,fontWeight:600,cursor:'pointer'};
