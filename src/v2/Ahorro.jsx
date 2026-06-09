import React, { useState, useEffect } from "react";
import { getLocalUser } from "../UserAuth";

const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

export default function Ahorro({ go, personas = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getLocalUser();

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    fetch(`/api/data?action=get-ahorros&userId=${user.id}`).then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  const nombrePersona = (id) => {
    if (id === "sin_persona") return "Sin asignar";
    return personas.find((p) => p.id === id)?.nombre || "Persona";
  };

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">savings</span>
        <p className="text-body-md mb-4">Inicia sesión para ver cuánto has ahorrado.</p>
        <button onClick={() => go("login")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Ingresar</button>
      </div>
    );
  }

  return (
    <div className="px-margin-page py-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Mi ahorro</h1>
        <p className="text-on-surface-variant text-body-md mt-1">Lo que llevas ahorrado comparando precios con Medisinas.</p>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
      ) : (
        <>
          {/* Destacado: ahorro real */}
          <section className="ether-gradient rounded-xl p-8 md:p-12 text-white">
            <span className="font-label-caps text-label-caps uppercase tracking-widest text-white/60">Ahorro real acumulado</span>
            <p className="font-display-lg text-[64px] leading-none my-3">{fmt(data?.ahorro_real_total)}</p>
            <p className="text-white/80 text-body-md">En {data?.num_compras || 0} compras confirmadas. Este mes: {fmt(data?.ahorro_real_mes)}.</p>
          </section>

          {/* Secundarios */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-gutter-grid">
            <div className="clinical-card rounded-lg p-6">
              <span className="material-symbols-outlined text-primary mb-2">trending_down</span>
              <p className="font-headline-lg text-headline-lg text-on-surface">{fmt(data?.ahorro_potencial_total)}</p>
              <p className="text-body-sm text-on-surface-variant">Ahorro potencial detectado</p>
            </div>
            <div className="clinical-card rounded-lg p-6">
              <span className="material-symbols-outlined text-primary mb-2">search</span>
              <p className="font-headline-lg text-headline-lg text-on-surface">{data?.num_busquedas || 0}</p>
              <p className="text-body-sm text-on-surface-variant">Búsquedas realizadas</p>
            </div>
            <div className="clinical-card rounded-lg p-6">
              <span className="material-symbols-outlined text-primary mb-2">shopping_bag</span>
              <p className="font-headline-lg text-headline-lg text-on-surface">{data?.num_compras || 0}</p>
              <p className="text-body-sm text-on-surface-variant">Compras confirmadas</p>
            </div>
          </section>

          {/* Por persona */}
          {data?.por_persona && Object.keys(data.por_persona).length > 0 && (
            <section>
              <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface mb-4">Ahorro por persona</h2>
              <div className="space-y-2">
                {Object.entries(data.por_persona).map(([id, monto]) => (
                  <div key={id} className="clinical-card rounded-lg p-5 flex items-center justify-between">
                    <span className="font-headline-lg text-[18px] text-on-surface">{nombrePersona(id)}</span>
                    <span className="text-[22px] font-bold text-primary">{fmt(monto)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <p className="text-body-sm text-on-surface-variant border-t border-outline-variant/30 pt-4">
            El <strong>ahorro real</strong> solo cuenta cuando confirmas dónde compraste. El <strong>potencial</strong> es la diferencia entre la farmacia más cara y la más barata de tu distrito en cada búsqueda.
          </p>
        </>
      )}
    </div>
  );
}
