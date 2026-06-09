import React, { useState, useMemo, useCallback, useEffect } from "react";
import { buscarVariantes, consultarPrecios } from "../digemidApi";
import { getEstadoFarmacia } from "../horarios";
import { getLocalUser } from "../UserAuth";

// Distritos con su ubigeo (zona = distrito). Set inicial; se ampliará con UBIGEOS completo.
export const DISTRITOS = {
  "Todos Lima": { dep: 15, prov: 1501, ubigeo: null },
  Miraflores: { dep: 15, prov: 1501, ubigeo: 150122 },
  "San Isidro": { dep: 15, prov: 1501, ubigeo: 150131 },
  "San Borja": { dep: 15, prov: 1501, ubigeo: 150130 },
};

export const fmt = (n) => `S/ ${Number(n).toFixed(2)}`;
export const precioDe = (r) => r.precio2 || r.precio1 || 0;

export function BadgeHorario({ nombre, setcodigo }) {
  const { estado } = getEstadoFarmacia(nombre, setcodigo);
  const map = {
    abierto: { txt: "Abierto", cls: "bg-green-100 text-green-700", dot: "bg-green-500 animate-pulse" },
    "24h": { txt: "24 horas", cls: "bg-primary/10 text-primary", dot: "bg-primary" },
    cerrado: { txt: "Cerrado", cls: "bg-surface-container-high text-on-surface-variant", dot: "bg-outline" },
    desconocido: { txt: "Horario s/d", cls: "bg-surface-container-high text-on-surface-variant", dot: "bg-outline" },
  };
  const s = map[estado] || map.desconocido;
  return (
    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${s.dot}`}></span>
      {s.txt}
    </span>
  );
}

export default function Resultados({ query, go, activePersona }) {
  const [variante, setVariante] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [distrito, setDistrito] = useState("Todos Lima");
  const [sortBy, setSortBy] = useState("precio");
  const [soloAbiertas, setSoloAbiertas] = useState(false);

  const registrarBusqueda = useCallback(
    (vari, dist, precios) => {
      const user = getLocalUser();
      if (!user?.id || precios.length < 2) return;
      fetch("/api/registrar-busqueda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          persona_id: activePersona?.id || null,
          distrito: dist === "Todos Lima" ? null : dist,
          medicamento: {
            nombreProducto: vari.nombreProducto,
            concent: vari.concent,
            grupo: vari.grupo,
            codGrupoFF: vari.codGrupoFF,
          },
          precios,
        }),
      }).catch(() => {});
    },
    [activePersona]
  );

  const buscar = useCallback(
    async (termino, dist) => {
      const q = (termino || "").trim();
      const d = dist || distrito;
      if (!q) return;
      setLoading(true);
      setBuscado(true);
      setResultados([]);
      try {
        const vars = await buscarVariantes(q);
        const vari = vars[0];
        if (!vari) {
          setVariante(null);
          setLoading(false);
          return;
        }
        setVariante(vari);
        const { dep, prov, ubigeo } = DISTRITOS[d] || DISTRITOS["Todos Lima"];
        const { registros } = await consultarPrecios(vari.grupo, vari.codGrupoFF, vari.concent, ubigeo, dep, prov, 1, 100);
        setResultados(registros);
        const precios = registros.map(precioDe).filter((p) => p > 0);
        registrarBusqueda(vari, d, precios);
      } catch (e) {
        console.error("buscar error:", e);
      }
      setLoading(false);
    },
    [distrito, registrarBusqueda]
  );

  // Buscar al recibir un nuevo término desde el shell
  useEffect(() => {
    if (query) buscar(query, distrito);
  }, [query, distrito, buscar]);

  const { lista, minP, maxP, ahorro } = useMemo(() => {
    let arr = [...resultados];
    if (soloAbiertas) {
      arr = arr.filter((r) => {
        const { estado } = getEstadoFarmacia(r.nombreComercial, r.setcodigo);
        return estado === "abierto" || estado === "24h";
      });
    }
    arr.sort((a, b) =>
      sortBy === "precio"
        ? (precioDe(a) || 1e9) - (precioDe(b) || 1e9)
        : (a.nombreComercial || "").localeCompare(b.nombreComercial || "")
    );
    const precios = arr.map(precioDe).filter((p) => p > 0);
    const mn = precios.length ? Math.min(...precios) : null;
    const mx = precios.length ? Math.max(...precios) : null;
    return { lista: arr, minP: mn, maxP: mx, ahorro: mn && mx ? mx - mn : 0 };
  }, [resultados, soloAbiertas, sortBy]);

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (Ether) */}
      <aside className="md:w-[35%] relative overflow-hidden flex flex-col p-margin-page text-white" style={{ background: "linear-gradient(165deg, #3c51c2 0%, #8135c5 50%, #2c0050 100%)" }}>
        <div className="relative z-10 space-y-10">
          <div>
            <h1 className="font-display-lg text-display-lg mb-4">{variante?.nombreProducto || query || "Buscar"}</h1>
            <p className="text-white/80 font-body-md max-w-md">
              {loading
                ? "Consultando precios oficiales DIGEMID…"
                : buscado && lista.length
                ? `${lista.length} resultados${minP ? ` · desde ${fmt(minP)} hasta ${fmt(maxP)}` : ""}.`
                : "Busca un medicamento para comparar precios en tu distrito."}
            </p>
          </div>

          {ahorro > 0 && (
            <div className="glass-card rounded-lg p-6 max-w-md">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-white/60">Tu ahorro en esta búsqueda</span>
              <p className="font-display-lg text-[40px] leading-none mt-2 mb-1">{fmt(ahorro)}</p>
              <p className="text-body-sm text-white/80">comprando en la más barata ({fmt(minP)}) en vez de la más cara ({fmt(maxP)}) de {distrito}.</p>
            </div>
          )}

          <div className="glass-card rounded-lg p-8 space-y-6 max-w-md">
            <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-white/60">Filtros</h2>
            <div className="space-y-3">
              <label className="font-label-caps text-label-caps">Distrito</label>
              <div className="relative">
                <select
                  className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-5 text-body-sm text-white appearance-none cursor-pointer focus:ring-2 focus:ring-white/40"
                  value={distrito}
                  onChange={(e) => { setDistrito(e.target.value); if (variante) buscar(variante.nombreProducto, e.target.value); }}
                >
                  {Object.keys(DISTRITOS).map((d) => (
                    <option key={d} value={d} className="text-on-surface">{d}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70 text-[20px]">expand_more</span>
              </div>
            </div>
            <div className="space-y-3">
              <label className="font-label-caps text-label-caps">Disponibilidad</label>
              <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setSoloAbiertas((v) => !v)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${soloAbiertas ? "bg-white border-white" : "border-white/30 group-hover:border-white"}`}>
                  {soloAbiertas && <span className="material-symbols-outlined text-[14px] text-primary">check</span>}
                </div>
                <span className="text-body-sm">Solo abiertas ahora</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-auto hidden md:flex items-center gap-4 text-white/50 pt-12">
          <span className="material-symbols-outlined">verified_user</span>
          <span className="text-label-caps">DATOS OFICIALES DIGEMID · MINSA</span>
        </div>
      </aside>

      {/* Resultados */}
      <section className="md:w-[65%] bg-surface px-margin-page py-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div className="space-y-1">
              <span className="text-on-surface-variant text-body-sm block">Resultados para <strong>"{variante?.nombreProducto || query || "—"}"</strong></span>
              {variante && (
                <div className="flex gap-2 flex-wrap">
                  {variante.nomGrupoFF && <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase">{variante.nomGrupoFF}</span>}
                  {variante.nombreSustancia && <span className="px-2 py-0.5 bg-secondary/10 text-secondary rounded-full text-[10px] font-bold uppercase">{variante.nombreSustancia}</span>}
                </div>
              )}
            </div>
            <button onClick={() => setSortBy((s) => (s === "precio" ? "nombre" : "precio"))} className="flex items-center gap-2 text-on-surface-variant text-label-caps bg-surface-container rounded-full px-4 py-2 hover:text-primary transition-all">
              <span>ORDENAR: {sortBy === "precio" ? "MENOR PRECIO" : "NOMBRE"}</span>
              <span className="material-symbols-outlined text-[16px]">swap_vert</span>
            </button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary mb-4">progress_activity</span>
              <p className="text-body-md">Comparando precios…</p>
            </div>
          )}

          {!loading && buscado && lista.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-on-surface-variant text-center">
              <span className="material-symbols-outlined text-5xl text-outline mb-4">search_off</span>
              <p className="text-body-md">No encontramos precios para "{query}" en {distrito}.</p>
            </div>
          )}

          {!loading &&
            lista.map((r, i) => {
              const precio = precioDe(r);
              const esMejor = i === 0 && precio > 0 && precio === minP;
              return (
                <div key={`${r.codEstab}-${i}`} className="clinical-card rounded-lg p-6 md:p-8 relative overflow-hidden clinical-shadow">
                  {esMejor && <div className="absolute right-0 top-0 px-6 py-2 bg-secondary text-on-secondary font-label-caps tracking-widest rounded-bl-lg">MEJOR PRECIO</div>}
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-grow">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center border border-outline-variant/30 shrink-0">
                          <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">{r.nombreComercial || "Farmacia"}</h3>
                            <BadgeHorario nombre={r.nombreComercial} setcodigo={r.setcodigo} />
                          </div>
                          <div className="flex flex-col text-on-surface-variant mt-1">
                            <span className="text-body-sm font-semibold">{r.direccion || "Dirección no disponible"}</span>
                            <span className="text-[12px] opacity-70">{r.distrito || ""}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {r.direccion && (
                          <a className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-low/50 border border-outline-variant/50 rounded-full text-[14px] font-medium hover:bg-surface-container-high transition-colors" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((r.nombreComercial || "") + " " + (r.direccion || ""))}`} target="_blank" rel="noreferrer">
                            <span className="material-symbols-outlined text-[18px]">directions</span> Cómo llegar
                          </a>
                        )}
                        {r.telefono && (
                          <a className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-low/50 border border-outline-variant/50 rounded-full text-[14px] font-medium hover:bg-surface-container-high transition-colors" href={`tel:${r.telefono}`}>
                            <span className="material-symbols-outlined text-[18px]">call</span> Llamar
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex lg:flex-col justify-between items-end gap-4 shrink-0 lg:border-l lg:pl-8 lg:border-outline-variant/20">
                      <div className="text-right">
                        <span className="block text-label-caps text-on-surface-variant mb-1 uppercase">Precio</span>
                        <span className={`text-[40px] font-bold leading-none ${esMejor ? "text-primary" : "text-on-surface"}`}>{precio > 0 ? fmt(precio) : "s/d"}</span>
                      </div>
                      <button onClick={() => go("detalle", { variante, distrito, registro: r })} className={`px-10 py-4 font-bold rounded-full transition-all active:scale-95 text-body-md w-full sm:w-auto ${esMejor ? "bg-primary text-white hover:bg-primary-container hover:shadow-lg" : "border-2 border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5"}`}>
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </main>
  );
}
