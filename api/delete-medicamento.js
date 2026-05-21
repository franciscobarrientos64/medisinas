const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, medicamentoId } = req.body;
  if (!userId || !medicamentoId) return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error } = await supabase
    .from("medicamentos_usuario")
    .update({ activo: false })
    .eq("id", medicamentoId)
    .eq("usuario_id", userId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
};
