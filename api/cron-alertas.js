const { createClient } = require("@supabase/supabase-js");
const twilio = require("twilio");

// Llamado por Vercel Cron: 0 13 * * * (8am Lima = 1pm UTC)
module.exports = async function handler(req, res) {
  // Verificar que sea llamada legítima del cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  // 1. Obtener alertas activas no notificadas hoy
  const hoy = new Date().toISOString().split("T")[0];
  const { data: alertas, error } = await supabase
    .from("alertas_precio")
    .select("*, usuarios(nombre, telefono)")
    .eq("activa", true)
    .or(`ultima_notificacion.is.null,ultima_notificacion.lt.${hoy}T00:00:00Z`);

  if (error || !alertas?.length) {
    return res.json({ ok: true, mensaje: "Sin alertas que procesar", total: 0 });
  }

  let notificadas = 0;
  const errores = [];

  for (const alerta of alertas) {
    try {
      // 2. Consultar precio actual en DIGEMID
      const body = {
        filtro: {
          codigoProducto: alerta.grupo,
          codigoDepartamento: 15, // Lima por defecto
          codigoProvincia: 1501,
          codigoUbigeo: null,
          codTipoEstablecimiento: null,
          catEstablecimiento: null,
          codGrupoFF: alerta.cod_grupo_ff,
          concent: alerta.concent,
          tamanio: 10,
          pagina: 1,
          tokenGoogle: "token",
          nombreProducto: null,
        }
      };

      const digemidRes = await fetch("https://ms-opm.minsa.gob.pe/msopmcovid/preciovista/ciudadano", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Origin": "https://opm-digemid.minsa.gob.pe",
          "Referer": "https://opm-digemid.minsa.gob.pe/",
        },
        body: JSON.stringify(body),
      });

      const digemidData = await digemidRes.json();
      if (digemidData?.codigo !== "00" || !digemidData?.data?.length) continue;

      // 3. Encontrar el precio mínimo actual
      const precios = digemidData.data
        .map(r => r.precio2 || r.precio1 || r.precio3)
        .filter(p => p && p > 0);

      if (!precios.length) continue;
      const precioMinimo = Math.min(...precios);

      // 4. ¿Está por debajo del objetivo?
      if (precioMinimo > parseFloat(alerta.precio_objetivo)) continue;

      // 5. Encontrar la farmacia con ese precio
      const mejor = digemidData.data.find(r =>
        (r.precio2 || r.precio1 || r.precio3) === precioMinimo
      );

      // 6. Enviar WhatsApp
      const nombre = alerta.usuarios?.nombre || "Hola";
      const telefono = alerta.usuarios?.telefono;
      if (!telefono) continue;

      const mensaje =
        `🔔 *Alerta MediSinas*\n\n` +
        `¡${nombre}, encontramos el precio que buscabas!\n\n` +
        `💊 *${alerta.nombre_producto} ${alerta.concent}*\n` +
        `📍 *${mejor.nombreComercial}*\n` +
        `${mejor.direccion}${mejor.distrito ? ", " + mejor.distrito : ""}\n\n` +
        `💰 *S/ ${precioMinimo.toFixed(2)}* ← tu objetivo era S/ ${parseFloat(alerta.precio_objetivo).toFixed(2)}\n\n` +
        `Ver más opciones: https://medisinas.com\n\n` +
        `_Responde STOP para cancelar esta alerta_`;

      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
        to: `whatsapp:${telefono}`,
        body: mensaje,
      });

      // 7. Actualizar ultima_notificacion
      await supabase
        .from("alertas_precio")
        .update({ ultima_notificacion: new Date().toISOString() })
        .eq("id", alerta.id);

      notificadas++;
    } catch (e) {
      errores.push({ alerta_id: alerta.id, error: e.message });
    }
  }

  return res.json({
    ok: true,
    total_alertas: alertas.length,
    notificadas,
    errores,
  });
};
