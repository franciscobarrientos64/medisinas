const twilio = require("twilio");
const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: "Número inválido" });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error: dbError } = await supabase
    .from("otp_codes")
    .upsert({ phone, code, expires_at }, { onConflict: "phone" });

  if (dbError) {
    console.error("DB error:", dbError);
    return res.status(500).json({ error: "Error interno. Intenta de nuevo." });
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  try {
    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${phone}`,
      body: `Tu código MediSinas es: *${code}*\n\nVálido por 5 minutos. No lo compartas con nadie.`,
    });
    return res.json({ success: true, channel: "whatsapp" });
  } catch (err) {
    console.error("Twilio error:", err.message);
    return res.status(500).json({ error: "No pudimos enviar el código. Verifica el número." });
  }
};
