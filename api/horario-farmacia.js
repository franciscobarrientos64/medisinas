const { createClient } = require("@supabase/supabase-js");

const FB_APP_TOKEN = `${process.env.FB_APP_ID}|${process.env.FB_APP_SECRET}`;
const DIAS = ['sun','mon','tue','wed','thu','fri','sat'];
const DIAS_ES = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function parsearHorarios(hours) {
  if (!hours) return null;
  const horariosSemana = {};
  DIAS.forEach(dia => {
    const open  = hours[`${dia}_1_open`];
    const close = hours[`${dia}_1_close`];
    if (open && close) {
      horariosSemana[dia] = { open, close };
    }
  });
  return horariosSemana;
}

function estaAbierto(hours) {
  if (!hours) return null;
  const ahora = new Date();
  const diaSemana = DIAS[ahora.getDay()];
  const horarioDia = hours[`${diaSemana}_1_open`];
  const cierreDia  = hours[`${diaSemana}_1_close`];
  if (!horarioDia || !cierreDia) return null;

  const [hOpen, mOpen] = horarioDia.split(':').map(Number);
  const [hClose, mClose] = cierreDia.split(':').map(Number);
  const minutosAhora  = ahora.getHours() * 60 + ahora.getMinutes();
  const minutosOpen   = hOpen * 60 + mOpen;
  const minutosClose  = hClose * 60 + mClose;

  return minutosAhora >= minutosOpen && minutosAhora < minutosClose;
}

function proximaApertura(hours) {
  if (!hours) return null;
  const ahora = new Date();
  for (let i = 1; i <= 7; i++) {
    const diaIdx = (ahora.getDay() + i) % 7;
    const diaNombre = DIAS[diaIdx];
    const open = hours[`${diaNombre}_1_open`];
    if (open) {
      return `${DIAS_ES[diaIdx]} ${open}`;
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { nombre, distrito, lat, lon } = req.query;
  if (!nombre) return res.status(400).json({ error: 'nombre requerido' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // 1. Verificar caché (válido por 24h)
  const { data: cached } = await supabase
    .from('pharmacy_hours')
    .select('*')
    .eq('nombre_comercial', nombre.toUpperCase())
    .eq('distrito', distrito || '')
    .single();

  if (cached && cached.last_updated) {
    const horas = (Date.now() - new Date(cached.last_updated)) / 3600000;
    if (horas < 24) {
      // Recalcular abierto_ahora en tiempo real
      const abierto = cached.is_24h ? true : estaAbierto(cached.hours);
      return res.json({
        found: true,
        is_24h: cached.is_24h,
        abierto_ahora: abierto,
        hora_apertura: cached.hora_apertura,
        hora_cierre: cached.hora_cierre,
        dias_semana: cached.dias_semana,
        cached: true,
      });
    }
  }

  // 2. Buscar en Facebook Graph API
  try {
    const nombreBusqueda = nombre
      .replace(/BOTICA[S]?\s*/i, 'Botica ')
      .replace(/FARMACIA\s*/i, 'Farmacia ')
      .replace(/INKAFARMA/i, 'InkaFarma')
      .replace(/MIFARMA/i, 'MiFarma')
      .split(' ').slice(0, 4).join(' ');

    const center = lat && lon ? `&center=${lat},${lon}&distance=2000` : '';
    const url = `https://graph.facebook.com/v19.0/search?q=${encodeURIComponent(nombreBusqueda)}&type=place${center}&fields=name,hours,location,is_permanently_closed&limit=3&access_token=${FB_APP_TOKEN}`;

    const fbRes = await fetch(url);
    const fbData = await fbRes.json();

    if (fbData.error || !fbData.data?.length) {
      // No encontrado — guardar en caché como "no encontrado"
      await supabase.from('pharmacy_hours').upsert({
        nombre_comercial: nombre.toUpperCase(),
        distrito: distrito || '',
        hours: null,
        is_24h: false,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'nombre_comercial,distrito' });
      return res.json({ found: false });
    }

    // Tomar el primer resultado relevante
    const page = fbData.data[0];
    const hours = page.hours || null;
    const is24h = /24\s*h/i.test(page.name) || (hours && Object.keys(hours).length === 0);

    const horariosParsed = parsearHorarios(hours);
    const abierto = is24h ? true : estaAbierto(hours);
    const diaActual = DIAS[new Date().getDay()];
    const horaApertura = hours?.[`${diaActual}_1_open`] || null;
    const horaCierre   = hours?.[`${diaActual}_1_close`] || null;

    // 3. Guardar en caché
    await supabase.from('pharmacy_hours').upsert({
      nombre_comercial: nombre.toUpperCase(),
      distrito: distrito || '',
      facebook_page_id: page.id,
      hours,
      is_24h: is24h,
      hora_apertura: horaApertura,
      hora_cierre: horaCierre,
      dias_semana: horariosParsed,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'nombre_comercial,distrito' });

    return res.json({
      found: true,
      is_24h: is24h,
      abierto_ahora: abierto,
      hora_apertura: horaApertura,
      hora_cierre: horaCierre,
      dias_semana: horariosParsed,
      proxima_apertura: abierto === false ? proximaApertura(hours) : null,
      cached: false,
    });

  } catch (err) {
    console.error('Facebook API error:', err);
    return res.json({ found: false, error: err.message });
  }
};
