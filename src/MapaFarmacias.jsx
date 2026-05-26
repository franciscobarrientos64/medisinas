import { useEffect, useRef, useState } from 'react';

const C = {
  verde:'#0A7B5E', verdePale:'#E8F7F3',
  azul:'#0B2D5E', blanco:'#FFFFFF',
  gris200:'#E5E7EB', gris600:'#6B7280', gris900:'#111827',
  rojo:'#CC0000', amarillo:'#F5C800',
};

// Carga Leaflet dinámicamente (evita SSR issues)
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

// ── Componente principal ──────────────────────────────────────────────────────
export function MapaFarmacias({ resultados, geocacheRef, geoPos, varianteActiva, onVerPrecio }) {
  const mapRef       = useRef(null);
  const leafletMap   = useRef(null);
  const markersRef   = useRef([]);
  const [listo, setListo]   = useState(false);
  const [cargando, setCargando] = useState(true);
  const [geocoded, setGeocoded] = useState(0);

  // Inicializar mapa
  useEffect(() => {
    let mounted = true;
    cargarLeaflet().then(L => {
      if (!mounted || !mapRef.current || leafletMap.current) return;
      const centro = geoPos
        ? [geoPos.lat, geoPos.lon]
        : [-12.0464, -77.0428]; // Lima centro
      leafletMap.current = L.map(mapRef.current, {
        center: centro, zoom: 14,
        zoomControl: true, attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(leafletMap.current);
      // Marcador de usuario
      if (geoPos) {
        const iconUsuario = L.divIcon({
          html: `<div style="background:#0B2D5E;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
          className: '', iconSize:[14,14], iconAnchor:[7,7],
        });
        L.marker([geoPos.lat, geoPos.lon], { icon: iconUsuario })
          .addTo(leafletMap.current)
          .bindPopup('<strong>Tu ubicación</strong>');
      }
      setListo(true);
    });
    return () => { mounted = false; };
  }, []);

  // Agregar marcadores cuando el mapa esté listo
  useEffect(() => {
    if (!listo || !leafletMap.current || !resultados.length) return;
    const L = window.L;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    setCargando(true);

    const agregarMarcadores = async () => {
      const primeros = resultados.slice(0, 20);
      let count = 0;

      for (let i = 0; i < primeros.length; i++) {
        const r = primeros[i];
        const key = `${r.direccion}|${r.distrito}`;
        let coords = geocacheRef.current?.[key];

        // Geocodificar si no está en caché
        if (!coords) {
          try {
            const q = encodeURIComponent(`${r.direccion}, ${r.distrito || ''}, Lima, Peru`);
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=pe`,
              { headers: { 'User-Agent': 'MediSinas/1.0 info@medisinas.com' } }
            );
            const data = await res.json();
            if (data[0]) {
              coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
              if (geocacheRef.current) geocacheRef.current[key] = coords;
            }
          } catch {}
        }

        if (!coords) continue;

        const precio = r.precio2 || r.precio1 || r.precio3;
        const esPublico = r.setcodigo === 'Público';
        const es24h = /24\s*h/i.test(r.nombreComercial);
        const color = esPublico ? '#0B2D5E' : '#CC0000';

        const icon = L.divIcon({
          html: `
            <div style="
              background:${color};color:#fff;
              border-radius:8px;padding:3px 7px;
              font-size:11px;font-weight:700;
              white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.3);
              border:2px solid #fff;position:relative;
            ">
              ${es24h ? '🌙 ' : ''}S/${parseFloat(precio).toFixed(2)}
              <div style="
                position:absolute;bottom:-7px;left:50%;transform:translateX(-50%);
                border-left:6px solid transparent;border-right:6px solid transparent;
                border-top:7px solid ${color};
              "></div>
            </div>`,
          className: '', iconSize:[80,28], iconAnchor:[40,35],
        });

        const marker = L.marker([coords.lat, coords.lon], { icon })
          .addTo(leafletMap.current);

        const popup = L.popup({ maxWidth: 240 }).setContent(`
          <div style="font-family:sans-serif;padding:4px">
            <p style="font-weight:700;font-size:13px;color:#111827;margin:0 0 4px">${r.nombreComercial}</p>
            <p style="font-size:12px;color:#6B7280;margin:0 0 4px">${r.direccion}${r.distrito ? ', ' + r.distrito : ''}</p>
            <p style="font-size:16px;font-weight:700;color:${color};margin:0 0 8px">S/ ${parseFloat(precio).toFixed(2)}</p>
            ${es24h ? '<span style="background:#FEF3C7;color:#92400E;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600">🌙 24 horas</span>' : ''}
            ${esPublico ? '<span style="background:#DBEAFE;color:#1D4ED8;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;margin-left:4px">Público</span>' : ''}
            ${r.telefono ? `<p style="font-size:11px;color:#6B7280;margin:6px 0 0">📞 ${r.telefono}</p>` : ''}
          </div>
        `);

        marker.bindPopup(popup);
        markersRef.current.push(marker);
        count++;
        setGeocoded(count);
      }

      setCargando(false);

      // Ajustar vista a los marcadores
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        leafletMap.current.fitBounds(group.getBounds().pad(0.15));
      }
    };

    agregarMarcadores();
  }, [listo, resultados]);

  return (
    <div style={{ position:'relative', width:'100%' }}>
      {/* Leyenda */}
      <div style={{
        position:'absolute', top:10, left:10, zIndex:1000,
        background:'rgba(255,255,255,0.95)', borderRadius:10,
        padding:'8px 12px', fontSize:11, boxShadow:'0 2px 8px rgba(0,0,0,0.15)',
        display:'flex', flexDirection:'column', gap:5,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:10,height:10,borderRadius:'50%',background:'#CC0000',display:'inline-block'}}/>
          Farmacia privada
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:10,height:10,borderRadius:'50%',background:'#0B2D5E',display:'inline-block'}}/>
          Establecimiento público
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>🌙 24 horas</div>
      </div>

      {/* Contador de carga */}
      {cargando && (
        <div style={{
          position:'absolute', bottom:10, left:'50%', transform:'translateX(-50%)',
          zIndex:1000, background:'rgba(11,45,94,0.9)', color:'#fff',
          borderRadius:20, padding:'6px 16px', fontSize:12, fontWeight:600,
        }}>
          Localizando farmacias... {geocoded}/{Math.min(resultados.length, 20)}
        </div>
      )}

      {/* Mapa */}
      <div ref={mapRef} style={{ width:'100%', height:'420px', borderRadius:12, zIndex:1 }} />
    </div>
  );
}

// ── Botón toggle Lista / Mapa ─────────────────────────────────────────────────
export function ToggleVistaBtn({ vista, onChange }) {
  return (
    <div style={{
      display:'inline-flex', borderRadius:10,
      border:`1.5px solid ${C.gris200}`, overflow:'hidden',
      background:'#fff',
    }}>
      {[
        { key:'lista', icon:'☰', label:'Lista' },
        { key:'mapa',  icon:'🗺', label:'Mapa'  },
      ].map(({ key, icon, label }) => (
        <button key={key} onClick={() => onChange(key)} style={{
          padding:'7px 16px', border:'none',
          background: vista === key ? C.azul : '#fff',
          color: vista === key ? '#fff' : C.gris600,
          fontSize:13, fontWeight:600, cursor:'pointer',
          display:'flex', alignItems:'center', gap:5,
          transition:'all .15s',
        }}>
          {icon} {label}
        </button>
      ))}
    </div>
  );
}
