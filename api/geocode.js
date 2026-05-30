const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { farmacias } = req.body; // [{direccion, distrito}]
  if (!farmacias?.length) return res.json({ coords: [] });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const LIMA_BBOX = '-77.5,-12.5,-76.5,-11.5';
  const resultado = [];

  for (const f of farmacias.slice(0, 15)) {
    const dir = (f.direccion || '').trim();
    const dis = (f.distrito || '').trim();
    if (!dir) { resultado.push(null); continue; }

    // 1. Buscar en caché
    const { data: cached } = await supabase
      .from('geocoding_cache')
      .select('lat,lon')
      .eq('direccion', dir)
      .eq('distrito', dis)
      .single();

    if (cached) {
      resultado.push({ lat: parseFloat(cached.lat), lon: parseFloat(cached.lon) });
      continue;
    }

    // 2. Geocodificar y guardar
    try {
      const q = encodeURIComponent(`${dir}, ${dis}, Lima, Peru`);
      const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=pe&viewbox=${LIMA_BBOX}&bounded=1`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'MediSinas/1.0 info@medisinas.com' },
        signal: AbortSignal.timeout(5000),
      });
      const data = await resp.json();
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        if (lat >= -12.5 && lat <= -11.5 && lon >= -77.5 && lon <= -76.5) {
          // Guardar en caché
          await supabase.from('geocoding_cache').upsert(
            { direccion: dir, distrito: dis, lat, lon },
            { onConflict: 'direccion,distrito' }
          );
          resultado.push({ lat, lon });
          continue;
        }
      }
    } catch {}
    resultado.push(null);
  }

  return res.json({ coords: resultado });
};
