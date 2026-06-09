const { createClient } = require("@supabase/supabase-js");

// Endpoint consolidado para las features nuevas (personas, ahorros, historial, alertas).
// Se enruta por ?action=... para no superar el límite de Serverless Functions del plan.
module.exports = async function handler(req, res) {
  const action = (req.query && req.query.action) || (req.body && req.body.action);
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const round2 = (n) => Math.round(n * 100) / 100;

  try {
    switch (action) {
      // ───────── PERSONAS ─────────
      case "get-personas": {
        if (req.method !== "GET") return res.status(405).end();
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId requerido" });
        let { data: personas, error } = await supabase
          .from("personas").select("*").eq("usuario_id", userId).eq("activo", true)
          .order("es_titular", { ascending: false }).order("created_at", { ascending: true });
        if (error) return res.status(500).json({ error: error.message });
        if (!personas || personas.length === 0) {
          const { data: u } = await supabase.from("usuarios").select("nombre, genero, anio_nacimiento, condiciones").eq("id", userId).single();
          const { data: titular, error: insErr } = await supabase.from("personas").insert({
            usuario_id: userId, nombre: u && u.nombre ? u.nombre : "Yo", parentesco: "yo",
            genero: (u && u.genero) || null, anio_nacimiento: (u && u.anio_nacimiento) || null,
            condiciones: (u && u.condiciones) || [], es_titular: true,
          }).select().single();
          if (insErr) return res.status(500).json({ error: insErr.message });
          personas = [titular];
        }
        return res.json({ personas });
      }

      case "save-persona": {
        if (req.method !== "POST") return res.status(405).end();
        const { userId, id, nombre, parentesco, genero, anio_nacimiento, condiciones, alergias, color } = req.body;
        if (!userId || !nombre) return res.status(400).json({ error: "Faltan datos" });
        const fields = {
          nombre, parentesco: parentesco || null, genero: genero || null,
          anio_nacimiento: anio_nacimiento || null, condiciones: condiciones || [],
          alergias: alergias || [], color: color || null,
        };
        if (id) {
          const { data, error } = await supabase.from("personas").update(fields).eq("id", id).eq("usuario_id", userId).select().single();
          if (error) return res.status(500).json({ error: error.message });
          return res.json({ success: true, action: "updated", persona: data });
        }
        const { data, error } = await supabase.from("personas").insert({ usuario_id: userId, ...fields }).select().single();
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true, action: "created", persona: data });
      }

      case "delete-persona": {
        if (req.method !== "POST") return res.status(405).end();
        const { userId, personaId } = req.body;
        if (!userId || !personaId) return res.status(400).json({ error: "Faltan datos" });
        const { data: p } = await supabase.from("personas").select("es_titular").eq("id", personaId).eq("usuario_id", userId).single();
        if (!p) return res.status(404).json({ error: "Persona no encontrada" });
        if (p.es_titular) return res.status(400).json({ error: "No puedes eliminar al titular de la cuenta." });
        const { error } = await supabase.from("personas").update({ activo: false }).eq("id", personaId).eq("usuario_id", userId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      // ───────── AHORROS + HISTORIAL ─────────
      case "registrar-busqueda": {
        if (req.method !== "POST") return res.status(405).end();
        const { userId, persona_id, medicamento, distrito, precios } = req.body;
        if (!userId || !medicamento) return res.status(400).json({ error: "Faltan datos" });
        const lista = (Array.isArray(precios) ? precios : []).map(Number).filter((n) => !isNaN(n) && n > 0);
        if (lista.length < 2) return res.json({ success: true, registrado: false, ahorro_potencial: 0 });
        const precio_min = Math.min(...lista);
        const precio_max = Math.max(...lista);
        const num_farmacias = lista.length;
        const precio_promedio = round2(lista.reduce((a, b) => a + b, 0) / num_farmacias);
        const ahorro_potencial = round2(precio_max - precio_min);
        const prod = {
          nombre_producto: medicamento.nombreProducto || medicamento.nombre_producto || null,
          concent: medicamento.concent || null,
          grupo: medicamento.grupo || null,
          cod_grupo_ff: medicamento.codGrupoFF != null ? String(medicamento.codGrupoFF) : medicamento.cod_grupo_ff || null,
        };
        const dist = distrito || null;
        const { data: ahorro, error: aErr } = await supabase.from("ahorros").insert({
          usuario_id: userId, persona_id: persona_id || null, ...prod, distrito: dist,
          precio_min, precio_max, num_farmacias, ahorro_potencial,
        }).select().single();
        if (aErr) return res.status(500).json({ error: aErr.message });
        if (prod.grupo && prod.cod_grupo_ff && dist) {
          const cc = prod.concent || "";
          const hoy = new Date().toISOString().split("T")[0];
          const { data: existing } = await supabase.from("historial_precios").select("id")
            .eq("grupo", prod.grupo).eq("cod_grupo_ff", prod.cod_grupo_ff).eq("concent", cc).eq("distrito", dist).eq("fecha", hoy).maybeSingle();
          if (existing) {
            await supabase.from("historial_precios").update({ precio_min, precio_max, precio_promedio, num_farmacias }).eq("id", existing.id);
          } else {
            await supabase.from("historial_precios").insert({ nombre_producto: prod.nombre_producto, concent: cc, grupo: prod.grupo, cod_grupo_ff: prod.cod_grupo_ff, distrito: dist, fecha: hoy, precio_min, precio_max, precio_promedio, num_farmacias });
          }
        }
        return res.json({ success: true, registrado: true, ahorro_id: ahorro.id, precio_min, precio_max, ahorro_potencial });
      }

      case "get-ahorros": {
        if (req.method !== "GET") return res.status(405).end();
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId requerido" });
        const { data, error } = await supabase.from("ahorros").select("persona_id, ahorro_potencial, ahorro_real, comprado, created_at").eq("usuario_id", userId);
        if (error) return res.status(500).json({ error: error.message });
        const rows = data || [];
        const sum = (arr, f) => round2(arr.reduce((a, r) => a + (Number(r[f]) || 0), 0));
        const now = new Date();
        const delMes = rows.filter((r) => { const d = new Date(r.created_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
        const comprados = rows.filter((r) => r.comprado);
        const por_persona = {};
        for (const r of comprados) { const k = r.persona_id || "sin_persona"; por_persona[k] = round2((por_persona[k] || 0) + (Number(r.ahorro_real) || 0)); }
        return res.json({
          ahorro_real_total: sum(comprados, "ahorro_real"),
          ahorro_potencial_total: sum(rows, "ahorro_potencial"),
          ahorro_real_mes: sum(delMes.filter((r) => r.comprado), "ahorro_real"),
          ahorro_potencial_mes: sum(delMes, "ahorro_potencial"),
          num_busquedas: rows.length, num_compras: comprados.length, por_persona,
        });
      }

      case "confirmar-compra": {
        if (req.method !== "POST") return res.status(405).end();
        const { userId, ahorroId, precio_pagado } = req.body;
        if (!userId || !ahorroId || precio_pagado == null) return res.status(400).json({ error: "Faltan datos" });
        const { data: a } = await supabase.from("ahorros").select("precio_max").eq("id", ahorroId).eq("usuario_id", userId).single();
        if (!a) return res.status(404).json({ error: "Registro no encontrado" });
        const pagado = Number(precio_pagado);
        const ahorro_real = Math.max(0, round2((Number(a.precio_max) || pagado) - pagado));
        const { error } = await supabase.from("ahorros").update({ comprado: true, precio_pagado: pagado, ahorro_real }).eq("id", ahorroId).eq("usuario_id", userId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true, ahorro_real });
      }

      case "historial-precios": {
        if (req.method !== "GET") return res.status(405).end();
        const { grupo, cod_grupo_ff, concent, distrito, dias } = req.query;
        if (!grupo || !cod_grupo_ff) return res.status(400).json({ error: "Faltan datos del producto" });
        const desde = new Date();
        desde.setDate(desde.getDate() - (parseInt(dias, 10) || 90));
        let q = supabase.from("historial_precios").select("fecha, precio_min, precio_max, precio_promedio, num_farmacias")
          .eq("grupo", grupo).eq("cod_grupo_ff", String(cod_grupo_ff)).gte("fecha", desde.toISOString().split("T")[0]).order("fecha", { ascending: true });
        if (concent != null) q = q.eq("concent", concent);
        if (distrito) q = q.eq("distrito", distrito);
        const { data, error } = await q;
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ historial: data || [] });
      }

      // ───────── ALERTAS ─────────
      case "get-alertas": {
        if (req.method !== "GET") return res.status(405).end();
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId requerido" });
        const { data, error } = await supabase.from("alertas_precio").select("*").eq("usuario_id", userId).eq("activa", true).order("created_at", { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ alertas: data || [] });
      }

      case "delete-alerta": {
        if (req.method !== "POST") return res.status(405).end();
        const { userId, alertaId } = req.body;
        if (!userId || !alertaId) return res.status(400).json({ error: "Faltan datos" });
        const { error } = await supabase.from("alertas_precio").update({ activa: false }).eq("id", alertaId).eq("usuario_id", userId);
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: "acción inválida: " + action });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
