import { useEffect, useRef, useState } from 'react';

const C = {
  verde:'#0A7B5E', azul:'#0B2D5E', blanco:'#FFFFFF',
  gris200:'#E5E7EB', gris600:'#6B7280', gris900:'#111827',
};

// Coordenadas de distritos de Lima para posicionamiento rápido
const DISTRITO_COORDS = {
  'Miraflores':           [-12.1211, -77.0290],
  'San Isidro':           [-12.0971, -77.0386],
  'San Borja':            [-12.1089, -77.0024],
  'Santiago de Surco':    [-12.1392, -76.9928],
  'Surquillo':            [-12.1133, -77.0211],
  'Barranco':             [-12.1453, -77.0212],
  'La Molina':            [-12.0861, -76.9478],
  'San Miguel':           [-12.0778, -77.0907],
  'Pueblo Libre':         [-12.0739, -77.0625],
  'Jesús María':          [-12.0709, -77.0454],
  'Lince':                [-12.0847, -77.0344],
  'Magdalena del Mar':    [-12.0909, -77.0717],
  'Lima Cercado':         [-12.0464, -77.0428],
  'La Victoria':          [-12.0650, -77.0147],
  'El Agustino':          [-12.0408, -76.9956],
  'Ate':                  [-12.0286, -76.9358],
  'Santa Anita':          [-12.0481, -76.9719],
  'San Martín de Porres': [-12.0014, -77.0706],
  'Los Olivos':           [-11.9944, -77.0706],
  'Independencia':        [-11.9939, -77.0517],
  'Comas':                [-11.9419, -77.0489],
  'San Juan de Lurigancho':[-11.9836, -76.9975],
  'San Juan de Miraflores':[-12.1569, -76.9731],
  'Villa El Salvador':    [-12.2136, -76.9414],
  'Chorrillos':           [-12.1672, -77.0183],
  'Callao':               [-12.0658, -77.1328],
};

export function getDistritoCoords(distrito) {
  if (!distrito) return [-12.0464, -77.0428];
  for (const [key, coords] of Object.entries(DISTRITO_COORDS)) {
    if (distrito.toUpperCase().includes(key.toUpperCase()) ||
        key.toUpperCase().includes(distrito.toUpperCase())) {
      return coords;
    }
  }
  return [-12.0464, -77.0428];
}

// Dispersar farmacias alrededor del punto central del distrito
function dispersarCoordenadas(index, total, centro) {
  // Radio máximo 0.004 grados (~440m) — se mantiene dentro del distrito
  const radio = 0.001 + (Math.floor(index / 6) * 0.0015);
  const radioFinal = Math.min(radio, 0.004);
  const angulo = (index * 137.508) * (Math.PI / 180); // espiral áurea
  return [
    centro[0] + radioFinal * Math.sin(angulo),
    centro[1] + radioFinal * Math.cos(angulo),
  ];
}

async function cargarLeaflet() {
  if (window.L) return window.L;
  await new Promise(res => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = res;
    document.head.appendChild(script);
  });
  return window.L;
}

function getPrecioColor(precio, minPrecio, maxPrecio) {
  if (!precio) return '#9CA3AF';
  const rango = maxPrecio - minPrecio;
  if (rango === 0) return C.verde;
  const pct = (precio - minPrecio) / rango;
  if (pct <= 0.25) return '#059669'; // verde oscuro — más barato
  if (pct <= 0.5)  return '#0A7B5E'; // verde MediSinas
  if (pct <= 0.75) return '#D97706'; // amarillo — precio medio
  return '#DC2626';                   // rojo — más caro
}

// puntos: [{ r, coords:{lat,lon}, precio }] — coords ya geocodificadas por Resultados.
export function MapaFarmacias({ puntos = [], geoPos, maxDist }) {
  const mapRef     = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const userLayerRef = useRef(null);
  const [listo, setListo] = useState(false);

  // Inicializar mapa
  useEffect(() => {
    let mounted = true;
    cargarLeaflet().then(L => {
      if (!mounted || !mapRef.current || leafletMap.current) return;
      const centro = geoPos ? [geoPos.lat, geoPos.lon] : [-12.0464, -77.0428];

      leafletMap.current = L.map(mapRef.current, {
        center: centro, zoom: 14,
        zoomControl: true, attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd',
      }).addTo(leafletMap.current);

      setListo(true);
    });
    return () => { mounted = false; };
  }, []);

  // Marcador de "tu ubicación" + círculo del radio de búsqueda (reactivo a geoPos/maxDist)
  useEffect(() => {
    if (!listo || !leafletMap.current) return;
    const L = window.L;
    if (userLayerRef.current) { userLayerRef.current.remove(); userLayerRef.current = null; }
    if (!geoPos) return;

    const layer = L.layerGroup().addTo(leafletMap.current);
    const iconUser = L.divIcon({
      html: `<div style="width:16px;height:16px;background:#3F53C4;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 4px rgba(63,83,196,0.25),0 2px 6px rgba(0,0,0,0.4)"></div>`,
      className:'', iconSize:[16,16], iconAnchor:[8,8],
    });
    L.marker([geoPos.lat, geoPos.lon], { icon: iconUser, zIndexOffset: 1000 })
      .addTo(layer)
      .bindPopup('<strong style="font-size:13px">📍 Tu ubicación</strong>');
    if (maxDist) {
      L.circle([geoPos.lat, geoPos.lon], {
        radius: maxDist * 1000, color:'#3F53C4', weight:1.5, opacity:0.5,
        fillColor:'#3F53C4', fillOpacity:0.07,
      }).addTo(layer);
    }
    userLayerRef.current = layer;
  }, [listo, geoPos, maxDist]);

  // Marcadores de farmacias — usa las coords provistas (sin geocodificar de nuevo)
  useEffect(() => {
    if (!listo || !leafletMap.current) return;
    const L = window.L;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const conCoords = puntos.filter(p => p.coords && isFinite(p.coords.lat) && isFinite(p.coords.lon));
    if (!conCoords.length) {
      if (geoPos) leafletMap.current.setView([geoPos.lat, geoPos.lon], 14);
      return;
    }

    const precios = conCoords.map(p => p.precio).filter(x => x > 0);
    const minP = precios.length ? Math.min(...precios) : 0;
    const maxP = precios.length ? Math.max(...precios) : 0;

    const bounds = [];
    conCoords.forEach(({ r, coords, precio }) => {
      const color = getPrecioColor(precio, minP, maxP);
      const esMinimo = precio > 0 && precio === minP;
      const es24h = /24\s*h/i.test(r.nombreComercial || '');
      const esPublico = r.setcodigo === 'Público';

      const icon = L.divIcon({
        html: `<div style="background:${color};color:#fff;border-radius:20px;padding:3px 8px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid rgba(255,255,255,0.9)">${es24h ? '🌙 ' : ''}S/${precio.toFixed(2)}</div>`,
        className:'', iconSize:[60,22], iconAnchor:[30,11],
      });

      const gmapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${r.nombreComercial} ${r.direccion} ${r.distrito || ''} Lima Peru`)}`;

      const marker = L.marker([coords.lat, coords.lon], { icon }).addTo(leafletMap.current);
      marker.bindPopup(L.popup({ maxWidth:260 }).setContent(`
        <div style="font-family:-apple-system,sans-serif;padding:2px">
          <div style="font-weight:700;font-size:13px;color:#111827;margin-bottom:4px">${r.nombreComercial || ''}</div>
          <div style="font-size:11px;color:#6B7280;margin-bottom:6px;line-height:1.4">${r.direccion || ''}${r.distrito ? ', '+r.distrito : ''}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:18px;font-weight:800;color:${color}">S/ ${precio.toFixed(2)}</span>
            ${esMinimo ? '<span style="background:#FEF3C7;color:#92400E;font-size:10px;padding:2px 6px;border-radius:8px;font-weight:600">⭐ Más barato</span>' : ''}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
            ${es24h ? '<span style="background:#EDE9FE;color:#5B21B6;font-size:10px;padding:2px 6px;border-radius:8px;font-weight:600">🌙 24h</span>' : ''}
            ${esPublico ? '<span style="background:#DBEAFE;color:#1D4ED8;font-size:10px;padding:2px 6px;border-radius:8px;font-weight:600">Público</span>' : '<span style="background:#FEE2E2;color:#991B1B;font-size:10px;padding:2px 6px;border-radius:8px;font-weight:600">Privado</span>'}
            ${r.telefono ? `<span style="font-size:10px;color:#6B7280">📞 ${r.telefono}</span>` : ''}
          </div>
          <a href="${gmapsUrl}" target="_blank" style="display:block;text-align:center;background:#0A7B5E;color:#fff;text-decoration:none;padding:7px;border-radius:8px;font-size:12px;font-weight:600">🗺 Cómo llegar</a>
        </div>
      `));

      bounds.push([coords.lat, coords.lon]);
      markersRef.current.push(marker);
    });

    const todo = [...bounds];
    if (geoPos) todo.push([geoPos.lat, geoPos.lon]);
    if (todo.length) leafletMap.current.fitBounds(todo, { padding:[40,40], maxZoom:16 });
  }, [listo, puntos, geoPos]);

  const ubicadas = puntos.filter(p => p.coords).length;

  return (
    <div style={{position:'relative',width:'100%'}}>
      {/* Leyenda de colores */}
      <div style={{
        position:'absolute',bottom:12,left:12,zIndex:1000,
        background:'rgba(255,255,255,0.95)',borderRadius:10,
        padding:'8px 12px',fontSize:11,boxShadow:'0 2px 12px rgba(0,0,0,0.15)',
      }}>
        <div style={{fontWeight:700,color:'#374151',marginBottom:5}}>Precio</div>
        {[
          {color:'#059669',label:'Más barato'},
          {color:'#D97706',label:'Precio medio'},
          {color:'#DC2626',label:'Más caro'},
        ].map(({color,label}) => (
          <div key={label} style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:color}}/>
            <span style={{color:'#6B7280'}}>{label}</span>
          </div>
        ))}
        <div style={{display:'flex',alignItems:'center',gap:6,marginTop:2}}>
          <span style={{fontSize:12}}>🌙</span>
          <span style={{color:'#6B7280'}}>24 horas</span>
        </div>
      </div>

      {/* Nota de cobertura */}
      <div style={{
        position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',
        zIndex:1000,background:'rgba(11,45,94,0.85)',color:'#fff',
        borderRadius:20,padding:'5px 14px',fontSize:11,fontWeight:500,
        whiteSpace:'nowrap',
      }}>
        {ubicadas > 0 ? `Ubicadas ${ubicadas} de ${puntos.length} farmacias` : 'Ubicando farmacias…'}
      </div>

      <div ref={mapRef} style={{width:'100%',height:'430px',borderRadius:12,zIndex:1}}/>
    </div>
  );
}

export function ToggleVistaBtn({ vista, onChange }) {
  return (
    <div style={{display:'inline-flex',borderRadius:10,border:`1.5px solid #E5E7EB`,overflow:'hidden',background:'#fff'}}>
      {[{key:'lista',icon:'☰',label:'Lista'},{key:'mapa',icon:'🗺',label:'Mapa'}].map(({key,icon,label}) => (
        <button key={key} onClick={() => onChange(key)} style={{
          padding:'7px 18px',border:'none',
          background: key===vista ? '#0B2D5E' : '#fff',
          color: key===vista ? '#fff' : '#6B7280',
          fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:5,
        }}>
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
