const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, nombre, apellido, anio_nacimiento, genero, email } = req.body;
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error } = await supabase
    .from("usuarios")
    .update({ nombre, apellido, anio_nacimiento, genero, email: email || null })
    .eq("id", userId);

  if (error) {
    console.error("update-profile error:", error);
    return res.status(500).json({ error: error.message });
  }

  return res.json({ success: true });
};
