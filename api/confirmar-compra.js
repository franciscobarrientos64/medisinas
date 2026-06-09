const { createClient } = require("@supabase/supabase-js");

// Convierte un ahorro potencial en ahorro REAL cuando el usuario confirma
// donde compro y a que precio. ahorro_real = precio mas caro de la zona - precio pagado.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, ahorroId, precio_pagado } = req.body;
  if (!userId || !ahorroId || precio_pagado == null)
    return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data: a } = await supabase
    .from("ahorros")
    .select("precio_max")
    .eq("id", ahorroId)
    .eq("usuario_id", userId)
    .single();

  if (!a) return res.status(404).json({ error: "Registro no encontrado" });

  const pagado = Number(precio_pagado);
  const referencia = Number(a.precio_max) || pagado;
  const ahorro_real = Math.max(0, Math.round((referencia - pagado) * 100) / 100);

  const { error } = await supabase
    .from("ahorros")
    .update({ comprado: true, precio_pagado: pagado, ahorro_real })
    .eq("id", ahorroId)
    .eq("usuario_id", userId);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true, ahorro_real });
};
