export function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const HISTORIAL_KEY = 'medisinas_historial';
const MAX_HISTORIAL = 6;

export function getHistorial() {
  try { return JSON.parse(localStorage.getItem(HISTORIAL_KEY) || '[]'); } catch(e) { return []; }
}

export function agregarAlHistorial(variante) {
  try {
    const historial = getHistorial();
    const item = { nombreProducto: variante.nombreProducto, concent: variante.concent, nombreFormaFarmaceutica: variante.nombreFormaFarmaceutica, grupo: variante.grupo, codGrupoFF: variante.codGrupoFF, timestamp: Date.now() };
    const filtrado = historial.filter(h => !(h.grupo === item.grupo && h.codGrupoFF === item.codGrupoFF && h.concent === item.concent));
    const nuevo = [item, ...filtrado].slice(0, MAX_HISTORIAL);
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(nuevo));
    return nuevo;
  } catch(e) { return []; }
}

export const SINTOMAS = {
  'dolor de cabeza': ['PARACETAMOL','IBUPROFENO','NAPROXENO SODICO'],
  'fiebre': ['PARACETAMOL','IBUPROFENO','METAMIZOL SODICO'],
  'gripe': ['PARACETAMOL','CLORFENAMINA MALEATO','PSEUDOEFEDRINA'],
  'tos': ['DEXTROMETORFANO','AMBROXOL','BROMHEXINA'],
  'tos seca': ['DEXTROMETORFANO','CLOPERASTINA'],
  'tos con flema': ['AMBROXOL','BROMHEXINA','ACETILCISTEINA'],
  'dolor de garganta': ['IBUPROFENO','PARACETAMOL','AMOXICILINA'],
  'gastritis': ['OMEPRAZOL','RANITIDINA','PANTOPRAZOL'],
  'diarrea': ['LOPERAMIDA','METRONIDAZOL','SALES DE REHIDRATACION ORAL'],
  'nauseas': ['METOCLOPRAMIDA','DOMPERIDONA','DIMENHIDRINATO'],
  'infeccion urinaria': ['CIPROFLOXACINO','NITROFURANTOINA','TRIMETOPRIMA'],
  'alergia': ['LORATADINA','CETIRIZINA','CLORFENAMINA MALEATO'],
  'presion alta': ['ENALAPRIL','LOSARTAN','AMLODIPINO'],
  'diabetes': ['METFORMINA','GLIBENCLAMIDA'],
  'colesterol': ['ATORVASTATINA','SIMVASTATINA'],
  'dolor muscular': ['IBUPROFENO','DICLOFENACO','NAPROXENO SODICO'],
  'dolor de espalda': ['IBUPROFENO','DICLOFENACO','NAPROXENO SODICO'],
  'ansiedad': ['ALPRAZOLAM','CLONAZEPAM','DIAZEPAM'],
  'insomnio': ['CLONAZEPAM','MELATONINA'],
  'conjuntivitis': ['CLORANFENICOL OFTALMICA','TOBRAMICINA'],
  'hongos': ['FLUCONAZOL','CLOTRIMAZOL'],
  'asma': ['SALBUTAMOL','BUDESONIDA'],
  'dolor de estomago': ['OMEPRAZOL','PANTOPRAZOL','HIOSCINA'],
  'dolor de barriga': ['HIOSCINA','OMEPRAZOL','METAMIZOL SODICO'],
  'colico': ['HIOSCINA','METAMIZOL SODICO'],
  'acidez': ['OMEPRAZOL','RANITIDINA','HIDROXIDO DE ALUMINIO'],
  'reflujo': ['OMEPRAZOL','PANTOPRAZOL'],
  'estreñimiento': ['BISACODILO','LACTULOSA'],
  'vomito': ['METOCLOPRAMIDA','DIMENHIDRINATO','DOMPERIDONA'],
  'migraña': ['SUMATRIPTAN','PARACETAMOL','IBUPROFENO'],
  'resfrio': ['PARACETAMOL','CLORFENAMINA MALEATO','PSEUDOEFEDRINA'],
  'resfriado': ['PARACETAMOL','CLORFENAMINA MALEATO','PSEUDOEFEDRINA'],
  'dolor de muela': ['IBUPROFENO','PARACETAMOL','NAPROXENO SODICO'],
  'dolor menstrual': ['IBUPROFENO','NAPROXENO SODICO','PARACETAMOL'],
  'mareo': ['DIMENHIDRINATO','METOCLOPRAMIDA'],
};

export const DISCLAIMER_SINTOMA = '⚠️ Información orientativa únicamente. No reemplaza la consulta médica.';

export function detectarSintoma(texto) {
  const t = texto.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [sintoma, medicamentos] of Object.entries(SINTOMAS)) {
    const s = sintoma.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t.includes(s)) return { sintoma, medicamentos };
  }
  return null;
}

export async function compartirWhatsApp(farmacia, precio, medicamento, distrito, direccion, telefono, ecommerceUrl, ecommerceNombre, geoPos) {
  const dest = encodeURIComponent(`${farmacia.split(' ').slice(0,3).join(' ')}, ${distrito || 'Lima'}, Peru`);
  const gmapsUrl = `https://maps.google.com/?q=${dest}`;
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  const wazeUrl  = isMobile ? `waze://?q=${dest}&navigate=yes` : `https://waze.com/ul?q=${dest}`;
  const linkCompra = (ecommerceUrl && ecommerceNombre && medicamento && !ecommerceUrl.endsWith('=')) ? ecommerceUrl : null;
  let msg = 'medisinas.com | Precio encontrado\n\n';
  msg += `Encontre *${medicamento}* a *S/ ${precio}* en:\n\n*${farmacia}*\n`;
  if (direccion) msg += direccion;
  if (distrito) msg += `, ${distrito}`;
  msg += '\n\nComo llegar:\nWaze: ' + wazeUrl + '\nGoogle Maps: ' + gmapsUrl;
  if (linkCompra) msg += `\n\nComprar en ${ecommerceNombre}:\n${linkCompra}`;
  msg += '\n\nBusca el mejor precio en: https://medisinas.com';
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
}
