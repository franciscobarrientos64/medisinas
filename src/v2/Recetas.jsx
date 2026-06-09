import React, { useState, useEffect, useCallback } from "react";
import { getLocalUser } from "../UserAuth";

const PERIODICIDADES = ["única", "mensual", "trimestral", "semestral", "anual"];

function badgeVenc(fecha) {
  if (!fecha) return null;
  const d = Math.ceil((new Date(fecha) - new Date()) / 86400000);
  if (d < 0) return { txt: "Vencida", cls: "bg-error-container text-on-error-container" };
  if (d <= 15) return { txt: `Vence en ${d} días`, cls: "bg-[#C98A14]/15 text-[#C98A14]" };
  return { txt: "Vigente", cls: "bg-green-100 text-green-700" };
}

const vacio = { medicamentos: "", doctor_nombre: "", especialidad: "", fecha_emision: "", fecha_vencimiento: "", periodicidad: "mensual", diagnostico: "" };

export default function Recetas({ go }) {
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const user = getLocalUser();

  const cargar = useCallback(() => {
    if (!user?.id) { setLoading(false); return; }
    fetch(`/api/get-recetas?userId=${user.id}`).then((r) => r.json()).then((d) => { setRecetas(d.recetas || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    const meds = form.medicamentos.split(",").map((s) => s.trim()).filter(Boolean);
    if (!meds.length) return;
    setSaving(true);
    await fetch("/api/save-receta", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, medicamentos: meds, doctor_nombre: form.doctor_nombre, especialidad: form.especialidad, fecha_emision: form.fecha_emision || null, fecha_vencimiento: form.fecha_vencimiento || null, periodicidad: form.periodicidad, diagnostico: form.diagnostico }),
    });
    setSaving(false); setForm(null); cargar();
  };

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">description</span>
        <p className="text-body-md mb-4">Inicia sesión para guardar tus recetas médicas.</p>
        <button onClick={() => go("login")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Ingresar</button>
      </div>
    );
  }

  return (
    <div className="px-margin-page py-10 max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h1 className="font-display-lg text-display-lg text-on-surface">Mis recetas</h1>
          <p className="text-on-surface-variant text-body-md mt-1">Guarda tus recetas y controla su vigencia.</p>
        </div>
        <button onClick={() => setForm(vacio)} className="px-6 py-3 bg-primary text-white font-bold rounded-full flex items-center gap-2 shrink-0">
          <span className="material-symbols-outlined">add</span> Agregar
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
      ) : recetas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl text-outline mb-4">prescriptions</span>
          <p className="text-body-md">Aún no tienes recetas guardadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-gutter-grid">
          {recetas.map((r) => {
            const b = badgeVenc(r.fecha_vencimiento);
            return (
              <div key={r.id} className="clinical-card rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">{r.periodicidad || "—"}</span>
                  {b && <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${b.cls}`}>{b.txt}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(r.medicamentos || []).map((m, i) => <span key={i} className="px-2.5 py-0.5 bg-primary/10 text-primary rounded-full text-[12px] font-semibold">{m}</span>)}
                </div>
                <p className="text-body-sm text-on-surface-variant">{r.doctor_nombre ? `Dr(a). ${r.doctor_nombre}` : "Médico no indicado"}{r.especialidad ? ` · ${r.especialidad}` : ""}</p>
                {r.diagnostico && <p className="text-body-sm text-on-surface-variant mt-1">{r.diagnostico}</p>}
              </div>
            );
          })}
        </div>
      )}

      {form && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-[100] sm:p-4" onClick={() => setForm(null)}>
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">Agregar receta</h2>
            <div className="space-y-4">
              <div>
                <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Medicamentos (separados por coma)</label>
                <input className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md" value={form.medicamentos} onChange={(e) => setForm({ ...form, medicamentos: e.target.value })} placeholder="Losartán 50mg, Metformina 850mg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-label-caps text-on-surface-variant uppercase block mb-2">Médico</label><input className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md" value={form.doctor_nombre} onChange={(e) => setForm({ ...form, doctor_nombre: e.target.value })} /></div>
                <div><label className="text-label-caps text-on-surface-variant uppercase block mb-2">Especialidad</label><input className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-label-caps text-on-surface-variant uppercase block mb-2">Emisión</label><input type="date" className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md" value={form.fecha_emision} onChange={(e) => setForm({ ...form, fecha_emision: e.target.value })} /></div>
                <div><label className="text-label-caps text-on-surface-variant uppercase block mb-2">Vencimiento</label><input type="date" className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
              </div>
              <div>
                <label className="text-label-caps text-on-surface-variant uppercase block mb-2">Periodicidad</label>
                <select className="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg py-3 px-4 text-body-md capitalize" value={form.periodicidad} onChange={(e) => setForm({ ...form, periodicidad: e.target.value })}>
                  {PERIODICIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setForm(null)} className="flex-1 py-3 border-2 border-outline-variant text-on-surface-variant font-bold rounded-full">Cancelar</button>
              <button onClick={guardar} disabled={saving} className="flex-1 py-3 bg-primary text-white font-bold rounded-full disabled:opacity-50">{saving ? "Guardando…" : "Guardar"}</button>
            </div>
            <p className="text-[12px] text-on-surface-variant mt-3 text-center">La foto de la receta se podrá adjuntar próximamente.</p>
          </div>
        </div>
      )}
    </div>
  );
}
