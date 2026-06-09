import React, { useState } from "react";
import { DISTRITOS } from "./Resultados";

const FRECUENTES = ["Paracetamol 500mg", "Losartán 50mg", "Metformina 850mg", "Atorvastatina 20mg"];

const ACCESOS = [
  { id: "medicamentos", icon: "medication", t: "Mis medicinas", d: "Recordatorios de recompra" },
  { id: "recetas", icon: "description", t: "Mis recetas", d: "Guarda tus recetas médicas" },
  { id: "alertas", icon: "notifications_active", t: "Mis alertas", d: "Te avisamos cuando baje" },
  { id: "ahorro", icon: "savings", t: "Mi ahorro", d: "Cuánto has ahorrado" },
];

export default function Home({ go, activePersona }) {
  const [q, setQ] = useState("");
  const [distrito, setDistrito] = useState("Todos Lima");

  const buscar = (termino) => {
    const t = (termino || q).trim();
    if (t) go("resultados", { query: t });
  };

  return (
    <div className="px-margin-page py-10 max-w-6xl mx-auto space-y-10">
      {/* Hero */}
      <section className="ether-gradient rounded-xl overflow-hidden relative p-8 md:p-14 text-white">
        <span className="font-label-caps text-label-caps bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full uppercase tracking-widest">Precios oficiales DIGEMID · MINSA</span>
        <h1 className="font-display-lg text-display-lg md:text-[56px] leading-tight font-extrabold mt-6 max-w-2xl">
          Tu medicina, al mejor precio.
        </h1>
        <p className="font-body-md text-body-md text-white/75 max-w-lg mt-4">
          {activePersona ? `Comprando para ${activePersona.nombre}. ` : ""}Compara precios reales de farmacias en todo el Perú y encuentra dónde cuesta menos.
        </p>

        {/* Buscador */}
        <div className="mt-8 max-w-2xl">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              className="w-full h-16 pl-14 pr-32 rounded-full bg-white text-on-surface border-none focus:ring-4 focus:ring-white/30 text-body-md placeholder:text-outline shadow-lg"
              placeholder="Busca tu medicina, ej. Paracetamol"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <button onClick={() => buscar()} className="absolute right-2 top-2 bottom-2 px-7 rounded-full bg-primary text-white font-bold hover:bg-primary-container transition-all active:scale-95">
              Buscar
            </button>
          </div>
          <div className="flex gap-2 flex-wrap mt-4">
            {FRECUENTES.map((m) => (
              <button key={m} onClick={() => buscar(m)} className="px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-[13px] hover:bg-white/25 transition-all">
                {m}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Accesos rápidos */}
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

      {/* Confianza */}
      <section className="flex items-center gap-4 text-on-surface-variant justify-center py-6 border-t border-outline-variant/30">
        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
        <span className="text-label-caps uppercase">Datos oficiales DIGEMID · MINSA · actualizados a diario</span>
      </section>
    </div>
  );
}
