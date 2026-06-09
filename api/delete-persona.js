const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, personaId } = req.body;
  if (!userId || !personaId) return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // No permitir eliminar al titular de la cuenta
  const { data: p } = await supabase
    .from("personas")
    .select("es_titular")
    .eq("id", personaId)
    .eq("usuario_id", userId)
    .single();

  if (!p) return res.status(404).json({ error: "Persona no encontrada" });
  if (p.es_titular)
    return res.status(400).json({ error: "No puedes eliminar al titular de la cuenta." });

  // Soft delete
  const { error } = await supabase
    .from("personas")
    .update({ activo: false })
    .eq("id", personaId)
    .eq("usuario_id", userId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
};
