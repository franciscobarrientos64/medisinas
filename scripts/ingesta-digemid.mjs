#!/usr/bin/env node
/**
 * MediSinas · copia diaria de los precios de DIGEMID.
 *
 * Por qué existe: DIGEMID está detrás de Cloudflare y bloquea por ASN a los servidores de
 * Vercel y de Supabase (error 1005). Desde una conexión peruana doméstica sí responde. Por eso
 * la web no puede consultarlo en vivo: este script corre en la Mac de Francisco a las 6 a. m.,
 * baja los precios y los deja en Supabase, y la web lee de ahí.
 *
 * Qué se guarda y qué no (medido el 23/09/2026 contra el servicio real):
 *   Un solo producto puede tener 26,000 filas de precio en Lima. Copiarlo todo serían ~7
 *   millones de filas, imposible en el plan gratuito. Así que de cada distrito se guardan las
 *   TOPE_POR_DISTRITO farmacias más baratas —que es lo que la gente mira— y, aparte, en
 *   `precios_resumen` queda el conteo y los precios mínimo/máximo REALES de ese distrito, para
 *   que "comparado en N farmacias" no mienta.
 *
 * Uso:
 *   node scripts/ingesta-digemid.mjs                 # corrida completa (Lima + Callao)
 *   node scripts/ingesta-digemid.mjs --limite 10     # solo 10 medicinas, para probar
 *   node scripts/ingesta-digemid.mjs --desde 120     # retomar desde la medicina 120
 *   node scripts/ingesta-digemid.mjs --seco          # no escribe nada, solo mide
 *
 * Configuración en ~/medisinas/.env.ingesta (no se versiona):
 *   SUPABASE_URL=https://jmkvphayyhwzootlybde.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */
import { readFileSync, appendFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const DIGEMID = 'https://ms-opm.minsa.gob.pe/msopmcovid';
const CABECERAS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  // DIGEMID mira el origen; sin estas dos cabeceras rechaza la llamada.
  Origin: 'https://opm-digemid.minsa.gob.pe',
  Referer: 'https://opm-digemid.minsa.gob.pe/',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
};

// Se pide por departamento y se recorta por provincia con el ubigeo de cada fila: el filtro
// `codigoProvincia` del servicio devuelve 0 resultados (probado el 23/09/2026).
const ZONAS = [
  { nombre: 'Lima', dep: 15, prefijo: '1501' },
  { nombre: 'Callao', dep: 7, prefijo: '0701' },
];

const TOPE_POR_DISTRITO = 10;
const PAUSA_MS = 400; // el servicio ya tarda ~1 s por llamada; esto lo deja en ~2 por segundo.
const PAUSA_AUTOCOMPLETE_MS = 2500; // el autocomplete corta con 429 mucho antes que los precios.
const VARIANTES_POR_NOMBRE = 4;
const LOTE = 500;

// DIGEMID sugiere las variantes por concentración, no por lo que la gente compra: para
// "paracetamol" las primeras son suspensiones e inyectables y la tableta de 500 mg queda
// séptima. Sin este orden, lo más buscado del país se quedaba fuera de la copia.
const ORDEN_FORMA = ['Tableta - Capsula', 'Solucion - Suspension', 'Crema - Unguento - Gel'];
const rangoForma = (v) => {
  const i = ORDEN_FORMA.indexOf(v.nombreFormaFarmaceutica ?? '');
  return i >= 0 ? i : ORDEN_FORMA.length;
};

const args = process.argv.slice(2);
const opcion = (nombre, porDefecto = 0) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 ? Number(args[i + 1]) || porDefecto : porDefecto;
};
const SECO = args.includes('--seco');
const LIMITE = opcion('limite');
const DESDE = opcion('desde');
// Vuelve a preguntarle a DIGEMID las variantes de TODOS los nombres, no solo las de los que
// aún no tienen ninguna. Conviene correrlo de vez en cuando (una vez por semana basta) para
// recoger presentaciones nuevas.
const RECATALOGAR = args.includes('--recatalogar');

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...partes) => {
  const linea = `[${new Date().toISOString().slice(0, 19)}] ${partes.join(' ')}`;
  console.log(linea);
  try {
    appendFileSync(`${process.env.HOME}/Library/Logs/medisinas-ingesta.log`, linea + '\n');
  } catch {
    /* si no se puede escribir el log, la corrida sigue igual */
  }
};

function entorno() {
  let texto = '';
  try {
    texto = readFileSync(new URL('../.env.ingesta', import.meta.url), 'utf8');
  } catch {
    /* también valen las variables del sistema */
  }
  const env = { ...process.env };
  for (const linea of texto.split('\n')) {
    const m = linea.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

let llamadas = 0;
let errores = 0;

async function digemid(endpoint, filtro, intentos = 4) {
  for (let i = 0; i < intentos; i++) {
    try {
      llamadas++;
      const res = await fetch(`${DIGEMID}/${endpoint}`, {
        method: 'POST',
        headers: CABECERAS,
        body: JSON.stringify({ filtro }),
        signal: AbortSignal.timeout(90_000),
      });
      // El 429 no es un fallo pasajero cualquiera: DIGEMID nos cortó por ir muy rápido y
      // reintentar a los 3 segundos solo alarga el castigo. Hay que esperar de verdad.
      // En la primera corrida completa esto costó 130 de 280 medicinas: el autocomplete
      // devolvía 429 y la medicina quedaba registrada como "sin variantes".
      if (res.status === 429) throw Object.assign(new Error('429 (límite de tasa)'), { esperar: 45_000 * (i + 1) });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      if (data?.codigo !== '00') throw new Error(`codigo ${data?.codigo}`);
      return data.data ?? [];
    } catch (e) {
      if (i === intentos - 1) {
        errores++;
        log('  ⚠️', endpoint, String(e.message ?? e));
        return null;
      }
      await dormir(e.esperar ?? 1500 * (i + 1));
    }
  }
  return null;
}

/** Mismo criterio que la web (`precioDe` en src/v2/Resultados.jsx): manda el precio por unidad. */
const precioDe = (r) => Number(r.precio2) || Number(r.precio1) || Number(r.precio3) || 0;

/** Trae todas las filas de una tabla en páginas; PostgREST corta en 1000. */
async function traerTodo(sb, tabla, columnas, filtro = (q) => q) {
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await filtro(sb.from(tabla).select(columnas)).range(desde, desde + 999);
    if (error) throw new Error(`${tabla}: ${error.message}`);
    filas.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return filas;
}

async function main() {
  const env = entorno();
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'Falta la configuración. Crea ~/medisinas/.env.ingesta con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY\n' +
        '(la service_role está en Supabase → Project Settings → API).',
    );
    process.exit(1);
  }
  const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const inicio = new Date().toISOString();
  let corridaId = null;
  if (!SECO) {
    const { data } = await sb.from('ingesta_log').insert({ estado: 'corriendo' }).select('id').single();
    corridaId = data?.id;
  }
  const cuenta = { variantes: 0, farmaciasNuevas: 0, filas: 0, resumen: 0, vistas: 0, sinVariantes: 0 };

  try {
    // Nombres a copiar: las medicinas semilla de la tabla (las filas sin variante DIGEMID).
    const semillas = await traerTodo(sb, 'medicamentos', 'nombre', (q) => q.is('grupo', null).order('id'));
    let nombres = [...new Set(semillas.map((r) => r.nombre).filter(Boolean))];
    if (DESDE) nombres = nombres.slice(DESDE);
    if (LIMITE) nombres = nombres.slice(0, LIMITE);

    // Catálogo ya conocido: nombre semilla → variantes, con la forma que devuelve DIGEMID.
    const catalogo = new Map();
    if (!RECATALOGAR) {
      for (const m of await traerTodo(sb, 'medicamentos', 'nombre, concentracion, nombre_forma, grupo, cod_grupo_ff, buscado_como', (q) =>
        q.not('buscado_como', 'is', null),
      )) {
        if (!catalogo.has(m.buscado_como)) catalogo.set(m.buscado_como, []);
        catalogo.get(m.buscado_como).push({
          grupo: m.grupo,
          codGrupoFF: m.cod_grupo_ff,
          concent: m.concentracion ?? '',
          nombreProducto: m.nombre,
          nombreFormaFarmaceutica: m.nombre_forma,
        });
      }
    }

    // Mapa de farmacias conocidas (código → id) y las que ya se refrescaron en esta corrida.
    const farmacias = new Map();
    const refrescadas = new Set();
    for (const f of await traerTodo(sb, 'farmacias', 'id, codigo_establecimiento', (q) =>
      q.not('codigo_establecimiento', 'is', null),
    )) {
      farmacias.set(f.codigo_establecimiento, f.id);
    }
    log(
      `Copia DIGEMID · ${nombres.length} medicinas (${catalogo.size} con catálogo ya conocido) · ` +
        `${ZONAS.map((z) => z.nombre).join(' + ')} · ${farmacias.size} farmacias conocidas · ` +
        `tope ${TOPE_POR_DISTRITO} por distrito${RECATALOGAR ? ' · RECATALOGANDO' : ''}${SECO ? ' · MODO SECO' : ''}`,
    );

    for (const [i, nombre] of nombres.entries()) {
      // El catálogo de variantes se guarda y se reusa: el autocomplete de DIGEMID limita por
      // tasa mucho antes que el de precios, y las presentaciones de una medicina cambian muy
      // de vez en cuando. Solo se pregunta por los nombres que aún no tienen ninguna.
      const conocidas = catalogo.get(nombre) ?? [];
      let variantes;
      if (conocidas.length && !RECATALOGAR) {
        variantes = conocidas;
      } else {
        const sugerencias = (await digemid('producto/autocompleteciudadano', {
          nombreProducto: nombre,
          pagina: 1,
          tamanio: 20,
          tokenGoogle: '',
        })) ?? [];
        await dormir(PAUSA_AUTOCOMPLETE_MS);

        const vistas = new Set();
        const candidatas = [];
        for (const v of sugerencias) {
          const k = `${v.grupo}|${v.codGrupoFF}|${v.concent}`;
          if (v.grupo && !vistas.has(k)) {
            vistas.add(k);
            candidatas.push(v);
          }
        }
        // Orden estable: primero las formas que la gente compra, y dentro de cada una el
        // orden en que las dio DIGEMID.
        variantes = candidatas
          .map((v, orden) => ({ v, orden }))
          .sort((a, b) => rangoForma(a.v) - rangoForma(b.v) || a.orden - b.orden)
          .slice(0, VARIANTES_POR_NOMBRE)
          .map((x) => x.v);
        if (!variantes.length) cuenta.sinVariantes++;
      }
      log(`(${DESDE + i + 1}/${DESDE + nombres.length}) ${nombre} · ${variantes.length} variantes`);

      for (const v of variantes) {
        // Una fila de `medicamentos` = una variante exacta de DIGEMID (grupo + forma + concentración).
        let medicamentoId = null;
        if (!SECO) {
          const { data, error } = await sb
            .from('medicamentos')
            .upsert(
              {
                nombre: v.nombreProducto || nombre,
                concentracion: v.concent ?? '',
                grupo: String(v.grupo),
                cod_grupo_ff: String(v.codGrupoFF ?? ''),
                forma: v.nombreFormaFarmaceutica ?? null,
                nombre_forma: v.nombreFormaFarmaceutica ?? null,
                codigo_digemid: Number(v.grupo) || null,
                buscado_como: nombre,
                actualizado_at: new Date().toISOString(),
              },
              { onConflict: 'grupo,cod_grupo_ff,concentracion' },
            )
            .select('id')
            .single();
          if (error) {
            errores++;
            log('  ⚠️ medicamento', error.message);
            continue;
          }
          medicamentoId = data.id;
        }
        cuenta.variantes++;

        const aGuardar = [];
        const resumenes = [];
        let filasVistas = 0;

        for (const zona of ZONAS) {
          const crudas = await digemid('preciovista/ciudadano', {
            codigoProducto: v.grupo,
            codigoDepartamento: zona.dep,
            codigoProvincia: null,
            codigoUbigeo: null,
            codTipoEstablecimiento: null,
            catEstablecimiento: null,
            codGrupoFF: String(v.codGrupoFF),
            concent: v.concent,
            // El servicio ignora `tamanio` y devuelve todo de una: no hay que paginar.
            tamanio: 200,
            pagina: 1,
            tokenGoogle: 'token',
            nombreProducto: null,
          });
          await dormir(PAUSA_MS);
          if (!crudas?.length) {
            // Si no se vende en Lima, casi nunca se vende en Callao: no gastamos la llamada.
            if (zona.dep === 15) break;
            continue;
          }

          const filas = crudas.filter(
            (r) => String(r.ubicodigo ?? '').padStart(6, '0').startsWith(zona.prefijo) && precioDe(r) > 0 && r.codEstab,
          );
          filasVistas += filas.length;

          const porDistrito = new Map();
          for (const f of filas) {
            const u = String(f.ubicodigo).padStart(6, '0');
            if (!porDistrito.has(u)) porDistrito.set(u, []);
            porDistrito.get(u).push(f);
          }

          for (const [ubigeo, delDistrito] of porDistrito) {
            const precios = delDistrito.map(precioDe);
            resumenes.push({
              ubigeo,
              distrito: delDistrito[0].distrito ?? null,
              provincia: delDistrito[0].provincia ?? null,
              departamento: delDistrito[0].departamento ?? null,
              precio_min: Math.min(...precios),
              precio_max: Math.max(...precios),
              precio_promedio: Number((precios.reduce((a, b) => a + b, 0) / precios.length).toFixed(4)),
              n_farmacias: new Set(delDistrito.map((f) => f.codEstab)).size,
            });
            // Solo las más baratas del distrito: es lo que la gente compara.
            delDistrito.sort((a, b) => precioDe(a) - precioDe(b));
            aGuardar.push(...delDistrito.slice(0, TOPE_POR_DISTRITO));
          }
        }

        cuenta.vistas += filasVistas;
        if (SECO || !aGuardar.length) {
          if (SECO) {
            cuenta.filas += aGuardar.length;
            cuenta.resumen += resumenes.length;
          }
          continue;
        }

        // 1) Farmacias. Se refresca cada una una sola vez por corrida, aunque ya estuviera en
        //    la tabla: las 7,000 que venían de antes no tenían ubigeo ni `setcodigo`, y sin
        //    `setcodigo` la interfaz no sabe si una farmacia es pública ni si abre 24 horas.
        const nuevas = [
          ...new Map(aGuardar.filter((f) => !refrescadas.has(f.codEstab)).map((f) => [f.codEstab, f])).values(),
        ];
        for (let j = 0; j < nuevas.length; j += LOTE) {
          const { data, error } = await sb
            .from('farmacias')
            .upsert(
              nuevas.slice(j, j + LOTE).map((f) => ({
                codigo_establecimiento: f.codEstab,
                nombre: f.nombreComercial || 'Farmacia',
                direccion: f.direccion ?? null,
                telefono: f.telefono ?? null,
                distrito: f.distrito ?? null,
                provincia: f.provincia ?? null,
                departamento: f.departamento ?? null,
                ubigeo: String(f.ubicodigo).padStart(6, '0'),
                setcodigo: f.setcodigo != null ? String(f.setcodigo) : null,
                actualizado_at: new Date().toISOString(),
              })),
              { onConflict: 'codigo_establecimiento' },
            )
            .select('id, codigo_establecimiento');
          if (error) {
            errores++;
            log('  ⚠️ farmacias', error.message);
          } else {
            for (const f of data ?? []) {
              if (!farmacias.has(f.codigo_establecimiento)) cuenta.farmaciasNuevas++;
              farmacias.set(f.codigo_establecimiento, f.id);
              refrescadas.add(f.codigo_establecimiento);
            }
          }
        }

        // 2) Precios. Una farmacia aparece en un solo distrito, así que el par
        //    (medicamento, farmacia) no se repite; aun así se deduplica por seguridad.
        const ahora = new Date().toISOString();
        const precios = [
          ...new Map(
            aGuardar
              .filter((f) => farmacias.has(f.codEstab))
              .map((f) => [
                farmacias.get(f.codEstab),
                {
                  medicamento_id: medicamentoId,
                  farmacia_id: farmacias.get(f.codEstab),
                  precio: precioDe(f),
                  precio1: Number(f.precio1) || null,
                  precio2: Number(f.precio2) || null,
                  precio3: Number(f.precio3) || null,
                  ubigeo: String(f.ubicodigo).padStart(6, '0'),
                  distrito: f.distrito ?? null,
                  cat_codigo: f.catCodigo ?? null,
                  fracciones: Number(f.fracciones) || null,
                  producto: f.nombreProducto ?? null,
                  fecha_digemid: f.fecha ?? null,
                  fecha_actualizacion: ahora,
                },
              ]),
          ).values(),
        ];
        for (let j = 0; j < precios.length; j += LOTE) {
          const { error } = await sb
            .from('precios')
            .upsert(precios.slice(j, j + LOTE), { onConflict: 'medicamento_id,farmacia_id' });
          if (error) {
            errores++;
            log('  ⚠️ precios', error.message);
          }
        }
        cuenta.filas += precios.length;

        // 3) El principio activo solo viene en las filas de precio, no en el autocomplete.
        const sustancia = aGuardar.find((f) => f.nombreSustancia)?.nombreSustancia;
        if (sustancia) await sb.from('medicamentos').update({ sustancia }).eq('id', medicamentoId);

        // 4) Resumen real del distrito (conteo y extremos verdaderos, sin el tope).
        const resumenFilas = resumenes.map((r) => ({ ...r, medicamento_id: medicamentoId, actualizado_at: ahora }));
        for (let j = 0; j < resumenFilas.length; j += LOTE) {
          const { error } = await sb
            .from('precios_resumen')
            .upsert(resumenFilas.slice(j, j + LOTE), { onConflict: 'medicamento_id,ubigeo' });
          if (error) {
            errores++;
            log('  ⚠️ resumen', error.message);
          }
        }
        cuenta.resumen += resumenFilas.length;

        // 5) Lo que ya no vino en esta corrida dejó de venderse: se borra para no mostrar
        //    precios muertos.
        await sb.from('precios').delete().eq('medicamento_id', medicamentoId).lt('fecha_actualizacion', ahora);
        await sb.from('precios_resumen').delete().eq('medicamento_id', medicamentoId).lt('actualizado_at', ahora);
      }
    }

    const minutos = ((Date.now() - new Date(inicio)) / 60000).toFixed(1);
    log(
      `Listo en ${minutos} min · ${cuenta.variantes} variantes · ${cuenta.farmaciasNuevas} farmacias nuevas · ` +
        `${cuenta.filas} precios guardados de ${cuenta.vistas} vistos · ${cuenta.resumen} resúmenes · ` +
        `${llamadas} llamadas · ${errores} errores · ${cuenta.sinVariantes} nombres sin variantes`,
    );
    if (corridaId) {
      await sb
        .from('ingesta_log')
        .update({
          fin: new Date().toISOString(),
          estado: errores ? 'terminó con avisos' : 'ok',
          productos: cuenta.variantes,
          farmacias: cuenta.farmaciasNuevas,
          filas_precio: cuenta.filas,
          llamadas,
          errores,
        })
        .eq('id', corridaId);
    }
  } catch (e) {
    log('💥', String(e.stack ?? e.message ?? e));
    if (corridaId) {
      await sb
        .from('ingesta_log')
        .update({ fin: new Date().toISOString(), estado: 'falló', detalle: String(e.message ?? e), llamadas, errores })
        .eq('id', corridaId);
    }
    process.exit(1);
  }
}

main();
