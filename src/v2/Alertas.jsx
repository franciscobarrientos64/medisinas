import React, { useState, useEffect, useCallback } from "react";
import { getLocalUser } from "../UserAuth";

const fmt = (n) => `S/ ${Number(n || 0).toFixed(2)}`;

export default function Alertas({ go }) {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = getLocalUser();

  const cargar = useCallback(() => {
    if (!user?.id) { setLoading(false); return; }
    fetch(`/api/get-alertas?userId=${user.id}`).then((r) => r.json()).then((d) => { setAlertas(d.alertas || []); setLoading(false); }).catch(() => setLoading(false));
  }, [user]);

  useEffect(() => { cargar(); }, [cargar]);

  const eliminar = async (a) => {
    await fetch("/api/delete-alerta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, alertaId: a.id }) });
    cargar();
  };

  if (!user?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-5xl text-outline mb-4">notifications_active</span>
        <p className="text-body-md mb-4">Inicia sesión para ver tus alertas de precio.</p>
        <button onClick={() => go("login")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Ingresar</button>
      </div>
    );
  }

  return (
    <div className="px-margin-page py-10 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface">Mis alertas</h1>
        <p className="text-on-surface-variant text-body-md mt-1">Te avisamos por email cuando una medicina baje de tu precio objetivo.</p>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
      ) : alertas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-5xl text-outline mb-4">notifications_off</span>
          <p className="text-body-md mb-4">No tienes alertas activas. Créalas desde el detalle de un medicamento.</p>
          <button onClick={() => go("home")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Buscar medicina</button>
        </div>
      ) : (
        <div className="space-y-3">
          {alertas.map((a) => (
            <div key={a.id} className="clinical-card rounded-lg p-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-headline-lg text-[18px] text-on-surface">{a.nombre_producto} {a.concent || ""}</h3>
                <p className="text-body-sm text-on-surface-variant">Te avisamos si baja de <strong className="text-primary">{fmt(a.precio_objetivo)}</strong>{a.distrito ? ` en ${a.distrito}` : ""}.</p>
              </div>
              <button onClick={() => eliminar(a)} className="w-10 h-10 rounded-full hover:bg-error-container flex items-center justify-center text-on-surface-variant hover:text-error"><span className="material-symbols-outlined">delete</span></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
