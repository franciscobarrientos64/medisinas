const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const {
    userId,
    id,
    nombre,
    parentesco,
    genero,
    anio_nacimiento,
    condiciones,
    alergias,
    color,
  } = req.body;

  if (!userId || !nombre) return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const fields = {
    nombre,
    parentesco: parentesco || null,
    genero: genero || null,
    anio_nacimiento: anio_nacimiento || null,
    condiciones: condiciones || [],
    alergias: alergias || [],
    color: color || null,
  };

  // Actualizar persona existente
  if (id) {
    const { data, error } = await supabase
      .from("personas")
      .update(fields)
      .eq("id", id)
      .eq("usuario_id", userId)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true, action: "updated", persona: data });
  }

  // Crear nueva persona
  const { data, error } = await supabase
    .from("personas")
    .insert({ usuario_id: userId, ...fields })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true, action: "created", persona: data });
};
