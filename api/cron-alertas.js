const { createClient } = require("@supabase/supabase-js");

function buildEmail({ nombre, nombreProducto, concent, precioMinimo, precioObjetivo, farmacia, direccion, distrito, fecha }) {
  const ahorro = (parseFloat(precioObjetivo) - precioMinimo).toFixed(2);
  const pct = Math.round((1 - precioMinimo / parseFloat(precioObjetivo)) * 100);
  const fechaStr = new Date().toLocaleDateString('es-PE', { weekday:'long', day:'numeric', month:'long' });
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
<tr><td style="background:linear-gradient(135deg,#0B2D5E,#0A7B5E);padding:28px 32px">
  <div style="color:#fff;font-size:22px;font-weight:800">Medi<span style="color:#4ADE80">Si</span>nas</div>
  <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px">Alerta de precio activada</div>
</td></tr>
<tr><td style="padding:28px 32px">
  <div style="font-size:15px;color:#374151;margin-bottom:20px">Hola <strong>${nombre || 'amigo'}</strong>, encontramos el precio que buscabas:</div>
  <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:20px 24px;margin-bottom:20px">
    <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:4px">💊 ${nombreProducto} ${concent}</div>
    <div style="font-size:28px;font-weight:800;color:#0A7B5E;margin:8px 0">S/ ${precioMinimo.toFixed(2)}</div>
    <div style="font-size:13px;color:#6B7280">Tu objetivo era <strong>S/ ${parseFloat(precioObjetivo).toFixed(2)}</strong> · Ahorras <strong style="color:#0A7B5E">S/ ${ahorro} (${pct}% menos)</strong></div>
  </div>
  <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px 20px;margin-bottom:24px">
    <div style="font-weight:700;font-size:15px;color:#111827;margin-bottom:6px">📍 ${farmacia}</div>
    <div style="font-size:13px;color:#6B7280;line-height:1.6">${direccion}${distrito ? ', ' + distrito : ''}<br>🗓 ${fecha || fechaStr}</div>
  </div>
  <div style="text-align:center;margin-bottom:24px">
    <a href="https://medisinas.com" style="display:inline-block;background:#0A7B5E;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px">Ver más farmacias con este precio →</a>
  </div>
  <div style="font-size:12px;color:#9CA3AF;text-align:center;line-height:1.6">Datos oficiales DIGEMID · Actualización diaria</div>
</td></tr>
<tr><td style="background:#F9FAFB;padding:16px 32px;border-top:1px solid #E5E7EB">
  <div style="font-size:11px;color:#9CA3AF;text-align:center">MediSinas · medisinas.com · ${fechaStr}</div>
</td></tr>
</table></td></tr></table></body></html>`;
}

module.exports = async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const hoy = new Date().toISOString().split("T")[0];
  const { data: alertas, error } = await supabase
    .from("alertas_precio")
    .select("*, usuarios(nombre, telefono, email)")
    .eq("activa", true)
    .or(`ultima_notificacion.is.null,ultima_notificacion.lt.${hoy}T00:00:00Z`);

  if (error || !alertas?.length) return res.json({ ok: true, mensaje: "Sin alertas", total: 0 });

  let notificadas = 0;
  const errores = [];

  for (const alerta of alertas) {
    try {
      const email = alerta.usuarios?.email;
      if (!email) continue;

      const digemidRes = await fetch("https://ms-opm.minsa.gob.pe/msopmcovid/preciovista/ciudadano", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": "https://opm-digemid.minsa.gob.pe", "Referer": "https://opm-digemid.minsa.gob.pe/" },
        body: JSON.stringify({ filtro: { codigoProducto: alerta.grupo, codigoDepartamento: 15, codigoProvincia: 1501, codigoUbigeo: null, codTipoEstablecimiento: null, catEstablecimiento: null, codGrupoFF: alerta.cod_grupo_ff, concent: alerta.concent, tamanio: 10, pagina: 1, tokenGoogle: "token", nombreProducto: null } }),
      });
      const digemidData = await digemidRes.json();
      if (digemidData?.codigo !== "00" || !digemidData?.data?.length) continue;

      const precios = digemidData.data.map(r => r.precio2 || r.precio1 || r.precio3).filter(p => p > 0);
      if (!precios.length) continue;
      const precioMinimo = Math.min(...precios);
      if (precioMinimo > parseFloat(alerta.precio_objetivo)) continue;

      const mejor = digemidData.data.find(r => (r.precio2 || r.precio1 || r.precio3) === precioMinimo);

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: "MediSinas <alertas@medisinas.com>",
          to: [email],
          subject: `🔔 ${alerta.nombre_producto} ${alerta.concent} bajó a S/ ${precioMinimo.toFixed(2)}`,
          html: buildEmail({ nombre: alerta.usuarios?.nombre, nombreProducto: alerta.nombre_producto, concent: alerta.concent, precioMinimo, precioObjetivo: alerta.precio_objetivo, farmacia: mejor?.nombreComercial || '', direccion: mejor?.direccion || '', distrito: mejor?.distrito || alerta.distrito || '', fecha: mejor?.fecha?.split(' ')[0] || null }),
        }),
      });

      if (!emailRes.ok) { const e = await emailRes.json(); errores.push({ alerta_id: alerta.id, error: e.message }); continue; }

      await supabase.from("alertas_precio").update({ ultima_notificacion: new Date().toISOString() }).eq("id", alerta.id);
      notificadas++;
    } catch (e) {
      errores.push({ alerta_id: alerta.id, error: e.message });
    }
  }
  return res.json({ ok: true, total_alertas: alertas.length, notificadas, errores });
};
