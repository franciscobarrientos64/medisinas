import React, { useState, useRef, useCallback } from "react";
import { buscarVariantes } from "../digemidApi";
import { detectarSintoma } from "../utils";

// Buscador con autocompletado reutilizable.
// - onSelectVariante(v): el usuario eligió una variante EXACTA de DIGEMID.
// - onSearchText(t): el usuario buscó por texto (Enter/botón) sin elegir de la lista.
export default function Buscador({ onSelectVariante, onSearchText, placeholder, compact }) {
  const [q, setQ] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [sintoma, setSintoma] = useState(null);
  const [showSug, setShowSug] = useState(false);
  const [cargando, setCargando] = useState(false);
  const debounceRef = useRef(null);
  const blurRef = useRef(null);

  const fetchVariants = useCallback(async (term) => {
    setCargando(true);
    try {
      const vars = await buscarVariantes(term.trim());
      const vistos = new Set();
      const dedup = [];
      for (const v of vars) {
        const k = `${v.grupo}|${v.codGrupoFF}|${v.concent}`;
        if (!vistos.has(k)) { vistos.add(k); dedup.push(v); }
        if (dedup.length >= 12) break;
      }
      setSugerencias(dedup);
    } catch { setSugerencias([]); }
    setCargando(false);
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

  const pickMedicina = (m) => { setQ(m); setSintoma(null); setSugerencias([]); setShowSug(true); fetchVariants(m); };

  const elegirVariante = (v) => { setShowSug(false); setQ(""); onSelectVariante(v); };
  const submitTexto = () => { if (q.trim()) { setShowSug(false); onSearchText(q.trim()); setQ(""); } };

  const hayDropdown = showSug && (cargando || sugerencias.length > 0 || sintoma);
  const inputCls = compact
    ? "w-full h-11 pl-10 pr-4 rounded-full bg-surface-container-low text-on-surface border-none focus:ring-2 focus:ring-primary/20 text-body-sm placeholder:text-outline"
    : "w-full h-16 pl-14 pr-32 rounded-full bg-surface-container-low text-on-surface border-none focus:ring-2 focus:ring-primary/20 text-body-md placeholder:text-outline";

  return (
    <div className="relative">
      <span className={`material-symbols-outlined absolute ${compact ? "left-3 text-[20px]" : "left-5"} top-1/2 -translate-y-1/2 text-on-surface-variant z-10`}>search</span>
      <input
        className={inputCls}
        placeholder={placeholder || "Busca tu medicina o síntoma"}
        value={q}
        onChange={onChange}
        onFocus={() => q.length >= 3 && setShowSug(true)}
        onBlur={() => { blurRef.current = setTimeout(() => setShowSug(false), 200); }}
        onKeyDown={(e) => e.key === "Enter" && submitTexto()}
      />
      {!compact && (
        <button onClick={submitTexto} className="absolute right-2 top-2 bottom-2 px-7 rounded-full bg-primary text-white font-bold hover:bg-primary-container transition-all active:scale-95 z-10">Buscar</button>
      )}

      {hayDropdown && (
        <div className={`absolute left-0 right-0 ${compact ? "top-[48px]" : "top-[72px]"} bg-white rounded-lg shadow-xl border border-outline-variant/30 z-30 overflow-y-auto max-h-[55vh] text-left`} onMouseDown={() => clearTimeout(blurRef.current)}>
          {sintoma && (
            <div className="p-4 border-b border-outline-variant/20 bg-surface-container-low">
              <p className="text-label-caps text-on-surface-variant uppercase mb-2">Para "{sintoma.sintoma}" suele usarse — elige uno:</p>
              <div className="flex flex-wrap gap-2">
                {sintoma.medicamentos.map((m) => (
                  <button key={m} onMouseDown={(e) => { e.preventDefault(); pickMedicina(m); }} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[13px] font-semibold hover:bg-primary/20">{m}</button>
                ))}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2">Orientativo. No reemplaza la consulta médica.</p>
            </div>
          )}
          {cargando && <div className="p-4 text-body-sm text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Buscando variantes…</div>}
          {!cargando && sugerencias.map((v, i) => (
            <button key={i} onMouseDown={(e) => { e.preventDefault(); elegirVariante(v); }} className="w-full flex items-center gap-3 p-3 hover:bg-surface-container text-left border-b border-outline-variant/10 last:border-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">medication</span>
              <span className="min-w-0">
                <span className="block text-body-md text-on-surface truncate">{v.nombreProducto} <strong>{v.concent}</strong></span>
                <span className="block text-[12px] text-on-surface-variant truncate">{v.nombreFormaFarmaceutica || v.nomGrupoFF || ""}</span>
              </span>
            </button>
          ))}
          {!cargando && !sintoma && sugerencias.length === 0 && q.trim().length >= 3 && (
            <div className="p-4 text-body-sm text-on-surface-variant">Sin coincidencias. Revisa la ortografía o intenta otro nombre.</div>
          )}
        </div>
      )}
    </div>
  );
}
