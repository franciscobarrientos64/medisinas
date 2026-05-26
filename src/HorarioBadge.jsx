import { useEffect, useState } from 'react';

export function HorarioBadge({ nombreComercial, distrito, horariosVisible, setHorariosVisible, horariosCache }) {
  const key = `${nombreComercial}|${distrito || ''}`;
  const horario = horariosVisible[key];
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!nombreComercial || horario !== undefined) return;
    // Evitar múltiples llamadas simultáneas
    if (horariosCache.current[key] === 'loading') return;
    horariosCache.current[key] = 'loading';

    const timer = setTimeout(async () => {
      try {
        setCargando(true);
        const params = new URLSearchParams({ nombre: nombreComercial, distrito: distrito || '' });
        const res = await fetch(`/api/horario-farmacia?${params}`);
        const data = await res.json();
        horariosCache.current[key] = data;
        setHorariosVisible(prev => ({ ...prev, [key]: data }));
      } catch {
        horariosCache.current[key] = { found: false };
        setHorariosVisible(prev => ({ ...prev, [key]: { found: false } }));
      } finally {
        setCargando(false);
      }
    }, Math.random() * 1500); // escalonar peticiones para no saturar

    return () => clearTimeout(timer);
  }, [nombreComercial, distrito]);

  if (cargando) return <div style={badgeBase}>⏳ Verificando horario...</div>;
  if (!horario || !horario.found) return null;

  if (horario.is_24h) {
    return <div style={{...badgeBase, background:'#EDE9FE', color:'#5B21B6', borderColor:'#C4B5FD'}}>🌙 Abierto 24 horas</div>;
  }

  if (horario.abierto_ahora === true) {
    const cierre = horario.hora_cierre ? ` · Cierra a las ${horario.hora_cierre}` : '';
    return <div style={{...badgeBase, background:'#DCFCE7', color:'#166534', borderColor:'#86EFAC'}}>🟢 Abierto{cierre}</div>;
  }

  if (horario.abierto_ahora === false) {
    const apertura = horario.proxima_apertura ? ` · Abre el ${horario.proxima_apertura}` : horario.hora_apertura ? ` · Abre a las ${horario.hora_apertura}` : '';
    return <div style={{...badgeBase, background:'#FEE2E2', color:'#991B1B', borderColor:'#FCA5A5'}}>🔴 Cerrado{apertura}</div>;
  }

  return null;
}

const badgeBase = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 8,
  border: '1px solid',
  marginTop: 4,
  marginBottom: 2,
};
