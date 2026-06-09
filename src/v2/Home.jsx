import React, { useState, useMemo, useRef, useCallback } from "react";
import { UBIGEOS } from "../ubigeos";
import { buscarVariantes } from "../digemidApi";
import { detectarSintoma } from "../utils";

const FRECUENTES = ["Paracetamol 500mg", "Losartán 50mg", "Metformina 850mg", "Atorvastatina 20mg"];

const ACCESOS = [
  { id: "medicamentos", icon: "medication", t: "Mis medicinas", d: "Recordatorios de recompra" },
  { id: "recetas", icon: "description", t: "Mis recetas", d: "Guarda tus recetas médicas" },
  { id: "alertas", icon: "notifications_active", t: "Mis alertas", d: "Te avisamos cuando baje" },
  { id: "ahorro", icon: "savings", t: "Mi ahorro", d: "Cuánto has ahorrado" },
];

function MiniSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange} className="w-full h-11 pl-4 pr-9 rounded-full bg-white text-on-surface border-none text-body-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary/30 shadow-sm">
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

  const onChange = (e) => {
    const val = e.target.value;
    setQ(val);
    setSintoma(detectarSintoma(val));
    setShowSug(true);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 3) { setSugerencias([]); return; }
    setCargandoSug(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const vars = await buscarVariantes(val.trim());
        const vistos = new Set();
        const dedup = [];
        for (const v of vars) {
          const k = `${v.nombreProducto}|${v.concent}`;
          if (!vistos.has(k)) { vistos.add(k); dedup.push(v); }
          if (dedup.length >= 8) break;
        }
        setSugerencias(dedup);
      } catch { setSugerencias([]); }
      setCargandoSug(false);
    }, 350);
  };

  const hayDropdown = showSug && (cargandoSug || sugerencias.length > 0 || sintoma);

  return (
    <div className="px-margin-page py-10 max-w-6xl mx-auto space-y-10">
      <section className="ether-gradient rounded-xl overflow-hidden relative p-8 md:p-14 text-white">
        <span className="font-label-caps text-label-caps bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-widest">Precios oficiales DIGEMID · MINSA</span>
        <h1 className="font-display-lg text-display-lg md:text-[56px] leading-tight font-extrabold mt-6 max-w-2xl">Tu medicina, al mejor precio.</h1>
        <p className="font-body-md text-body-md text-white/75 max-w-lg mt-4">
          {activePersona ? `Comprando para ${activePersona.nombre}. ` : ""}Compara precios reales de farmacias en todo el Perú y encuentra dónde cuesta menos.
        </p>

        <div className="mt-8 max-w-2xl">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant z-10">search</span>
            <input
              className="w-full h-16 pl-14 pr-32 rounded-full bg-white text-on-surface border-none focus:ring-4 focus:ring-white/30 text-body-md placeholder:text-outline shadow-lg"
              placeholder="Busca tu medicina o síntoma, ej. Paracetamol o dolor de cabeza"
              value={q}
              onChange={onChange}
              onFocus={() => q.length >= 3 && setShowSug(true)}
              onBlur={() => { blurRef.current = setTimeout(() => setShowSug(false), 200); }}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <button onClick={() => buscar()} className="absolute right-2 top-2 bottom-2 px-7 rounded-full bg-primary text-white font-bold hover:bg-primary-container transition-all active:scale-95 z-10">Buscar</button>

            {/* Dropdown de autocompletado */}
            {hayDropdown && (
              <div className="absolute left-0 right-0 top-[72px] bg-white rounded-lg shadow-xl border border-outline-variant/30 z-30 overflow-hidden text-left" onMouseDown={() => clearTimeout(blurRef.current)}>
                {sintoma && (
                  <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low">
                    <p className="text-label-caps text-on-surface-variant uppercase mb-2">Para "{sintoma.sintoma}" suele usarse:</p>
                    <div className="flex flex-wrap gap-2">
                      {sintoma.medicamentos.map((m) => (
                        <button key={m} onClick={() => buscar(m)} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[13px] font-semibold hover:bg-primary/20">{m}</button>
                      ))}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-2">Orientativo. No reemplaza la consulta médica.</p>
                  </div>
                )}
                {cargandoSug && <div className="p-4 text-body-sm text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Buscando…</div>}
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

          {/* Filtros: Región / Ciudad / Distrito */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <MiniSelect value={region} onChange={onRegion}>
              {Object.keys(UBIGEOS).map((r) => <option key={r} value={r}>{r}</option>)}
            </MiniSelect>
            <MiniSelect value={ciudad} onChange={onCiudad}>
              {provincias.map((p) => <option key={p} value={p}>{p}</option>)}
            </MiniSelect>
            <MiniSelect value={distrito} onChange={(e) => setDistrito(e.target.value)}>
              {distritos.map((d) => <option key={d} value={d}>{d}</option>)}
            </MiniSelect>
          </div>

          <div className="flex gap-2 flex-wrap mt-4">
            {FRECUENTES.map((m) => (
              <button key={m} onClick={() => buscar(m)} className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-[13px] hover:bg-white/25 transition-all">{m}</button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-grid">
        {ACCESOS.map((a) => (
          <button key={a.id} onClick={() => go(a.id)} className="clinical-card rounded-lg p-6 text-left group">
            <div className="w-14 h-14 bg-surface-container rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all text-primary">
              <span className="material-symbols-outlined text-[28px]">{a.icon}</span>
            </div>
            <h3 className="font-headline-lg text-[20px] text-on-surface mb-1">{a.t}</h3>
            <p className="text-body-sm text-on-surface-variant">{a.d}</p>
          </button>
        ))}
      </section>

      <section className="flex items-center gap-4 text-on-surface-variant justify-center py-6 border-t border-outline-variant/30">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        <span className="text-label-caps uppercase">Datos oficiales DIGEMID · MINSA · actualizados a diario</span>
      </section>
    </div>
  );
}
