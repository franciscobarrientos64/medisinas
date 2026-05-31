const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const {
    userId, foto_url, medicamentos, doctor_nombre, especialidad,
    fecha_emision, fecha_vencimiento, diagnostico,
    periodicidad, cantidad_por_periodo, notas,
  } = req.body;

  if (!userId || !medicamentos?.length) {
    return res.status(400).json({ error: "userId y medicamentos requeridos" });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  const { data, error } = await supabase
    .from("recetas_medicas")
    .insert({
      usuario_id: userId,
      foto_url: foto_url || null,
      medicamentos,
      doctor_nombre: doctor_nombre || null,
      especialidad: especialidad || null,
      fecha_emision: fecha_emision || null,
      fecha_vencimiento: fecha_vencimiento || null,
      diagnostico: diagnostico || null,
      periodicidad: periodicidad || "mensual",
      cantidad_por_periodo: cantidad_por_periodo || null,
      notas: notas || null,
      activa: true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true, receta: data });
};
