const { createClient } = require("@supabase/supabase-js");

// Devuelve la evolucion de precios de un producto (opcionalmente por distrito)
// para graficar la tendencia. Por defecto, ultimos 90 dias.
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { grupo, cod_grupo_ff, concent, distrito, dias } = req.query;
  if (!grupo || !cod_grupo_ff)
    return res.status(400).json({ error: "Faltan datos del producto" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const desde = new Date();
  desde.setDate(desde.getDate() - (parseInt(dias, 10) || 90));
  const desdeStr = desde.toISOString().split("T")[0];

  let q = supabase
    .from("historial_precios")
    .select("fecha, precio_min, precio_max, precio_promedio, num_farmacias")
    .eq("grupo", grupo)
    .eq("cod_grupo_ff", String(cod_grupo_ff))
    .gte("fecha", desdeStr)
    .order("fecha", { ascending: true });

  if (concent != null) q = q.eq("concent", concent);
  if (distrito) q = q.eq("distrito", distrito);

  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ historial: data || [] });
};
