const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from("medicamentos_usuario")
    .select("*")
    .eq("usuario_id", userId)
    .eq("activo", true)
    .order("ultima_compra", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ medicamentos: data || [] });
};
