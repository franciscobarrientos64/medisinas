export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { endpoint, body } = req.body;
  const DIGEMID_BASE = 'https://ms-opm.minsa.gob.pe/msopmcovid';
  const url = `${DIGEMID_BASE}/${endpoint}`;

  // Retry hasta 3 veces con backoff exponencial
  for (let intento = 0; intento < 3; intento++) {
    try {
      if (intento > 0) await new Promise(r => setTimeout(r, 800 * intento));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://opm-digemid.minsa.gob.pe',
          'Referer': 'https://opm-digemid.minsa.gob.pe/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        if (intento < 2) continue; // retry
        return res.status(502).json({ error: `DIGEMID respondió ${response.status}` });
      }

      const data = await response.json();
      return res.status(200).json(data);

    } catch (error) {
      if (intento === 2) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
}
