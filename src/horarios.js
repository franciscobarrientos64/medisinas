// Utilidad compartida de horarios — usada por HorarioBadge y el filtro de App.jsx

export const CADENAS = [
  // InRetail (InkaFarma + MiFarma)
  { p:['INKAFARMA','INKA FARMA'],         a:'08:00', c:'22:00', da:'08:00', dc:'21:00', variantes24h:true },
  { p:['MIFARMA','MI FARMA'],             a:'08:00', c:'22:00', da:'08:00', dc:'21:00', variantes24h:true },
  // Arcángel
  { p:['ARCANGEL','ARCÁNGEL','BOTICAS ARCANGEL'], a:'08:00', c:'21:00', da:'09:00', dc:'20:00' },
  // Boticas y Salud
  { p:['BOTICAS Y SALUD','BOTICAS & SALUD','BTL'], a:'08:00', c:'22:00', da:'08:00', dc:'21:00' },
  // Farmacia Universal
  { p:['FARMACIA UNIVERSAL'],             a:'07:00', c:'22:00', da:'08:00', dc:'21:00', variantes24h:true },
  // Superfarma
  { p:['SUPERFARMA','SUPER FARMA'],       a:'08:00', c:'21:00', da:'09:00', dc:'20:00' },
  // Fasa
  { p:['BOTICAS FASA','FASA'],            a:'08:00', c:'22:00', da:'08:00', dc:'21:00' },
  // Más farma
  { p:['MAS FARMA','MASFARMA'],           a:'08:00', c:'21:00', da:'09:00', dc:'20:00' },
  // FarmaMinsa / MINSA (detectado por setcodigo='Público' en App.jsx, aquí como fallback)
  { p:['FARMAMINSA','FARMA MINSA'],       a:'08:00', c:'20:00', da:'08:00', dc:'14:00' },
  // BTL
  { p:['TORRES DE LIMATAMBO'],            a:'08:00', c:'22:00', da:'08:00', dc:'21:00' },
  // Botica independiente genérica
  { p:['BOTICA DE LA FAMILIA'],           a:'08:00', c:'21:00', da:'09:00', dc:'20:00' },
];

export function detectar24h(nombre) {
  if (!nombre) return false;
  return /24\s*h|24\s*hora|veinticuatro\s*hora/i.test(nombre);
}

export function esEstablecimientoPublico(nombre, setcodigo) {
  if (setcodigo === 'Público') return true;
  return /hospital|emergencia|essalud|minsa|farmaminsa|publico/i.test(nombre || '');
}

export function getCadena(nombre) {
  if (!nombre) return null;
  const n = nombre.toUpperCase();
  return CADENAS.find(c => c.p.some(p => n.includes(p))) || null;
}

export function getHorarioDia(cadena) {
  const esDomingo = new Date().getDay() === 0;
  return {
    apertura: esDomingo ? cadena.da : cadena.a,
    cierre:   esDomingo ? cadena.dc : cadena.c,
  };
}

export function estaAbierto(apertura, cierre) {
  const ahora = new Date();
  const [hA, mA] = apertura.split(':').map(Number);
  const [hC, mC] = cierre.split(':').map(Number);
  const min = ahora.getHours() * 60 + ahora.getMinutes();
  return min >= hA * 60 + mA && min < hC * 60 + mC;
}

// Retorna { estado: 'abierto'|'cerrado'|'24h'|'desconocido', apertura, cierre }
export function getEstadoFarmacia(nombre, setcodigo) {
  if (!nombre) return { estado: 'desconocido' };

  // 1. ¿Es 24h explícito?
  if (detectar24h(nombre)) return { estado: '24h' };

  // 2. ¿Es hospital/público?
  if (esEstablecimientoPublico(nombre, setcodigo)) return { estado: '24h' };

  // 3. Cadena conocida
  const cadena = getCadena(nombre);
  if (cadena) {
    const { apertura, cierre } = getHorarioDia(cadena);
    const abierto = estaAbierto(apertura, cierre);
    return {
      estado: abierto ? 'abierto' : 'cerrado',
      apertura,
      cierre,
    };
  }

  return { estado: 'desconocido' };
}
