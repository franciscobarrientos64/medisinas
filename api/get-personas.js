const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId requerido" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  let { data: personas, error } = await supabase
    .from("personas")
    .select("*")
    .eq("usuario_id", userId)
    .eq("activo", true)
    .order("es_titular", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  // Auto-crear titular si el usuario aun no tiene personas (usuarios existentes)
  if (!personas || personas.length === 0) {
    const { data: u } = await supabase
      .from("usuarios")
      .select("nombre, genero, anio_nacimiento, condiciones")
      .eq("id", userId)
      .single();

    const { data: titular, error: insErr } = await supabase
      .from("personas")
      .insert({
        usuario_id: userId,
        nombre: u && u.nombre ? u.nombre : "Yo",
        parentesco: "yo",
        genero: (u && u.genero) || null,
        anio_nacimiento: (u && u.anio_nacimiento) || null,
        condiciones: (u && u.condiciones) || [],
        es_titular: true,
      })
      .select()
      .single();

    if (insErr) return res.status(500).json({ error: insErr.message });
    personas = [titular];
  }

  return res.json({ personas });
};
