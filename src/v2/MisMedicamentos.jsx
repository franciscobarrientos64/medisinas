import React, { useState, useEffect, useCallback } from "react";
import { getLocalUser } from "../UserAuth";

function diasRestantes(m) {
  const hoy = new Date();
  if (m.proxima_compra) return Math.ceil((new Date(m.proxima_compra) - hoy) / 86400000);
  if (m.frecuencia_dias && m.ultima_compra) {
    const prox = new Date(m.ultima_compra);
    prox.setDate(prox.getDate() + m.frecuencia_dias);
    return Math.ceil((prox - hoy) / 86400000);
  }
  return null;
}

function estadoColor(d) {
  if (d === null) return { cls: "bg-surface-container-high", txt: "text-on-surface-variant", label: "Sin recordatorio" };
  if (d <= 0) return { cls: "bg-error", txt: "text-error", label: "Ya se te acabó" };
  if (d <= 7) return { cls: "bg-[#C98A14]", txt: "text-[#C98A14]", label: `Te queda ${d} día${d === 1 ? "" : "s"}` };
  return { cls: "bg-[#1F8A53]", txt: "text-[#1F8A53]", label: `Te alcanza ${d} días` };
}

export default function MisMedicamentos({ go, activePersona }) {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const user = getLocalUser();

  const cargar = useCallback(() => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true); setError(false);
    const qs = new URLSearchParams({ userId: user.id, ...(activePersona?.id ? { personaId: activePersona.id } : {}) });
    fetch(`/api/data?action=get-medicamentos&${qs}`, { signal: AbortSignal.timeout(20000) })
      .then((r) => r.json())
      .then((d) => { setMeds(d.medicamentos || []); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [user, activePersona]);

  useEffect(() => { cargar(); }, [cargar]);

  const compreHoy = async (m) => {
    await fetch("/api/data?action=compre-hoy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, medicamentoId: m.id }) });
    cargar();
  };
  const eliminar = async (m) => {
    if (!window.confirm(`¿Quitar ${m.nombre_producto}?`)) return;
    await fetch("/api/data?action=delete-medicamento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, medicamentoId: m.id }) });
    cargar();
  };
  const setRecordatorio = async (m, freq) => {
    await fetch("/api/data?action=set-recordatorio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, medicamentoId: m.id, frecuenciaDias: freq || null }) });
    cargar();
  };

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">medication</span>
        <p className="text-body-md mb-4">Inicia sesión para ver tus medicinas guardadas.</p>
        <button onClick={() => go("login")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Ingresar</button>
      </div>
    );
  }

  const ordenados = [...meds].sort((a, b) => (diasRestantes(a) ?? 999) - (diasRestantes(b) ?? 999));

  return (
    <div className="px-margin-page py-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Mis medicinas</h1>
        <p className="text-on-surface-variant text-body-md mt-1">{activePersona ? `De ${activePersona.nombre}. ` : ""}Te avisamos antes de que se te acaben.</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          <p className="text-body-sm">Cargando tus medicinas…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl text-error mb-4">cloud_off</span>
          <p className="text-body-md mb-4">Tardó demasiado en cargar. Revisa tu conexión e intenta de nuevo.</p>
          <button onClick={cargar} className="px-8 py-3 bg-primary text-white font-bold rounded-full flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">refresh</span> Reintentar</button>
        </div>
      ) : ordenados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl text-outline mb-4">inventory_2</span>
          <p className="text-body-md mb-4">Aún no guardas ninguna medicina.</p>
          <button onClick={() => go("home")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Buscar mi primera medicina</button>
        </div>
      ) : (
        <div className="space-y-4">
          {ordenados.map((m) => {
            const d = diasRestantes(m);
            const e = estadoColor(d);
            const pct = d === null ? 0 : Math.max(4, Math.min(100, (d / (m.frecuencia_dias || 30)) * 100));
            return (
              <div key={m.id} className="clinical-card rounded-lg p-6 clinical-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="font-headline-lg text-[20px] text-on-surface">{m.nombre_producto} {m.concent || ""}</h3>
                    <p className="text-body-sm text-on-surface-variant">{m.forma_farmaceutica || "Medicamento"}</p>
                  </div>
                  <button onClick={() => eliminar(m)} className="w-9 h-9 rounded-full hover:bg-error-container flex items-center justify-center text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-body-sm font-semibold ${e.txt}`}>{e.label}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${e.cls}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex gap-3 mt-5 flex-wrap items-center">
                  <button onClick={() => compreHoy(m)} className="px-6 py-3 bg-primary text-white font-bold rounded-full text-body-sm active:scale-95 transition-all">Compré hoy</button>
                  <button onClick={() => go("resultados", { query: m.nombre_producto })} className="px-6 py-3 border-2 border-outline-variant text-on-surface-variant font-bold rounded-full text-body-sm hover:border-primary hover:text-primary">Buscar precio</button>
                  <label className="flex items-center gap-2 text-body-sm text-on-surface-variant ml-auto">
                    <span className="material-symbols-outlined text-[18px] text-primary">notifications</span>
                    <select value={m.frecuencia_dias || ""} onChange={(e) => setRecordatorio(m, e.target.value)} className="bg-surface-container-low border border-outline-variant/40 rounded-full py-2 pl-3 pr-8 text-body-sm cursor-pointer">
                      <option value="">Sin recordatorio</option>
                      <option value="7">Avísame cada 7 días</option>
                      <option value="15">Avísame cada 15 días</option>
                      <option value="30">Avísame cada 30 días</option>
                      <option value="60">Avísame cada 60 días</option>
                      <option value="90">Avísame cada 90 días</option>
                    </select>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
