const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase
    .from("alertas_precio")
    .select("*")
    .eq("usuario_id", userId)
    .eq("activa", true)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ alertas: data || [] });
};
