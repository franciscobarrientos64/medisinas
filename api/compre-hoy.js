const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { userId, medicamentoId } = req.body;
  if (!userId || !medicamentoId) return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const hoy = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("medicamentos_usuario")
    .update({ ultima_compra: hoy })
    .eq("id", medicamentoId)
    .eq("usuario_id", userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Calcular próxima compra
  let proxima = null;
  if (data.frecuencia_dias) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + data.frecuencia_dias);
    proxima = d.toISOString().split("T")[0];
  }

  return res.json({ success: true, ultima_compra: hoy, proxima_compra: proxima });
};
