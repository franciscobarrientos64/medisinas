import React, { useState } from "react";
import Buscador from "./Buscador";

// Barra superior compartida. Logo (Talina), navegación, buscador con autocompletado y persona activa.
export default function TopNav({ go, active, personas = [], activePersona, onChangePersona, user, onProfile }) {
  const [openPersona, setOpenPersona] = useState(false);

  const links = [
    { id: "home", label: "Inicio" },
    { id: "medicamentos", label: "Mis medicinas" },
    { id: "ahorro", label: "Mi ahorro" },
    { id: "familia", label: "Mi familia" },
  ];

  return (
    <nav className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/20 shadow-[0_8px_32px_0_rgba(63,83,196,0.06)]">
      <div className="flex justify-between items-center w-full px-margin-page py-4 gap-4">
        <div className="flex items-center gap-10 shrink-0">
          <button onClick={() => go("home")} className="font-logo text-[26px] font-bold text-primary">Medisinas</button>
          <span className="text-[10px] text-on-surface-variant/50">build 17</span>
          <div className="hidden lg:flex items-center gap-8 font-body-md text-body-md">
            {links.map((l) => (
              <button key={l.id} onClick={() => go(l.id)} className={active === l.id ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary transition-colors"}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="hidden sm:block w-72 max-w-full">
            <Buscador
              compact
              placeholder="Buscar medicina o síntoma..."
              onSelectVariante={(v) => go("resultados", { query: v.nombreProducto, variante: v })}
              onSearchText={(t) => go("resultados", { query: t })}
            />
          </div>

          {personas.length > 0 && (
            <div className="relative shrink-0">
              <button onClick={() => setOpenPersona((v) => !v)} className="flex items-center gap-2 bg-surface-container-high rounded-full pl-1.5 pr-3 py-1.5 hover:bg-surface-container-highest transition-all">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-bold" style={{ background: activePersona?.color || "#3c51c2" }}>{(activePersona?.nombre || "?")[0].toUpperCase()}</span>
                <span className="text-label-caps text-on-surface hidden md:inline">{activePersona?.nombre || "Persona"}</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
              </button>
              {openPersona && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-outline-variant/30 p-2 z-20">
                  <p className="text-label-caps text-on-surface-variant px-3 py-2 uppercase">Comprando para</p>
                  {personas.map((p) => (
                    <button key={p.id} onClick={() => { onChangePersona(p); setOpenPersona(false); }} className={`w-full flex items-center gap-2 p-2 rounded hover:bg-surface-container text-left text-body-sm ${activePersona?.id === p.id ? "bg-primary/5" : ""}`}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: p.color || "#3c51c2" }}>{(p.nombre || "?")[0].toUpperCase()}</span>
                      <span>{p.nombre}{p.es_titular ? " (tú)" : p.parentesco ? ` · ${p.parentesco}` : ""}</span>
                    </button>
                  ))}
                  <button onClick={() => { go("familia"); setOpenPersona(false); }} className="w-full flex items-center gap-2 p-2 rounded hover:bg-surface-container text-left text-body-sm text-primary mt-1 border-t border-outline-variant/30 pt-2">
                    <span className="material-symbols-outlined text-[18px]">group_add</span> Gestionar familia
                  </button>
                </div>
              )}
            </div>
          )}

          <button onClick={onProfile} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary active:scale-95 transition-all shrink-0">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
