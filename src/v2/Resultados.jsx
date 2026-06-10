import React, { useState, useMemo, useCallback, useEffect } from "react";
import { buscarVariantes, consultarPrecios } from "../digemidApi";
import { getEstadoFarmacia } from "../horarios";
import { getLocalUser } from "../UserAuth";
import { compartirWhatsApp } from "../utils";

export const DISTRITOS = {
  "Todos Lima": { dep: 15, prov: 1501, ubigeo: null },
};

export const fmt = (n) => `S/ ${Number(n).toFixed(2)}`;
export const precioDe = (r) => r.precio2 || r.precio1 || 0;

const BADGE = {
  abierto: { txt: "Abierto", cls: "bg-green-100 text-green-700", dot: "bg-green-500 animate-pulse" },
  "24h": { txt: "24 horas", cls: "bg-primary/10 text-primary", dot: "bg-primary" },
  cerrado: { txt: "Cerrado", cls: "bg-surface-container-high text-on-surface-variant", dot: "bg-outline" },
  desconocido: { txt: "No reporta horarios", cls: "bg-surface-container-high text-on-surface-variant", dot: "bg-outline" },
};

export function BadgeHorario({ nombre, setcodigo, estado: estadoProp }) {
  const estado = estadoProp || getEstadoFarmacia(nombre, setcodigo).estado;
  const s = BADGE[estado] || BADGE.desconocido;
  return (
    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${s.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${s.dot}`}></span>
      {s.txt}
    </span>
  );
}

const btnCls = "flex items-center gap-2 px-4 py-1.5 bg-surface-container-low border border-outline-variant/50 rounded-full text-[13px] font-medium hover:bg-surface-container-high transition-colors";

export default function Resultados({ query, go, activePersona, loc, variante: preVariante }) {
  const [variante, setVariante] = useState(preVariante || null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [sortBy, setSortBy] = useState("precio");
  const [soloAbiertas, setSoloAbiertas] = useState(false);

  const ubigeo = loc?.ubigeo ?? null;
  const dep = loc?.dep ?? 15;
  const prov = ubigeo ? (loc?.prov ?? null) : null;
  const distritoEspecifico = loc?.distrito && loc.distrito !== "Todos los distritos" ? loc.distrito : null;
  const zonaTxt = loc ? (distritoEspecifico ? `${loc.ciudad} · ${loc.distrito}` : (loc.ciudad || loc.region || "Todo el Perú")) : "Todos Lima";

  const tituloBusqueda = variante
    ? `${variante.nombreProducto}${variante.concent ? " " + variante.concent : ""}${variante.nombreFormaFarmaceutica ? " · " + variante.nombreFormaFarmaceutica : ""}`
    : (query || "—");

  const registrarBusqueda = useCallback(
    (vari, precios) => {
      const user = getLocalUser();
      if (!user?.id || precios.length < 2) return;
      fetch("/api/data?action=registrar-busqueda", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id, persona_id: activePersona?.id || null, distrito: distritoEspecifico,
          medicamento: { nombreProducto: vari.nombreProducto, concent: vari.concent, grupo: vari.grupo, codGrupoFF: vari.codGrupoFF },
          precios,
        }),
      }).catch(() => {});
    },
    [activePersona, distritoEspecifico]
  );

  const buscar = useCallback(async () => {
    if (!query) return;
    setLoading(true); setBuscado(true); setResultados([]);
    try {
      let vari = preVariante;
      if (!vari) { const vars = await buscarVariantes(query); vari = vars[0]; }
      if (!vari) { setVariante(null); setLoading(false); return; }
      setVariante(vari);
      const { registros } = await consultarPrecios(vari.grupo, vari.codGrupoFF, vari.concent, ubigeo, dep, prov, 1, 100);
      let regs = registros;
      if (vari.concent) {
        const exact = regs.filter((r) => (r.concent || "") === vari.concent);
        if (exact.length) regs = exact;
      }
      setResultados(regs);
      registrarBusqueda(vari, regs.map(precioDe).filter((p) => p > 0));
    } catch (e) {
      console.error("buscar error:", e);
    }
    setLoading(false);
  }, [query, preVariante, dep, prov, ubigeo, registrarBusqueda]);

  useEffect(() => { buscar(); }, [buscar]);

  // Tipo de medicamento: genérico (nombre = sustancia) vs de marca
  const tipoMedicamento = useMemo(() => {
    const sus = (resultados[0]?.nombreSustancia || "").toUpperCase();
    const prod = (variante?.nombreProducto || "").toUpperCase();
    if (!sus || !prod) return null;
    const base = sus.split(" ")[0];
    return prod === sus || (base && prod.startsWith(base)) ? "Genérico" : "De marca";
  }, [resultados, variante]);

  const { lista, minP, maxP, ahorro } = useMemo(() => {
    let arr = resultados.map((r) => ({ r, estado: getEstadoFarmacia(r.nombreComercial, r.setcodigo).estado, precio: precioDe(r) }));
    if (soloAbiertas) {
      // Mostrar abiertas/24h primero, luego las que no reportan horario. Ocultar cerradas.
      arr = arr.filter((x) => x.estado !== "cerrado");
      const rank = (e) => (e === "abierto" || e === "24h" ? 0 : 1);
      arr.sort((a, b) => (rank(a.estado) !== rank(b.estado) ? rank(a.estado) - rank(b.estado) : (a.precio || 1e9) - (b.precio || 1e9)));
    } else {
      arr.sort((a, b) => (sortBy === "precio" ? (a.precio || 1e9) - (b.precio || 1e9) : (a.r.nombreComercial || "").localeCompare(b.r.nombreComercial || "")));
    }
    const precios = arr.map((x) => x.precio).filter((p) => p > 0);
    const mn = precios.length ? Math.min(...precios) : null;
    const mx = precios.length ? Math.max(...precios) : null;
    return { lista: arr, minP: mn, maxP: mx, ahorro: mn && mx ? mx - mn : 0 };
  }, [resultados, soloAbiertas, sortBy]);

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (Ether) */}
      <aside className="md:w-[35%] ether-gradient relative overflow-hidden flex flex-col p-margin-page text-white">
        <div className="relative z-10 space-y-7">
          <div>
            <h1 className="font-display-lg text-display-lg mb-3">{variante ? `${variante.nombreProducto}${variante.concent ? " " + variante.concent : ""}` : (query || "Buscar")}</h1>
            <p className="text-white/80 font-body-md max-w-md">
              {loading ? "Consultando precios oficiales DIGEMID…" : buscado && lista.length ? `${lista.length} farmacias encontradas.` : "Busca un medicamento para comparar precios."}
            </p>
          </div>

          <button onClick={() => go("home")} className="inline-flex items-center gap-2 bg-white text-primary font-bold rounded-full px-6 py-3 hover:shadow-lg transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">search</span> Nueva búsqueda
          </button>

          {/* Info de la búsqueda */}
          <div className="glass-card rounded-lg p-6 space-y-3 max-w-md">
            <div className="flex justify-between items-center gap-4">
              <span className="text-white/60 text-body-sm">Rango de precio</span>
              <span className="font-semibold text-right">{minP ? `${fmt(minP)} – ${fmt(maxP)}` : "—"}</span>
            </div>
            <div className="flex justify-between items-center gap-4 border-t border-white/15 pt-3">
              <span className="text-white/60 text-body-sm">Zona</span>
              <span className="font-semibold text-right">{zonaTxt}</span>
            </div>
            <div className="flex justify-between items-center gap-4 border-t border-white/15 pt-3">
              <span className="text-white/60 text-body-sm">Tipo</span>
              <span className="font-semibold text-right">{tipoMedicamento || "—"}</span>
            </div>
          </div>

          {ahorro > 0 && (
            <div className="glass-card rounded-lg p-6 max-w-md">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-white/60">Tu ahorro en esta búsqueda</span>
              <p className="font-display-lg text-[40px] leading-none mt-2 mb-1">{fmt(ahorro)}</p>
              <p className="text-body-sm text-white/80">comprando en la más barata ({fmt(minP)}) en vez de la más cara ({fmt(maxP)}).</p>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer group glass-card rounded-lg p-4 max-w-md" onClick={() => setSoloAbiertas((v) => !v)}>
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${soloAbiertas ? "bg-white border-white" : "border-white/30 group-hover:border-white"}`}>
              {soloAbiertas && <span className="material-symbols-outlined text-[14px] text-primary">check</span>}
            </div>
            <span className="text-body-sm">Solo abiertas ahora</span>
          </label>
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
              <span className="text-on-surface-variant text-body-sm block">Resultados para <strong>"{tituloBusqueda}"</strong></span>
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
              <p className="text-body-md mb-4">No encontramos precios para "{tituloBusqueda}" en {zonaTxt}.</p>
              <button onClick={() => go("home")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Nueva búsqueda</button>
            </div>
          )}

          {!loading && lista.map(({ r, estado, precio }, i) => {
            const esMejor = precio > 0 && precio === minP;
            const telDigits = (r.telefono || "").replace(/\D/g, "");
            const waNum = telDigits.length >= 9 ? "51" + telDigits.slice(-9) : null;
            const dest = encodeURIComponent(`${r.nombreComercial || ""} ${r.direccion || ""} ${r.distrito || ""} Peru`);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${dest}`;
            const wazeUrl = `https://waze.com/ul?q=${dest}&navigate=yes`;
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
                          <BadgeHorario estado={estado} />
                        </div>
                        <div className="flex flex-col text-on-surface-variant mt-1">
                          <span className="text-body-sm font-semibold">{r.direccion || "Dirección no disponible"}</span>
                          <span className="text-[12px] opacity-70">{r.distrito || ""}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <div className="relative group/maps inline-block">
                        <button className={btnCls}><span className="material-symbols-outlined text-[18px]">directions</span> Cómo llegar</button>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/maps:flex flex-col bg-white border border-outline-variant/30 rounded-lg shadow-xl p-2 z-20 min-w-[150px]">
                          <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 hover:bg-surface-container rounded text-body-sm"><span className="material-symbols-outlined text-[18px] text-primary">map</span> Google Maps</a>
                          <a href={wazeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 hover:bg-surface-container rounded text-body-sm"><span className="material-symbols-outlined text-[18px] text-[#33CCFF]">navigation</span> Waze</a>
                        </div>
                      </div>
                      {r.telefono && (
                        <a className={btnCls} href={`tel:${r.telefono}`}><span className="material-symbols-outlined text-[18px]">call</span> Llamar</a>
                      )}
                      {waNum && (
                        <a className={btnCls} href={`https://wa.me/${waNum}?text=${encodeURIComponent(`Hola, vi en Medisinas que tienen ${tituloBusqueda}. ¿Está disponible?`)}`} target="_blank" rel="noreferrer">
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span> WhatsApp
                        </a>
                      )}
                      <button onClick={() => compartirWhatsApp(r.nombreComercial, precio.toFixed(2), tituloBusqueda, r.distrito, r.direccion, r.telefono, null, null, null)} className={btnCls}>
                        <span className="material-symbols-outlined text-[18px]">share</span> Compartir
                      </button>
                    </div>
                  </div>

                  <div className="flex lg:flex-col justify-between items-end gap-4 shrink-0 lg:border-l lg:pl-8 lg:border-outline-variant/20">
                    <div className="text-right">
                      <span className="block text-label-caps text-on-surface-variant mb-1 uppercase">Precio</span>
                      <span className={`text-[40px] font-bold leading-none ${esMejor ? "text-primary" : "text-on-surface"}`}>{precio > 0 ? fmt(precio) : "s/d"}</span>
                    </div>
                    <button onClick={() => go("detalle", { variante, loc, registro: r })} className={`px-10 py-4 font-bold rounded-full transition-all active:scale-95 text-body-md w-full sm:w-auto ${esMejor ? "bg-primary text-white hover:bg-primary-container hover:shadow-lg" : "border-2 border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5"}`}>
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
