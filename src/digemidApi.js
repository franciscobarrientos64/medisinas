// MediSinas · de dónde salen los precios.
//
// Hasta el 23/09/2026 esto llamaba a DIGEMID en vivo a través de /api/digemid. Ya no se puede:
// DIGEMID está detrás de Cloudflare y bloquea por ASN los rangos de Vercel y de Supabase
// (error 1005), así que en producción toda búsqueda volvía vacía aunque desde una conexión
// peruana doméstica el servicio responda bien.
//
// Ahora la web lee una copia en Supabase que se refresca cada día a las 6 a. m. desde la Mac
// (scripts/ingesta-digemid.mjs). El proxy api/digemid.js sigue en el repo por si algún día
// dejan de bloquear, pero no está en el camino crítico.
//
// Las funciones mantienen su firma y la forma de lo que devuelven —los mismos nombres de campo
// que usa DIGEMID— para que Buscador, Resultados, Detalle y App no tengan que cambiar.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// La copia diaria cubre Lima y Callao. Fuera de ahí todavía no hay datos y conviene decirlo,
// en vez de mostrar "sin resultados", que se lee como que la medicina no existe.
export const DEPARTAMENTOS_CUBIERTOS = [15, 7];

export const DISTRITOS_LIMA = {
  "Todos Lima": { dep: null, prov: null, ubigeo: null },
  Miraflores: { dep: 15, prov: 1501, ubigeo: 150122 },
  "San Isidro": { dep: 15, prov: 1501, ubigeo: 150131 },
  "San Borja": { dep: 15, prov: 1501, ubigeo: 150130 },
};

const normUbigeo = (u) => (u == null || u === "" ? null : String(u).padStart(6, "0"));

/** Sugerencias del buscador: las variantes exactas que tenemos copiadas. */
export async function buscarVariantes(nombre) {
  const q = (nombre || "").trim();
  if (q.length < 2) return [];
  const { data, error } = await sb
    .from("medicamentos")
    .select("nombre, sustancia, concentracion, forma, nombre_forma, grupo, cod_grupo_ff")
    .not("grupo", "is", null)
    .ilike("nombre", `%${q}%`)
    .limit(60);
  if (error || !data) return [];

  const term = q.toLowerCase();
  return data
    // Primero los que empiezan con lo que la persona escribió; después el resto.
    .sort((a, b) => {
      const ap = a.nombre.toLowerCase().startsWith(term) ? 0 : 1;
      const bp = b.nombre.toLowerCase().startsWith(term) ? 0 : 1;
      return ap - bp || a.nombre.localeCompare(b.nombre) || (a.concentracion || "").localeCompare(b.concentracion || "");
    })
    .slice(0, 20)
    .map((m) => ({
      nombreProducto: m.nombre,
      nombreSustancia: m.sustancia || m.nombre,
      concent: m.concentracion || "",
      nombreFormaFarmaceutica: m.nombre_forma || m.forma || "",
      nomGrupoFF: m.nombre_forma || m.forma || "",
      grupo: m.grupo,
      codGrupoFF: m.cod_grupo_ff,
    }));
}

const _cache = {};

/**
 * Precios de una variante en una zona.
 *
 * `registros` trae las farmacias más baratas de cada distrito (la copia no guarda las ~26,000
 * filas que DIGEMID publica por producto) y `cantidad` es el total REAL de farmacias que lo
 * venden en esa zona, que sale de la tabla de resumen. Por eso `cantidad` suele ser mucho mayor
 * que `registros.length`: una cosa es cuántas lo venden y otra cuántas mostramos.
 */
export async function consultarPrecios(grupo, codGrupoFF, concent, ubigeo, depCod, provCod, pagina = 1, tamanio = 50) {
  const ubi = normUbigeo(ubigeo);
  const clave = `${grupo}|${codGrupoFF}|${concent}|${ubi}|${depCod}|${tamanio}`;
  const guardado = _cache[clave];
  if (guardado && Date.now() - guardado.ts < 300000) return guardado.data; // 5 min

  const vacio = (extra) => ({ registros: [], cantidad: 0, error: false, ...extra });

  // Zona sin copia todavía (cualquier región que no sea Lima o Callao).
  if (depCod != null && !DEPARTAMENTOS_CUBIERTOS.includes(Number(depCod))) {
    return vacio({ sinCobertura: true });
  }

  try {
    const { data: med, error: errMed } = await sb
      .from("medicamentos")
      .select("id, nombre, sustancia, concentracion, nombre_forma, forma")
      .eq("grupo", String(grupo))
      .eq("cod_grupo_ff", String(codGrupoFF))
      .eq("concentracion", concent ?? "")
      .maybeSingle();
    if (errMed) return { registros: [], cantidad: 0, error: true };
    if (!med) return vacio();

    let consulta = sb
      .from("precios")
      .select(
        `precio, precio1, precio2, precio3, ubigeo, distrito, cat_codigo, fracciones, producto, fecha_digemid,
         farmacias!inner ( codigo_establecimiento, nombre, direccion, telefono, distrito, provincia, departamento, setcodigo, latitud, longitud )`
      )
      .eq("medicamento_id", med.id)
      .order("precio", { ascending: true })
      .limit(Math.max(tamanio, 50));
    if (ubi) consulta = consulta.eq("ubigeo", ubi);

    let resumen = sb
      .from("precios_resumen")
      .select("n_farmacias, precio_min, precio_max")
      .eq("medicamento_id", med.id);
    if (ubi) resumen = resumen.eq("ubigeo", ubi);

    const [{ data: filas, error }, { data: resumenFilas }] = await Promise.all([consulta, resumen]);
    if (error) return { registros: [], cantidad: 0, error: true };

    const registros = (filas || []).map((p) => {
      const f = p.farmacias || {};
      return {
        codEstab: f.codigo_establecimiento,
        nombreComercial: f.nombre,
        direccion: f.direccion,
        telefono: f.telefono,
        distrito: p.distrito || f.distrito,
        provincia: f.provincia,
        departamento: f.departamento,
        ubicodigo: p.ubigeo,
        setcodigo: f.setcodigo,
        geolocation: f.latitud != null && f.longitud != null ? `${f.latitud},${f.longitud}` : null,
        precio1: p.precio1,
        precio2: p.precio2,
        precio3: p.precio3,
        catCodigo: p.cat_codigo,
        fracciones: p.fracciones,
        nombreProducto: p.producto || med.nombre,
        nombreSustancia: med.sustancia || med.nombre,
        concent: med.concentracion,
        nombreFormaFarmaceutica: med.nombre_forma || med.forma || "",
        nomGrupoFF: med.nombre_forma || med.forma || "",
        grupo: String(grupo),
        codGrupoFF: String(codGrupoFF),
        fecha: p.fecha_digemid,
      };
    });

    // Mínimo y máximo verdaderos de la zona: los de `registros` saldrían sesgados hacia abajo
    // porque solo guardamos las farmacias más baratas de cada distrito.
    const rs = resumenFilas || [];
    const cantidad = rs.reduce((t, r) => t + (r.n_farmacias || 0), 0) || registros.length;
    const minimos = rs.map((r) => Number(r.precio_min)).filter((n) => n > 0);
    const maximos = rs.map((r) => Number(r.precio_max)).filter((n) => n > 0);
    const resultado = {
      registros,
      cantidad,
      error: false,
      precioMin: minimos.length ? Math.min(...minimos) : null,
      precioMax: maximos.length ? Math.max(...maximos) : null,
    };
    if (registros.length) _cache[clave] = { data: resultado, ts: Date.now() };
    return resultado;
  } catch {
    return { registros: [], cantidad: 0, error: true };
  }
}

/** Fecha de la última copia terminada, para mostrar "Precios actualizados al …". */
export async function ultimaCopia() {
  const { data } = await sb
    .from("ingesta_log")
    .select("fin, estado")
    .not("fin", "is", null)
    .in("estado", ["ok", "terminó con avisos"])
    .order("fin", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.fin ? new Date(data.fin) : null;
}
