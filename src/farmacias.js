export const CADENAS_ECOMMERCE = [
  { nombre:'InkaFarma', patrones:['INKAFARMA','INKA FARMA','BOTICAS INKAFARMA'], buildUrl:(t)=>`https://inkafarma.pe/buscador?keyword=${encodeURIComponent(t)}`, color:'#F5C800', textColor:'#1A1A1A', label:'Buscar en InkaFarma' },
  { nombre:'MiFarma', patrones:['MIFARMA','MI FARMA','BOTICAS MI FARMA'], buildUrl:(t)=>`https://www.mifarma.com.pe/buscador?keyword=${encodeURIComponent(t)}`, color:'#FF6B00', textColor:'#FFFFFF', label:'Buscar en MiFarma' },
  { nombre:'Boticas Arcángel', patrones:['ARCANGEL','ARCÁNGEL','BOTICAS ARCANGEL'], buildUrl:(t)=>`https://www.boticasarcangel.com/buscar?q=${encodeURIComponent(t)}`, color:'#7B2FBE', textColor:'#FFFFFF', label:'Buscar en Arcángel' },
  { nombre:'Superfarma', patrones:['SUPERFARMA','SUPER FARMA'], buildUrl:(t)=>`https://superfarma.pe/search?q=${encodeURIComponent(t)}`, color:'#E8521A', textColor:'#FFFFFF', label:'Buscar en Superfarma' },
  { nombre:'Farmacia Universal', patrones:['FARMACIA UNIVERSAL','FARMA UNIVERSAL'], buildUrl:(t)=>`https://farmaciauniversal.com.pe/search?q=${encodeURIComponent(t)}`, color:'#005BAC', textColor:'#FFFFFF', label:'Buscar en Farmacia Universal' },
];
export function getEcommerceUrl(nombreComercial) {
  if (!nombreComercial) return null;
  const nombre = nombreComercial.toUpperCase();
  for (const cadena of CADENAS_ECOMMERCE) {
    if (cadena.patrones.some(p => nombre.includes(p))) {
      return { buildUrl:cadena.buildUrl, nombreCadena:cadena.nombre, color:cadena.color, textColor:cadena.textColor, label:cadena.label };
    }
  }
  return null;
}
