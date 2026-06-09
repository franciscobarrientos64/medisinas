import React, { useState } from "react";
import { getLocalUser } from "../UserAuth";

const PARENTESCOS = ["yo", "madre", "padre", "hijo", "hija", "pareja", "abuelo", "abuela", "otro"];
const CONDICIONES = ["Diabetes", "Hipertensión", "Asma", "Colesterol alto", "Tiroides", "Artritis"];
const COLORES = ["#3c51c2", "#8135c5", "#00A878", "#FF6B35", "#FFB800", "#ba1a1a"];

const vacio = { nombre: "", parentesco: "otro", genero: "", anio_nacimiento: "", condiciones: [], alergias: [], color: COLORES[0] };

export default function Familia({ go, personas = [], onRefresh }) {
  const [editando, setEditando] = useState(null); // null | objeto persona
  const [form, setForm] = useState(vacio);
  const [saving, setSaving] = useState(false);
  const user = getLocalUser();

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">group</span>
        <p className="text-body-md mb-4">Inicia sesión para gestionar a las personas a tu cargo.</p>
        <button onClick={() => go("login")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Ingresar</button>
      </div>
    );
  }

  const abrirNueva = () => { setForm(vacio); setEditando("nueva"); };
  const abrirEditar = (p) => {
    setForm({ nombre: p.nombre || "", parentesco: p.parentesco || "otro", genero: p.genero || "", anio_nacimiento: p.anio_nacimiento || "", condiciones: p.condiciones || [], alergias: p.alergias || [], color: p.color || COLORES[0] });
    setEditando(p);
  };

  const toggleCondicion = (c) => setForm((f) => ({ ...f, condiciones: f.condiciones.includes(c) ? f.condiciones.filter((x) => x !== c) : [...f.condiciones, c] }));

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    const body = {
      userId: user.id,
      id: editando && editando !== "nueva" ? editando.id : undefined,
      nombre: form.nombre.trim(),
      parentesco: form.parentesco,
      genero: form.genero || null,
      anio_nacimiento: form.anio_nacimiento ? Number(form.anio_nacimiento) : null,
      condiciones: form.condiciones,
      alergias: form.alergias,
      color: form.color,
    };
    await fetch("/api/save-persona", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setEditando(null);
    onRefresh && onRefresh();
  };

  const eliminar = async (p) => {
    if (p.es_titular) return;
    if (!window.confirm(`¿Eliminar a ${p.nombre}?`)) return;
    await fetch("/api/delete-persona", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, personaId: p.id }) });
    onRefresh && onRefresh();
  };

  return (
    <div className="px-margin-page py-10 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface">Mi familia</h1>
          <p className="text-on-surface-variant text-body-md mt-1">Las personas para quienes compras medicinas.</p>
        </div>
        <button onClick={abrirNueva} className="px-6 py-3 bg-primary text-white font-bold rounded-full flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined">person_add</span> Agregar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter-grid">
        {personas.map((p) => (
          <div key={p.id} className="clinical-card rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[18px] font-bold" style={{ background: p.color || "#3c51c2" }}>{(p.nombre || "?")[0].toUpperCase()}</span>
                <div>
                  <h3 className="font-headline-lg text-[20px] text-on-surface">{p.nombre}</h3>
                  <p className="text-body-sm text-on-surface-variant capitalize">{p.es_titular ? "Titular (tú)" : p.parentesco}{p.anio_nacimiento ? ` · ${new Date().getFullYear() - p.anio_nacimiento} años` : ""}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => abrirEditar(p)} className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                {!p.es_titular && <button onClick={() => eliminar(p)} className="w-9 h-9 rounded-full hover:bg-error-container flex items-center justify-center text-error"><span className="material-symbols-outlined text-[20px]">delete</span></button>}
              </div>
            </div>
            {(p.condiciones?.length > 0 || p.alergias?.length > 0) && (
              <div className="flex gap-1.5 flex-wrap mt-4">
                {(p.condiciones || []).map((c) => <span key={c} className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[11px] font-semibold">{c}</span>)}
                {(p.alergias || []).map((a) => <span key={a} className="px-2.5 py-0.5 bg-error-container text-on-error-container rounded-full text-[11px] font-semibold">Alergia: {a}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal form */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">{editando === "nueva" ? "Agregar persona" : "Editar persona"}</h2>
            <div className="space-y-5">
              <div>
                <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Nombre o apodo</label>
                <input className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md focus:ring-2 focus:ring-primary/20" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Mamá, Lucía" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Parentesco</label>
                  <select className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md capitalize" value={form.parentesco} onChange={(e) => setForm({ ...form, parentesco: e.target.value })} disabled={editando !== "nueva" && editando.es_titular}>
                    {PARENTESCOS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Año nac.</label>
                  <input type="number" className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md" value={form.anio_nacimiento} onChange={(e) => setForm({ ...form, anio_nacimiento: e.target.value })} placeholder="1955" />
                </div>
              </div>
              <div>
                <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Género</label>
                <div className="flex gap-2">
                  {["Femenino", "Masculino", "Otro"].map((g) => (
                    <button key={g} onClick={() => setForm({ ...form, genero: g })} className={`px-4 py-2 rounded-full text-body-sm ${form.genero === g ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}>{g}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Condiciones crónicas</label>
                <div className="flex gap-2 flex-wrap">
                  {CONDICIONES.map((c) => (
                    <button key={c} onClick={() => toggleCondicion(c)} className={`px-3 py-1.5 rounded-full text-body-sm ${form.condiciones.includes(c) ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant"}`}>{c}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Color</label>
                <div className="flex gap-2">
                  {COLORES.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })} className={`w-9 h-9 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-on-surface" : ""}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditando(null)} className="flex-1 py-3 border-2 border-outline-variant text-on-surface-variant font-bold rounded-full">Cancelar</button>
              <button onClick={guardar} disabled={saving || !form.nombre.trim()} className="flex-1 py-3 bg-primary text-white font-bold rounded-full disabled:opacity-50">{saving ? "Guardando…" : "Guardar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
