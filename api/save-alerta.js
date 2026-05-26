const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { userId, telefono, nombre_producto, concent, grupo, cod_grupo_ff, precio_objetivo, distrito } = req.body;
  if (!userId || !nombre_producto || !precio_objetivo) return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Upsert: una alerta por medicamento + usuario + distrito
  const { data, error } = await supabase
    .from("alertas_precio")
    .upsert({
      usuario_id: userId,
      nombre_producto,
      concent,
      grupo,
      cod_grupo_ff,
      precio_objetivo,
      distrito: distrito || null,
      activa: true,
      ultima_notificacion: null,
    }, { onConflict: "usuario_id,grupo,cod_grupo_ff,concent" })
    .select().single();

  if (error) {
    // Si falla el upsert por constraint, insertar nuevo
    const { data: ins, error: insErr } = await supabase
      .from("alertas_precio")
      .insert({ usuario_id: userId, nombre_producto, concent, grupo, cod_grupo_ff, precio_objetivo, distrito: distrito || null, activa: true })
      .select().single();
    if (insErr) return res.status(500).json({ error: insErr.message });
    return res.json({ success: true, alerta: ins });
  }
  return res.json({ success: true, alerta: data });
};
