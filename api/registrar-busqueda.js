const { createClient } = require("@supabase/supabase-js");

// Se llama despues de cada busqueda con resultados.
// 1. Registra el ahorro potencial del usuario (mas caro - mas barato de la zona).
// 2. Alimenta el historial de precios (un snapshot por producto + distrito + dia).
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, persona_id, medicamento, distrito, precios } = req.body;
  if (!userId || !medicamento) return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Normalizar lista de precios validos
  const lista = (Array.isArray(precios) ? precios : [])
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);

  // Necesitamos al menos 2 precios para que exista un "ahorro"
  if (lista.length < 2) {
    return res.json({ success: true, registrado: false, ahorro_potencial: 0 });
  }

  const round2 = (n) => Math.round(n * 100) / 100;
  const precio_min = Math.min(...lista);
  const precio_max = Math.max(...lista);
  const num_farmacias = lista.length;
  const precio_promedio = round2(lista.reduce((a, b) => a + b, 0) / num_farmacias);
  const ahorro_potencial = round2(precio_max - precio_min);

  const prod = {
    nombre_producto: medicamento.nombreProducto || medicamento.nombre_producto || null,
    concent: medicamento.concent || null,
    grupo: medicamento.grupo || null,
    cod_grupo_ff:
      medicamento.codGrupoFF != null
        ? String(medicamento.codGrupoFF)
        : medicamento.cod_grupo_ff || null,
  };
  const dist = distrito || null;

  // 1. Evento de ahorro del usuario
  const { data: ahorro, error: aErr } = await supabase
    .from("ahorros")
    .insert({
      usuario_id: userId,
      persona_id: persona_id || null,
      ...prod,
      distrito: dist,
      precio_min,
      precio_max,
      num_farmacias,
      ahorro_potencial,
    })
    .select()
    .single();

  if (aErr) return res.status(500).json({ error: aErr.message });

  // 2. Snapshot diario en historial_precios (upsert manual por producto + distrito + dia)
  if (prod.grupo && prod.cod_grupo_ff && dist) {
    const cc = prod.concent || "";
    const hoy = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("historial_precios")
      .select("id")
      .eq("grupo", prod.grupo)
      .eq("cod_grupo_ff", prod.cod_grupo_ff)
      .eq("concent", cc)
      .eq("distrito", dist)
      .eq("fecha", hoy)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("historial_precios")
        .update({ precio_min, precio_max, precio_promedio, num_farmacias })
        .eq("id", existing.id);
    } else {
      await supabase.from("historial_precios").insert({
        nombre_producto: prod.nombre_producto,
        concent: cc,
        grupo: prod.grupo,
        cod_grupo_ff: prod.cod_grupo_ff,
        distrito: dist,
        fecha: hoy,
        precio_min,
        precio_max,
        precio_promedio,
        num_farmacias,
      });
    }
  }

  return res.json({
    success: true,
    registrado: true,
    ahorro_id: ahorro.id,
    precio_min,
    precio_max,
    ahorro_potencial,
  });
};
