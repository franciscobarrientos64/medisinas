import { getEstadoFarmacia } from './horarios';

export function HorarioBadge({ nombreComercial, setcodigo }) {
  if (!nombreComercial) return null;
  const { estado, apertura, cierre } = getEstadoFarmacia(nombreComercial, setcodigo);

  if (estado === '24h') {
    return <Badge bg="#EDE9FE" color="#5B21B6" border="#C4B5FD">🌙 Abierto 24 horas</Badge>;
  }
  if (estado === 'abierto') {
    return <Badge bg="#DCFCE7" color="#166534" border="#86EFAC">🟢 Abierto · Cierra {cierre}</Badge>;
  }
  if (estado === 'cerrado') {
    return <Badge bg="#FEE2E2" color="#991B1B" border="#FCA5A5">🔴 Cerrado · Abre {apertura}</Badge>;
  }
  return null; // desconocido — no mostramos nada
}

function Badge({ bg, color, border, children }) {
  return (
    <div style={{
      display:'inline-block', fontSize:11, fontWeight:600,
      padding:'3px 8px', borderRadius:8,
      background:bg, color, border:`1px solid ${border}`,
      marginTop:4, marginBottom:2,
    }}>
      {children}
    </div>
  );
}
