const { createClient } = require("@supabase/supabase-js");

// Devuelve los acumulados de ahorro del usuario.
// - real: solo cuenta cuando el usuario confirmo la compra (defendible).
// - potencial: suma de (mas caro - mas barato) de cada busqueda (motivador).
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from("ahorros")
    .select("persona_id, ahorro_potencial, ahorro_real, comprado, created_at")
    .eq("usuario_id", userId);

  if (error) return res.status(500).json({ error: error.message });

  const rows = data || [];
  const round2 = (n) => Math.round(n * 100) / 100;
  const sum = (arr, f) => round2(arr.reduce((a, r) => a + (Number(r[f]) || 0), 0));

  const now = new Date();
  const delMes = rows.filter((r) => {
    const d = new Date(r.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const comprados = rows.filter((r) => r.comprado);

  // Ahorro real acumulado por persona
  const por_persona = {};
  for (const r of comprados) {
    const k = r.persona_id || "sin_persona";
    por_persona[k] = round2((por_persona[k] || 0) + (Number(r.ahorro_real) || 0));
  }

  return res.json({
    ahorro_real_total: sum(comprados, "ahorro_real"),
    ahorro_potencial_total: sum(rows, "ahorro_potencial"),
    ahorro_real_mes: sum(delMes.filter((r) => r.comprado), "ahorro_real"),
    ahorro_potencial_mes: sum(delMes, "ahorro_potencial"),
    num_busquedas: rows.length,
    num_compras: comprados.length,
    por_persona,
  });
};
