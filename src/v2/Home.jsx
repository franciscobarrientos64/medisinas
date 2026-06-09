import React, { useState, useMemo, useRef, useCallback } from "react";
import { UBIGEOS } from "../ubigeos";
import { buscarVariantes } from "../digemidApi";
import { detectarSintoma } from "../utils";

const FRECUENTES = ["Paracetamol 500mg", "Losartán 50mg", "Metformina 850mg", "Atorvastatina 20mg"];

const ACCESOS = [
  { id: "medicamentos", icon: "medication", t: "Mis medicinas", d: "Recordatorios de recompra" },
  { id: "recetas", icon: "description", t: "Mis recetas", d: "Guarda tus recetas" },
  { id: "alertas", icon: "notifications_active", t: "Mis alertas", d: "Te avisamos cuando baje" },
  { id: "ahorro", icon: "savings", t: "Mi ahorro", d: "Cuánto has ahorrado" },
];

function MiniSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className="w-full h-11 pl-4 pr-9 rounded-full bg-surface-container-low text-on-surface border-none text-body-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary/30">
        {children}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">expand_more</span>
    </div>
  );
}

export default function Home({ go, activePersona }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("LIMA METROPOLITANA");
  const [ciudad, setCiudad] = useState("Lima");
  const [distrito, setDistrito] = useState("Todos los distritos");

  const [sugerencias, setSugerencias] = useState([]);
  const [sintoma, setSintoma] = useState(null);
  const [showSug, setShowSug] = useState(false);
  const [cargandoSug, setCargandoSug] = useState(false);
  const debounceRef = useRef(null);
  const blurRef = useRef(null);

  const provincias = useMemo(() => Object.keys(UBIGEOS[region]?.provincias || {}), [region]);
  const distritos = useMemo(() => Object.keys(UBIGEOS[region]?.provincias?.[ciudad]?.distritos || {}), [region, ciudad]);

  const onRegion = (e) => { const r = e.target.value; setRegion(r); setCiudad(Object.keys(UBIGEOS[r]?.provincias || {})[0] || ""); setDistrito("Todos los distritos"); };
  const onCiudad = (e) => { setCiudad(e.target.value); setDistrito("Todos los distritos"); };

  const getLoc = useCallback(() => ({
    region, ciudad, distrito,
    dep: UBIGEOS[region]?.cod_dep ?? null,
    prov: UBIGEOS[region]?.provincias?.[ciudad]?.cod_prov ?? null,
    ubigeo: UBIGEOS[region]?.provincias?.[ciudad]?.distritos?.[distrito] ?? null,
  }), [region, ciudad, distrito]);

  const buscar = (termino, variante) => {
    const t = (termino || q).trim();
    if (!t) return;
    setShowSug(false);
    go("resultados", { query: t, loc: getLoc(), variante: variante || null });
  };

  const fetchVariants = useCallback(async (term) => {
    setCargandoSug(true);
    try {
      const vars = await buscarVariantes(term.trim());
      const vistos = new Set();
      const dedup = [];
      for (const v of vars) {
        const k = `${v.nombreProducto}|${v.concent}`;
        if (!vistos.has(k)) { vistos.add(k); dedup.push(v); }
        if (dedup.length >= 12) break;
      }
      setSugerencias(dedup);
    } catch { setSugerencias([]); }
    setCargandoSug(false);
  }, []);

  const onChange = (e) => {
    const val = e.target.value;
    setQ(val);
    setSintoma(detectarSintoma(val));
    setShowSug(true);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 3) { setSugerencias([]); return; }
    debounceRef.current = setTimeout(() => fetchVariants(val), 350);
  };

  // Click en un medicamento sugerido por síntoma → mostrar sus variantes DIGEMID
  const pickMedicina = (m) => {
    setQ(m);
    setSintoma(null);
    setSugerencias([]);
    setShowSug(true);
    fetchVariants(m);
  };

  const hayDropdown = showSug && (cargandoSug || sugerencias.length > 0 || sintoma);

  return (
    <main className="flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
      {/* IZQUIERDA — Ether */}
      <section className="md:w-[42%] ether-gradient relative overflow-hidden flex flex-col justify-between p-8 md:p-12 text-white">
        <div className="relative z-10">
          <span className="font-label-caps text-label-caps bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-widest">Precios oficiales DIGEMID · MINSA</span>
          <h1 className="font-display-lg text-display-lg md:text-[56px] leading-tight font-extrabold mt-8">
            Tu salud,<br />
            <span className="opacity-80">tu dinero,</span><br />
            tu elección.
          </h1>
          <p className="font-body-md text-body-md text-white/75 max-w-sm mt-6">
            Comparamos precios en tiempo real en farmacias de todo el Perú para que pagues lo justo por tus medicinas.
          </p>
        </div>
        <div className="relative z-10 mt-10 grid grid-cols-2 gap-4">
          <div className="glass-card rounded-lg p-5">
            <p className="font-headline-lg text-headline-lg font-bold">+10 mil</p>
            <p className="font-label-caps text-label-caps text-white/60">Farmacias</p>
          </div>
          <div className="glass-card rounded-lg p-5">
            <p className="font-headline-lg text-headline-lg font-bold">100%</p>
            <p className="font-label-caps text-label-caps text-white/60">Datos oficiales</p>
          </div>
        </div>
      </section>

      {/* DERECHA — Workspace */}
      <section className="flex-1 bg-surface px-6 md:px-12 py-10">
        <div className="max-w-2xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Buscar medicamento</h2>
          <p className="text-on-surface-variant text-body-md mb-6">
            {activePersona ? `Comprando para ${activePersona.nombre}. ` : ""}Escribe el nombre o un síntoma.
          </p>

          {/* Buscador + dropdown */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">search</span>
            <input
              className="w-full h-16 pl-14 pr-32 rounded-full bg-surface-container-low text-on-surface border-none focus:ring-2 focus:ring-primary/20 text-body-md placeholder:text-outline"
              placeholder="Ej. Paracetamol o dolor de cabeza"
              value={q}
              onChange={onChange}
              onFocus={() => q.length >= 3 && setShowSug(true)}
              onBlur={() => { blurRef.current = setTimeout(() => setShowSug(false), 200); }}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <button onClick={() => buscar()} className="absolute right-2 top-2 bottom-2 px-7 rounded-full bg-primary text-white font-bold hover:bg-primary-container transition-all active:scale-95 z-10">Buscar</button>

            {hayDropdown && (
              <div className="absolute left-0 right-0 top-[72px] bg-white rounded-lg shadow-xl border border-outline-variant/30 z-30 overflow-y-auto max-h-[55vh] text-left" onMouseDown={() => clearTimeout(blurRef.current)}>
                {sintoma && (
                  <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low">
                    <p className="text-label-caps text-on-surface-variant uppercase mb-2">Para "{sintoma.sintoma}" suele usarse — elige uno:</p>
                    <div className="flex flex-wrap gap-2">
                      {sintoma.medicamentos.map((m) => (
                        <button key={m} onMouseDown={() => pickMedicina(m)} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[13px] font-semibold hover:bg-primary/20">{m}</button>
                      ))}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-2">Orientativo. No reemplaza la consulta médica.</p>
                  </div>
                )}
                {cargandoSug && <div className="p-4 text-body-sm text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Buscando variantes…</div>}
                {!cargandoSug && sugerencias.map((v, i) => (
                  <button key={i} onMouseDown={() => buscar(v.nombreProducto, v)} className="w-full flex items-center gap-3 p-3 hover:bg-surface-container text-left border-b border-outline-variant/10 last:border-0">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">medication</span>
                    <span className="min-w-0">
                      <span className="block text-body-md text-on-surface truncate">{v.nombreProducto} <strong>{v.concent}</strong></span>
                      <span className="block text-[12px] text-on-surface-variant truncate">{v.nombreFormaFarmaceutica || v.nomGrupoFF || ""}</span>
                    </span>
                  </button>
                ))}
                {!cargandoSug && !sintoma && sugerencias.length === 0 && q.trim().length >= 3 && (
                  <div className="p-4 text-body-sm text-on-surface-variant">Sin coincidencias. Revisa la ortografía o intenta otro nombre.</div>
                )}
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <MiniSelect value={region} onChange={onRegion}>{Object.keys(UBIGEOS).map((r) => <option key={r} value={r}>{r}</option>)}</MiniSelect>
            <MiniSelect value={ciudad} onChange={onCiudad}>{provincias.map((p) => <option key={p} value={p}>{p}</option>)}</MiniSelect>
            <MiniSelect value={distrito} onChange={(e) => setDistrito(e.target.value)}>{distritos.map((d) => <option key={d} value={d}>{d}</option>)}</MiniSelect>
          </div>

          <div className="flex gap-2 flex-wrap mt-4">
            {FRECUENTES.map((m) => (
              <button key={m} onClick={() => buscar(m)} className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-[13px] hover:bg-surface-container-highest transition-all">{m}</button>
            ))}
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 gap-3 mt-10">
            {ACCESOS.map((a) => (
              <button key={a.id} onClick={() => go(a.id)} className="clinical-card rounded-lg p-5 text-left group">
                <span className="material-symbols-outlined text-primary text-[26px] mb-2 group-hover:scale-110 transition-transform inline-block">{a.icon}</span>
                <h3 className="font-headline-lg text-[17px] text-on-surface">{a.t}</h3>
                <p className="text-[12px] text-on-surface-variant">{a.d}</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
