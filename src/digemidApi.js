const PROXY = '/api/digemid';
async function callProxy(endpoint, body) {
  try {
    const res = await fetch(PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, body }),
    });
    return await res.json();
  } catch (e) {
    return null;
  }
}
export const DISTRITOS_LIMA = {
  'Todos Lima': { dep: null, prov: null, ubigeo: null },
  'Miraflores': { dep: 15, prov: 1501, ubigeo: 150122 },
  'San Isidro': { dep: 15, prov: 1501, ubigeo: 150131 },
  'San Borja': { dep: 15, prov: 1501, ubigeo: 150130 },
};
export async function buscarVariantes(nombre) {
  const data = await callProxy('producto/autocompleteciudadano', {
    filtro: { nombreProducto: nombre, pagina: 1, tamanio: 20, tokenGoogle: '' }
  });
  if (data?.codigo === '00') return data.data || [];
  return [];
}
const _precioCache = {};
export async function consultarPrecios(grupo, codGrupoFF, concent, ubigeo, depCod, provCod, pagina = 1, tamanio = 50) {
  const cacheKey = `${grupo}|${codGrupoFF}|${concent}|${ubigeo}|${depCod}|${provCod}|${pagina}`;
  const cached = _precioCache[cacheKey];
  if (cached && Date.now() - cached.ts < 300000) return cached.data; // 5 min
  const filtro = {
    codigoProducto: grupo,
    codigoDepartamento: depCod || null,
    codigoProvincia: provCod || null,
    codigoUbigeo: ubigeo || null,
    codTipoEstablecimiento: null,
    catEstablecimiento: null,
    codGrupoFF: String(codGrupoFF),
    concent: concent,
    tamanio: tamanio,
    pagina: pagina,
    tokenGoogle: 'token',
    nombreProducto: null,
  };
  // El proxy ya reintenta internamente; aquí una sola llamada para no multiplicar la espera.
  const data = await callProxy('preciovista/ciudadano', { filtro });
  if (data?.codigo === '00') {
    const result = { registros: data.data || [], cantidad: data.cantidad || 0, error: false };
    if (result.registros.length) _precioCache[cacheKey] = { data: result, ts: Date.now() };
    return result;
  }
  // Sin codigo '00': el proxy falló (timeout/502) o DIGEMID no respondió bien → no es "sin resultados".
  const servicioCaido = !data || !!data.error;
  return { registros: [], cantidad: 0, error: servicioCaido };
}
