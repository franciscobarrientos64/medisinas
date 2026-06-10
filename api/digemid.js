export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { endpoint, body } = req.body;
  const DIGEMID_BASE = 'https://ms-opm.minsa.gob.pe/msopmcovid';
  const url = `${DIGEMID_BASE}/${endpoint}`;

  let detalle = 'sin intentos';

  // Reintenta hasta 3 veces con backoff corto. DIGEMID a veces responde HTML/errores transitorios.
  for (let intento = 0; intento < 3; intento++) {
    try {
      if (intento > 0) await new Promise(r => setTimeout(r, 400 * intento));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://opm-digemid.minsa.gob.pe',
          'Referer': 'https://opm-digemid.minsa.gob.pe/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });

      const text = await response.text();

      if (!response.ok) {
        detalle = `DIGEMID status ${response.status}`;
        continue; // reintentar
      }

      // DIGEMID a veces devuelve HTML (WAF/errores). Intentar parsear JSON.
      try {
        const data = JSON.parse(text);
        return res.status(200).json(data);
      } catch {
        detalle = `respuesta no-JSON: ${text.slice(0, 80).replace(/\s+/g, ' ')}`;
        continue; // reintentar
      }
    } catch (error) {
      detalle = `${error.name}: ${error.message}`;
    }
  }

  return res.status(502).json({ error: 'DIGEMID no respondió correctamente', detalle });
}
