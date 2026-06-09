import React from "react";

const ITEMS = [
  { id: "medicamentos", icon: "medication", t: "Mis medicinas" },
  { id: "recetas", icon: "description", t: "Mis recetas" },
  { id: "alertas", icon: "notifications_active", t: "Mis alertas" },
  { id: "ahorro", icon: "savings", t: "Mi ahorro" },
  { id: "familia", icon: "group", t: "Mi familia" },
];

export default function Perfil({ go, user, onSignOut }) {
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">account_circle</span>
        <p className="text-body-md mb-4">Inicia sesión para ver tu cuenta.</p>
        <button onClick={() => go("login")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Ingresar</button>
      </div>
    );
  }

  return (
    <div className="px-margin-page py-10 max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-[28px] font-bold">{(user.nombre || user.telefono || "#")[0].toUpperCase()}</span>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{user.nombre || "Mi cuenta"}{user.apellido ? ` ${user.apellido}` : ""}</h1>
          <p className="text-on-surface-variant text-body-sm">{user.email || user.telefono || ""}</p>
        </div>
      </div>

      <div className="clinical-card rounded-lg overflow-hidden">
        {ITEMS.map((it, i) => (
          <button key={it.id} onClick={() => go(it.id)} className={`w-full flex items-center gap-4 p-5 hover:bg-surface-container text-left transition-colors ${i ? "border-t border-outline-variant/20" : ""}`}>
            <span className="material-symbols-outlined text-primary">{it.icon}</span>
            <span className="font-body-md text-body-md text-on-surface flex-1">{it.t}</span>
            <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
          </button>
        ))}
      </div>

      <button onClick={() => { onSignOut(); go("home"); }} className="w-full py-4 border-2 border-error text-error font-bold rounded-full hover:bg-error-container transition-all">Cerrar sesión</button>
    </div>
  );
}
