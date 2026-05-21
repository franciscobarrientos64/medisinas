const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: "Faltan datos" });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // 1. Verificar código
  const { data: otpData, error: otpError } = await supabase
    .from("otp_codes")
    .select()
    .eq("phone", phone)
    .eq("code", code)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (otpError || !otpData) {
    return res.status(400).json({ error: "Código incorrecto o expirado." });
  }

  // 2. Eliminar código usado
  await supabase.from("otp_codes").delete().eq("phone", phone);

  // 3. Upsert usuario
  const { data: user, error: userError } = await supabase
    .from("usuarios")
    .upsert({ telefono: phone }, { onConflict: "telefono" })
    .select()
    .single();

  if (userError) {
    console.error("User upsert error:", userError);
    return res.status(500).json({ error: "Error al crear usuario." });
  }

  return res.json({ success: true, user });
};
