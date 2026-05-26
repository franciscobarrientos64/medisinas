const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, medicamento, frecuencia_dias, cantidad_unidades, compraste_hoy, ultima_compra } = req.body;
  if (!userId || !medicamento) return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Verificar si ya existe
  const { data: existing } = await supabase
    .from("medicamentos_usuario")
    .select("id")
    .eq("usuario_id", userId)
    .eq("grupo", medicamento.grupo)
    .eq("cod_grupo_ff", String(medicamento.codGrupoFF))
    .eq("concent", medicamento.concent)
    .single();

  if (existing) {
    // Actualizar ultima_compra
    await supabase
      .from("medicamentos_usuario")
      .update({ activo: true, ultima_compra: new Date().toISOString().split("T")[0] })
      .eq("id", existing.id);
    return res.json({ success: true, action: "updated", id: existing.id });
  }

  // Insertar nuevo
  const { data, error } = await supabase
    .from("medicamentos_usuario")
    .insert({
      usuario_id: userId,
      nombre_producto: medicamento.nombreProducto,
      concent: medicamento.concent,
      forma_farmaceutica: medicamento.nombreFormaFarmaceutica || null,
      grupo: medicamento.grupo,
      cod_grupo_ff: String(medicamento.codGrupoFF),
      ultima_compra: new Date().toISOString().split("T")[0],
      activo: true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true, action: "created", id: data.id });
};
