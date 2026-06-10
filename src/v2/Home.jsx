import React, { useState, useMemo, useCallback } from "react";
import { UBIGEOS } from "../ubigeos";
import { getHistorial } from "../utils";
import Buscador from "./Buscador";

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
      <select value={value} onChange={onChange} className="w-full h-11 pl-4 pr-9 rounded-full bg-surface-container-low bg-none text-on-surface border-none text-body-sm appearance-none cursor-pointer focus:ring-2 focus:ring-primary/30">
        {children}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[20px]">expand_more</span>
    </div>
  );
}

export default function Home({ go, activePersona }) {
  const [region, setRegion] = useState("LIMA METROPOLITANA");
  const [ciudad, setCiudad] = useState("Lima");
  const [distrito, setDistrito] = useState("Todos los distritos");
  const recientes = useMemo(() => getHistorial(), []);

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

  return (
    <main className="flex flex-col md:flex-row min-h-[calc(100vh-73px)]">
      {/* IZQUIERDA — Ether */}
      <section className="md:w-[42%] ether-gradient relative overflow-hidden flex flex-col justify-between p-8 md:p-12 text-white">
        <div className="relative z-10">
          <span className="font-label-caps text-label-caps bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-widest">Precios oficiales DIGEMID · MINSA</span>
          <h1 className="font-display-lg text-display-lg md:text-[56px] leading-tight font-extrabold mt-8">
            Tu salud,<br /><span className="opacity-80">tu dinero,</span><br />tu elección.
          </h1>
          <p className="font-body-md text-body-md text-white/75 max-w-sm mt-6">
            Comparamos precios en tiempo real en farmacias de todo el Perú para que pagues lo justo por tus medicinas.
          </p>
        </div>
        <div className="relative z-10 mt-10 grid grid-cols-2 gap-4">
          <div className="glass-card rounded-lg p-5"><p className="font-headline-lg text-headline-lg font-bold">+10 mil</p><p className="font-label-caps text-label-caps text-white/60">Farmacias</p></div>
          <div className="glass-card rounded-lg p-5"><p className="font-headline-lg text-headline-lg font-bold">100%</p><p className="font-label-caps text-label-caps text-white/60">Datos oficiales</p></div>
        </div>
      </section>

      {/* DERECHA — Workspace */}
      <section className="flex-1 bg-surface px-6 md:px-12 py-10">
        <div className="max-w-2xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Buscar medicamento</h2>
          <p className="text-on-surface-variant text-body-md mb-6">
            {activePersona ? `Comprando para ${activePersona.nombre}. ` : ""}Escribe el nombre o un síntoma y elige de la lista.
          </p>

          <Buscador
            placeholder="Ej. Paracetamol o dolor de cabeza"
            onSelectVariante={(v) => go("resultados", { query: v.nombreProducto, loc: getLoc(), variante: v })}
            onSearchText={(t) => go("resultados", { query: t, loc: getLoc() })}
          />

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <MiniSelect value={region} onChange={onRegion}>{Object.keys(UBIGEOS).map((r) => <option key={r} value={r}>{r}</option>)}</MiniSelect>
            <MiniSelect value={ciudad} onChange={onCiudad}>{provincias.map((p) => <option key={p} value={p}>{p}</option>)}</MiniSelect>
            <MiniSelect value={distrito} onChange={(e) => setDistrito(e.target.value)}>{distritos.map((d) => <option key={d} value={d}>{d}</option>)}</MiniSelect>
          </div>

          {/* Recientes (variante completa → búsqueda confiable) o sugerencias */}
          {recientes.length > 0 ? (
            <div className="mt-5">
              <p className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant mb-2">Tus búsquedas recientes</p>
              <div className="flex gap-2 flex-wrap">
                {recientes.map((v, i) => (
                  <button
                    key={`${v.grupo}-${v.codGrupoFF}-${v.concent}-${i}`}
                    onClick={() => go("resultados", { query: `${v.nombreProducto}${v.concent ? " " + v.concent : ""}`, loc: getLoc(), variante: v })}
                    className="flex items-center gap-1.5 pl-3 pr-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-[13px] hover:bg-surface-container-highest transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                    {v.nombreProducto}{v.concent ? <strong className="font-semibold ml-0.5">{v.concent}</strong> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <p className="font-label-caps text-label-caps uppercase tracking-widest text-on-surface-variant mb-2">Búsquedas frecuentes</p>
              <div className="flex gap-2 flex-wrap">
                {FRECUENTES.map((m) => (
                  <button key={m} onClick={() => go("resultados", { query: m, loc: getLoc() })} className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-[13px] hover:bg-surface-container-highest transition-all">{m}</button>
                ))}
              </div>
            </div>
          )}

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
