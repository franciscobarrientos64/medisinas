import React, { useState, useMemo, useCallback, useEffect } from "react";
import { buscarVariantes, consultarPrecios } from "../digemidApi";
import { getEstadoFarmacia } from "../horarios";
import { getLocalUser } from "../UserAuth";
import { compartirWhatsApp, calcularDistancia } from "../utils";

export const fmt = (n) => `S/ ${Number(n).toFixed(2)}`;
export const precioDe = (r) => r.precio2 || r.precio1 || r.precio3 || 0;

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
const ICON = { maps: "https://cdn.simpleicons.org/googlemaps", waze: "https://cdn.simpleicons.org/waze/05C8F7", wa: "https://cdn.simpleicons.org/whatsapp/25D366" };

function parseCoords(g) {
  if (!g) return null;
  if (typeof g === "string") {
    const m = g.split(/[,;]/).map((s) => parseFloat(s.trim()));
    if (m.length >= 2 && !isNaN(m[0]) && !isNaN(m[1])) return { lat: m[0], lon: m[1] };
    return null;
  }
  const lat = g.lat ?? g.latitud, lon = g.lon ?? g.lng ?? g.longitud;
  return lat != null && lon != null ? { lat: +lat, lon: +lon } : null;
}

export default function Resultados({ query, go, activePersona, loc, variante: preVariante }) {
  const [variante, setVariante] = useState(preVariante || null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [sortBy, setSortBy] = useState("precio");
  const [soloAbiertas, setSoloAbiertas] = useState(false);
  const [solo24h, setSolo24h] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState("todos"); // todos | generico | marca
  const [maxPrecio, setMaxPrecio] = useState(null);
  const [geoPos, setGeoPos] = useState(null);
  const [maxDist, setMaxDist] = useState(15);

  const ubigeo = loc?.ubigeo ?? null;
  const dep = loc?.dep ?? 15;
  const prov = ubigeo ? (loc?.prov ?? null) : null;
  const distritoEspecifico = loc?.distrito && loc.distrito !== "Todos los distritos" ? loc.distrito : null;
  const zonaTxt = loc ? (distritoEspecifico ? `${loc.ciudad} · ${loc.distrito}` : (loc.ciudad || loc.region || "Todo el Perú")) : "Todos Lima";
  const tituloBusqueda = variante
    ? `${variante.nombreProducto}${variante.concent ? " " + variante.concent : ""}${variante.nombreFormaFarmaceutica ? " · " + variante.nombreFormaFarmaceutica : ""}`
    : (query || "—");

  const registrarBusqueda = useCallback((vari, precios) => {
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
  }, [activePersona, distritoEspecifico]);

  const buscar = useCallback(async () => {
    if (!query) return;
    setLoading(true); setBuscado(true); setResultados([]); setMaxPrecio(null);
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

  const usarUbicacion = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setGeoPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setGeoPos(null),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  // Rango de precios crudo (para el slider)
  const rango = useMemo(() => {
    const ps = resultados.map(precioDe).filter((p) => p > 0);
    return ps.length ? { min: Math.min(...ps), max: Math.max(...ps) } : null;
  }, [resultados]);

  const { lista, minP, maxP, ahorro } = useMemo(() => {
    let arr = resultados.map((r) => {
      const coords = parseCoords(r.geolocation);
      return {
        r,
        estado: getEstadoFarmacia(r.nombreComercial, r.setcodigo).estado,
        precio: precioDe(r),
        esGenerico: ["04", "06"].includes(r.catCodigo),
        distKm: geoPos && coords ? calcularDistancia(geoPos.lat, geoPos.lon, coords.lat, coords.lon) : null,
      };
    });
    if (tipoFiltro === "generico") arr = arr.filter((x) => x.esGenerico);
    if (tipoFiltro === "marca") arr = arr.filter((x) => !x.esGenerico);
    if (maxPrecio != null) arr = arr.filter((x) => x.precio <= maxPrecio + 0.001);
    if (solo24h) arr = arr.filter((x) => x.estado === "24h");
    if (geoPos) arr = arr.filter((x) => x.distKm == null || x.distKm <= maxDist); // sin coords no se ocultan
    if (soloAbiertas) {
      arr = arr.filter((x) => x.estado !== "cerrado");
      const rank = (e) => (e === "abierto" || e === "24h" ? 0 : 1);
      arr.sort((a, b) => (rank(a.estado) !== rank(b.estado) ? rank(a.estado) - rank(b.estado) : (a.precio || 1e9) - (b.precio || 1e9)));
    } else if (sortBy === "distancia" && geoPos) {
      arr.sort((a, b) => (a.distKm ?? 1e9) - (b.distKm ?? 1e9));
    } else {
      arr.sort((a, b) => (sortBy === "precio" ? (a.precio || 1e9) - (b.precio || 1e9) : (a.r.nombreComercial || "").localeCompare(b.r.nombreComercial || "")));
    }
    const precios = arr.map((x) => x.precio).filter((p) => p > 0);
    const mn = precios.length ? Math.min(...precios) : null;
    const mx = precios.length ? Math.max(...precios) : null;
    return { lista: arr, minP: mn, maxP: mx, ahorro: mn && mx ? mx - mn : 0 };
  }, [resultados, soloAbiertas, solo24h, tipoFiltro, maxPrecio, geoPos, maxDist, sortBy]);

  const TipoBtn = ({ id, label }) => (
    <button onClick={() => setTipoFiltro(id)} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${tipoFiltro === id ? "bg-white text-primary" : "glass-card text-white hover:bg-white/20"}`}>{label}</button>
  );

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar (Ether, sticky para que el degradado se mantenga) */}
      <aside className="md:w-[35%] ether-gradient relative flex flex-col p-margin-page text-white md:sticky md:top-[73px] md:h-[calc(100vh-73px)] md:overflow-y-auto hide-scrollbar">
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="font-display-lg text-display-lg mb-2">{variante ? `${variante.nombreProducto}${variante.concent ? " " + variante.concent : ""}` : (query || "Buscar")}</h1>
            <p className="text-white/80 font-body-md max-w-md">
              {loading
                ? "Consultando precios oficiales DIGEMID…"
                : lista.length
                ? `Encontramos ${lista.length} resultados en farmacias verificadas en tu zona.${minP ? ` Los precios van de ${fmt(minP)} a ${fmt(maxP)}.` : ""}`
                : "No encontramos resultados."}
            </p>
          </div>

          {/* Filtros */}
          <div className="glass-card rounded-lg p-5 space-y-5">
            <h2 className="font-label-caps text-label-caps uppercase tracking-widest text-white/60">Filtros</h2>

            {/* Slider precio */}
            {rango && rango.max > rango.min && (
              <div className="space-y-2">
                <div className="flex justify-between text-body-sm"><span>Precio máx.</span><span className="font-semibold">{fmt(maxPrecio ?? rango.max)}</span></div>
                <input type="range" min={rango.min} max={rango.max} step="0.1" value={maxPrecio ?? rango.max} onChange={(e) => setMaxPrecio(parseFloat(e.target.value))} className="w-full accent-white cursor-pointer" />
              </div>
            )}

            {/* Slider distancia */}
            <div className="space-y-2">
              <div className="flex justify-between text-body-sm"><span>Distancia</span><span className="font-semibold">{geoPos ? `${maxDist} km` : "—"}</span></div>
              {geoPos ? (
                <input type="range" min="1" max="30" step="1" value={maxDist} onChange={(e) => setMaxDist(parseInt(e.target.value, 10))} className="w-full accent-white cursor-pointer" />
              ) : (
                <button onClick={usarUbicacion} className="w-full py-2 rounded-full bg-white/15 hover:bg-white/25 text-body-sm flex items-center justify-center gap-2"><span className="material-symbols-outlined text-[18px]">my_location</span> Usar mi ubicación</button>
              )}
            </div>

            {/* Tipo */}
            <div className="space-y-2">
              <span className="text-body-sm text-white/60">Tipo de medicamento</span>
              <div className="flex gap-2 flex-wrap"><TipoBtn id="todos" label="Todos" /><TipoBtn id="generico" label="Genérico" /><TipoBtn id="marca" label="De marca" /></div>
            </div>

            {/* Disponibilidad */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setSoloAbiertas((v) => !v)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${soloAbiertas ? "bg-white border-white" : "border-white/30 group-hover:border-white"}`}>{soloAbiertas && <span className="material-symbols-outlined text-[14px] text-primary">check</span>}</div>
                <span className="text-body-sm">Solo abiertas ahora</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setSolo24h((v) => !v)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${solo24h ? "bg-white border-white" : "border-white/30 group-hover:border-white"}`}>{solo24h && <span className="material-symbols-outlined text-[14px] text-primary">check</span>}</div>
                <span className="text-body-sm">Farmacias 24 horas</span>
              </label>
            </div>
          </div>

          <button onClick={() => go("home")} className="inline-flex items-center justify-center gap-2 bg-white text-primary font-bold rounded-full px-6 py-3 hover:shadow-lg transition-all active:scale-95 w-full">
            <span className="material-symbols-outlined text-[20px]">search</span> Nueva búsqueda
          </button>

          {ahorro > 0 && (
            <div className="glass-card rounded-lg p-5">
              <span className="font-label-caps text-label-caps uppercase tracking-widest text-white/60">Tu ahorro</span>
              <p className="font-display-lg text-[36px] leading-none mt-1 mb-1">{fmt(ahorro)}</p>
              <p className="text-body-sm text-white/80">la más barata vs la más cara.</p>
            </div>
          )}

          <div className="flex items-center gap-3 text-white/50 pt-2 pb-4">
            <span className="material-symbols-outlined">verified_user</span>
            <span className="text-label-caps">DATOS OFICIALES DIGEMID · MINSA</span>
          </div>
        </div>
      </aside>

      {/* Resultados */}
      <section className="md:w-[65%] bg-surface px-margin-page py-12">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <span className="text-on-surface-variant text-body-sm block">Resultados para <strong>"{tituloBusqueda}"</strong></span>
            <button onClick={() => setSortBy((s) => (s === "precio" ? "nombre" : "precio"))} className="flex items-center gap-2 text-on-surface-variant text-label-caps bg-surface-container rounded-full px-4 py-2 hover:text-primary transition-all">
              <span>ORDENAR: {sortBy === "precio" ? "MENOR PRECIO" : sortBy === "distancia" ? "DISTANCIA" : "NOMBRE"}</span>
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
              <p className="text-body-md mb-4">No encontramos resultados para "{tituloBusqueda}"{geoPos || maxPrecio || tipoFiltro !== "todos" ? " con esos filtros" : ` en ${zonaTxt}`}.</p>
              <button onClick={() => go("home")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Nueva búsqueda</button>
            </div>
          )}

          {!loading && lista.map(({ r, estado, precio, distKm }, i) => {
            const esMejor = precio > 0 && precio === minP;
            const precioUnidad = r.precio2 || null;
            const precioCaja = r.precio1 || null;
            const tieneMulti = precioCaja && precioUnidad && precioCaja !== precioUnidad;
            const telDigits = (r.telefono || "").replace(/\D/g, "");
            const waNum = telDigits.length >= 9 ? "51" + telDigits.slice(-9) : null;
            const dest = encodeURIComponent(`${r.nombreComercial || ""} ${r.direccion || ""} ${r.distrito || ""} Peru`);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${dest}`;
            const wazeUrl = `https://waze.com/ul?q=${dest}&navigate=yes`;
            return (
              <div key={`${r.codEstab}-${i}`} className="clinical-card rounded-lg p-6 md:p-8 relative overflow-hidden clinical-shadow">
                {esMejor && <div className="absolute left-0 top-0 px-5 py-2 bg-secondary text-on-secondary font-label-caps tracking-widest rounded-br-lg">MEJOR PRECIO</div>}
                <div className={`flex flex-col lg:flex-row gap-8 ${esMejor ? "mt-6" : ""}`}>
                  <div className="flex-grow">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-surface-container rounded-full flex items-center justify-center border border-outline-variant/30 shrink-0">
                        <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">{r.nombreComercial || "Farmacia"}</h3>
                          <BadgeHorario estado={estado} />
                          {distKm != null && <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{distKm.toFixed(1)} km</span>}
                        </div>
                        <div className="flex flex-col text-on-surface-variant mt-1">
                          <span className="text-body-sm font-semibold">{r.direccion || "Dirección no disponible"}</span>
                          <span className="text-[12px] opacity-70">{r.distrito || ""}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <div className="relative group/maps inline-block">
                        <button className={btnCls}><span className="material-symbols-outlined text-[18px]">directions</span> Cómo llegar</button>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/maps:flex flex-col bg-white border border-outline-variant/30 rounded-lg shadow-xl p-2 z-20 min-w-[150px]">
                          <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 hover:bg-surface-container rounded text-body-sm"><img src={ICON.maps} alt="" className="w-[18px] h-[18px]" /> Google Maps</a>
                          <a href={wazeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 hover:bg-surface-container rounded text-body-sm"><img src={ICON.waze} alt="" className="w-[18px] h-[18px]" /> Waze</a>
                        </div>
                      </div>
                      {r.telefono && <a className={btnCls} href={`tel:${r.telefono}`}><span className="material-symbols-outlined text-[18px]">call</span> Llamar</a>}
                      {waNum && <a className={btnCls} href={`https://wa.me/${waNum}`} target="_blank" rel="noreferrer"><img src={ICON.wa} alt="" className="w-[18px] h-[18px]" /> WhatsApp</a>}
                      <button onClick={() => compartirWhatsApp(r.nombreComercial, precio.toFixed(2), tituloBusqueda, r.distrito, r.direccion, r.telefono, null, null, null)} className={btnCls}><span className="material-symbols-outlined text-[18px]">share</span> Compartir</button>
                    </div>
                  </div>

                  <div className="flex lg:flex-col justify-between items-end gap-2 shrink-0 lg:border-l lg:pl-8 lg:border-outline-variant/20">
                    <div className="text-right">
                      <span className={`text-[40px] font-bold leading-none ${esMejor ? "text-primary" : "text-on-surface"}`}>{precio > 0 ? fmt(precio) : "s/d"}</span>
                      <span className="block text-[11px] text-on-surface-variant mt-1">{precioUnidad ? "por unidad" : "precio caja"}</span>
                      {tieneMulti && <span className="block text-[13px] font-semibold text-on-surface mt-1">{fmt(precioCaja)} · caja de {r.fracciones || "?"} un</span>}
                    </div>
                    <button onClick={() => go("detalle", { variante, loc, registro: r })} className={`px-8 py-4 font-bold rounded-full transition-all active:scale-95 text-body-md w-full sm:w-auto ${esMejor ? "bg-primary text-white hover:bg-primary-container hover:shadow-lg" : "border-2 border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary hover:bg-primary/5"}`}>Ver detalle</button>
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
