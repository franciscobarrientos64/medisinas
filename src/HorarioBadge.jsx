import { useEffect, useState } from 'react';

// Horarios estándar por cadena (lunes-sábado / domingo)
const CADENAS_HORARIO = [
  { patrones: ['INKAFARMA','INKA FARMA'], apertura:'08:00', cierre:'22:00', domCierre:'21:00' },
  { patrones: ['MIFARMA','MI FARMA'], apertura:'08:00', cierre:'22:00', domCierre:'21:00' },
  { patrones: ['ARCANGEL','ARCÁNGEL'], apertura:'08:00', cierre:'21:00', domCierre:'20:00' },
  { patrones: ['SUPERFARMA','SUPER FARMA'], apertura:'08:00', cierre:'21:00', domCierre:'20:00' },
  { patrones: ['FARMACIA UNIVERSAL'], apertura:'08:00', cierre:'21:00', domCierre:'20:00' },
  { patrones: ['BOTICAS & SALUD','BOTICAS Y SALUD'], apertura:'08:00', cierre:'22:00', domCierre:'21:00' },
];

function detectar24h(nombre) {
  return /24\s*h|24\s*horas|veinticuatro\s*horas/i.test(nombre);
}

function getHorarioCadena(nombre) {
  const n = nombre.toUpperCase();
  for (const c of CADENAS_HORARIO) {
    if (c.patrones.some(p => n.includes(p))) return c;
  }
  return null;
}

function estaAbiertoAhora(apertura, cierre) {
  const ahora = new Date();
  const [hA, mA] = apertura.split(':').map(Number);
  const [hC, mC] = cierre.split(':').map(Number);
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  return min >= hA * 60 + mA && min < hC * 60 + mC;
}

export function HorarioBadge({ nombreComercial }) {
  const [horario, setHorario] = useState(null);

  useEffect(() => {
    if (!nombreComercial) return;

    // 1. ¿Es 24h por nombre?
    if (detectar24h(nombreComercial)) {
      setHorario({ tipo: '24h' });
      return;
    }

    // 2. ¿Es establecimiento público/hospital? (generalmente 24h)
    if (/hospital|emergencia|clinica|essalud|minsa/i.test(nombreComercial)) {
      setHorario({ tipo: '24h' });
      return;
    }

    // 3. Cadena conocida — usar horario estándar
    const cadena = getHorarioCadena(nombreComercial);
    if (cadena) {
      const esDomingo = new Date().getDay() === 0;
      const apertura = cadena.apertura;
      const cierre = esDomingo ? cadena.domCierre : cadena.cierre;
      const abierto = estaAbiertoAhora(apertura, cierre);
      setHorario({
        tipo: abierto ? 'abierto' : 'cerrado',
        apertura,
        cierre,
        esDomingo,
      });
      return;
    }

    // 4. Sin datos — intentar Facebook API en background
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ nombre: nombreComercial });
        const res = await fetch(`/api/horario-farmacia?${params}`);
        const data = await res.json();
        if (data.found) {
          if (data.is_24h) setHorario({ tipo: '24h' });
          else if (data.abierto_ahora === true)  setHorario({ tipo: 'abierto', cierre: data.hora_cierre });
          else if (data.abierto_ahora === false) setHorario({ tipo: 'cerrado', apertura: data.hora_apertura, proxima: data.proxima_apertura });
        }
      } catch {}
    }, Math.random() * 2000);
    return () => clearTimeout(timer);
  }, [nombreComercial]);

  if (!horario) return null;

  if (horario.tipo === '24h') {
    return <Badge bg="#EDE9FE" color="#5B21B6" border="#C4B5FD">🌙 Abierto 24 horas</Badge>;
  }
  if (horario.tipo === 'abierto') {
    const txt = horario.cierre ? ` · Cierra ${horario.cierre}` : '';
    return <Badge bg="#DCFCE7" color="#166534" border="#86EFAC">🟢 Abierto{txt}</Badge>;
  }
  if (horario.tipo === 'cerrado') {
    const txt = horario.proxima ? ` · Abre ${horario.proxima}` : horario.apertura ? ` · Abre ${horario.apertura}` : '';
    return <Badge bg="#FEE2E2" color="#991B1B" border="#FCA5A5">🔴 Cerrado{txt}</Badge>;
  }
  return null;
}

function Badge({ bg, color, border, children }) {
  return (
    <div style={{
      display:'inline-block', fontSize:11, fontWeight:600,
      padding:'3px 8px', borderRadius:8,
      background: bg, color, border: `1px solid ${border}`,
      marginTop:4, marginBottom:2,
    }}>
      {children}
    </div>
  );
}
