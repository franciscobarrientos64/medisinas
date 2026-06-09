import React, { useState, useEffect, useMemo, useCallback } from "react";
import { buscarVariantes, consultarPrecios } from "../digemidApi";
import { getLocalUser } from "../UserAuth";
import { fmt, precioDe, BadgeHorario } from "./Resultados";

// Mini gráfico de líneas (precio mínimo en el tiempo) sin librerías.
function SparkLine({ puntos }) {
  if (!puntos || puntos.length < 2) return null;
  const W = 600, H = 160, P = 24;
  const ys = puntos.map((p) => p.precio_min);
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  const x = (i) => P + (i * (W - 2 * P)) / (puntos.length - 1);
  const y = (v) => H - P - ((v - min) / span) * (H - 2 * P);
  const d = puntos.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.precio_min)}`).join(" ");
  const area = `${d} L ${x(puntos.length - 1)} ${H - P} L ${x(0)} ${H - P} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-40">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3c51c2" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3c51c2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#g)" />
      <path d={d} fill="none" stroke="#3c51c2" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {puntos.map((p, i) => (<circle key={i} cx={x(i)} cy={y(p.precio_min)} r="3" fill="#3c51c2" />))}
    </svg>
  );
}

export default function Detalle({ params = {}, go, activePersona }) {
  const { variante: vIni, loc } = params;
  const [variante, setVariante] = useState(vIni || null);
  const [concentraciones, setConcentraciones] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [msg, setMsg] = useState("");

  const dep = loc?.dep ?? 15;
  const prov = loc?.prov ?? 1501;
  const ubigeo = loc?.ubigeo ?? null;
  const distritoEspecifico = loc?.distrito && loc.distrito !== "Todos los distritos" ? loc.distrito : null;
  const zonaTxt = loc ? (distritoEspecifico ? `${loc.ciudad} · ${loc.distrito}` : (loc.ciudad || loc.region || "Todo el Perú")) : "Lima";

  useEffect(() => {
    if (!vIni?.nombreProducto) return;
    buscarVariantes(vIni.nombreProducto.split(" ")[0]).then((vars) => {
      const mismas = vars.filter((v) => v.grupo === vIni.grupo);
      setConcentraciones(mismas.length ? mismas : vars.slice(0, 6));
    });
  }, [vIni]);

  const cargarPrecios = useCallback(async (vari) => {
    if (!vari) return;
    setLoading(true);
    const { registros: regs } = await consultarPrecios(vari.grupo, vari.codGrupoFF, vari.concent, ubigeo, dep, prov, 1, 60);
    regs.sort((a, b) => (precioDe(a) || 1e9) - (precioDe(b) || 1e9));
    setRegistros(regs);
    setLoading(false);
  }, [dep, prov, ubigeo]);

  useEffect(() => { if (variante) cargarPrecios(variante); }, [variante, cargarPrecios]);

  useEffect(() => {
    if (!variante) return;
    const qs = new URLSearchParams({
      grupo: variante.grupo, cod_grupo_ff: String(variante.codGrupoFF), concent: variante.concent || "",
      ...(distritoEspecifico ? { distrito: distritoEspecifico } : {}), dias: "90",
    });
    fetch(`/api/data?action=historial-precios&${qs}`).then((r) => r.json()).then((d) => setHistorial(d.historial || [])).catch(() => {});
  }, [variante, distritoEspecifico]);

  const { minP, maxP, ahorro } = useMemo(() => {
    const precios = registros.map(precioDe).filter((p) => p > 0);
    const mn = precios.length ? Math.min(...precios) : null;
    const mx = precios.length ? Math.max(...precios) : null;
    return { minP: mn, maxP: mx, ahorro: mn && mx ? mx - mn : 0 };
  }, [registros]);

  const guardarMed = async () => {
    const user = getLocalUser();
    if (!user?.id) { go("login"); return; }
    const res = await fetch("/api/data?action=save-medicamento", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, persona_id: activePersona?.id || null, medicamento: { nombreProducto: variante.nombreProducto, concent: variante.concent, nombreFormaFarmaceutica: variante.nomGrupoFF, grupo: variante.grupo, codGrupoFF: variante.codGrupoFF } }),
    }).then((r) => r.json());
    setMsg(res.success ? "✓ Guardado en mis medicinas" : "No se pudo guardar");
    setTimeout(() => setMsg(""), 2500);
  };

  const crearAlerta = async () => {
    const user = getLocalUser();
    if (!user?.id) { go("login"); return; }
    const objetivo = minP ? Math.round(minP * 0.9 * 100) / 100 : null;
    const res = await fetch("/api/data?action=save-alerta", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, nombre_producto: variante.nombreProducto, concent: variante.concent, grupo: variante.grupo, cod_grupo_ff: String(variante.codGrupoFF), precio_objetivo: objetivo, distrito: distritoEspecifico }),
    }).then((r) => r.json());
    setMsg(res.success ? `✓ Alerta creada (te avisamos si baja de ${fmt(objetivo)})` : "No se pudo crear la alerta");
    setTimeout(() => setMsg(""), 3000);
  };

  if (!variante) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-on-surface-variant">
        <p className="text-body-md mb-4">No hay un medicamento seleccionado.</p>
        <button onClick={() => go("home")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Buscar medicina</button>
      </div>
    );
  }

  return (
    <div className="px-margin-page py-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <button onClick={() => go("resultados", { query: variante.nombreProducto, loc })} className="flex items-center gap-2 text-on-surface-variant hover:text-primary text-body-sm">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span> Volver a resultados
        </button>
        <button onClick={() => go("home")} className="flex items-center gap-2 text-primary font-bold text-body-sm hover:underline">
          <span className="material-symbols-outlined text-[20px]">search</span> Nueva búsqueda
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        <div className="lg:w-[40%] lg:sticky lg:top-24 self-start space-y-6">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface leading-tight">{variante.nombreProducto}</h1>
            <p className="text-on-surface-variant text-body-md mt-1">{variante.nomGrupoFF || "Medicamento"}{variante.nombreSustancia ? ` · ${variante.nombreSustancia}` : ""}</p>
          </div>

          {concentraciones.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {concentraciones.map((c) => (
                <button key={c.concent + c.codGrupoFF} onClick={() => setVariante(c)} className={`px-4 py-2 rounded-full text-body-sm font-semibold transition-all ${c.concent === variante.concent ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}>
                  {c.concent || "s/d"}
                </button>
              ))}
            </div>
          )}

          <div className="clinical-card rounded-lg p-6 clinical-shadow">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><span className="block text-label-caps text-on-surface-variant uppercase mb-1">Más barato</span><span className="text-[28px] font-bold text-primary leading-none">{minP ? fmt(minP) : "—"}</span></div>
              <div><span className="block text-label-caps text-on-surface-variant uppercase mb-1">Más caro</span><span className="text-[28px] font-bold text-on-surface-variant leading-none">{maxP ? fmt(maxP) : "—"}</span></div>
              <div><span className="block text-label-caps text-on-surface-variant uppercase mb-1">Ahorras</span><span className="text-[28px] font-bold text-secondary leading-none">{ahorro ? fmt(ahorro) : "—"}</span></div>
            </div>
            <p className="text-body-sm text-on-surface-variant text-center mt-3">Comparado en {registros.length} farmacias de {zonaTxt}.</p>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={guardarMed} className="w-full py-4 bg-primary text-white font-bold rounded-full hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-2"><span className="material-symbols-outlined">add</span> Guardar en mis medicinas</button>
            <button onClick={crearAlerta} className="w-full py-4 border-2 border-primary text-primary font-bold rounded-full hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center gap-2"><span className="material-symbols-outlined">notifications</span> Crear alerta de precio</button>
            {msg && <p className="text-center text-body-sm text-green-700">{msg}</p>}
          </div>
        </div>

        <div className="lg:w-[60%] space-y-8">
          <div className="clinical-card rounded-lg p-6 clinical-shadow">
            <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-1">Historial de precio</h2>
            <p className="text-body-sm text-on-surface-variant mb-4">Precio más bajo en {zonaTxt}, últimos 90 días.</p>
            {historial.length >= 2 ? (
              <>
                <SparkLine puntos={historial} />
                <div className="flex justify-between text-label-caps text-on-surface-variant mt-2"><span>{historial[0].fecha}</span><span>{historial[historial.length - 1].fecha}</span></div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-on-surface-variant py-6">
                <span className="material-symbols-outlined text-outline">timeline</span>
                <span className="text-body-sm">Aún estamos juntando historial. Vuelve en unos días para ver la tendencia.</span>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Dónde comprarlo</h2>
            {loading && <p className="text-on-surface-variant text-body-sm">Cargando farmacias…</p>}
            <div className="space-y-3">
              {registros.slice(0, 12).map((r, i) => {
                const precio = precioDe(r);
                const esMejor = i === 0 && precio > 0 && precio === minP;
                return (
                  <div key={`${r.codEstab}-${i}`} className="clinical-card rounded-lg p-5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-headline-lg text-[18px] text-on-surface truncate">{r.nombreComercial}</h3>
                        <BadgeHorario nombre={r.nombreComercial} setcodigo={r.setcodigo} />
                        {esMejor && <span className="text-[10px] font-bold uppercase text-secondary">Más barato</span>}
                      </div>
                      <p className="text-body-sm text-on-surface-variant truncate">{r.direccion} · {r.distrito}</p>
                    </div>
                    <span className={`text-[26px] font-bold shrink-0 ${esMejor ? "text-primary" : "text-on-surface"}`}>{precio > 0 ? fmt(precio) : "s/d"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
