import React, { useState, useEffect, useCallback } from "react";
import "./theme.css";
import { useAuth } from "../UserAuth";
import TopNav from "./TopNav";
import Home from "./Home";
import Resultados from "./Resultados";
import Detalle from "./Detalle";
import Ahorro from "./Ahorro";
import Familia from "./Familia";
import MisMedicamentos from "./MisMedicamentos";
import Recetas from "./Recetas";
import Alertas from "./Alertas";
import Login from "./Login";
import Perfil from "./Perfil";

export default function AppV2() {
  const { user, signOut, signIn } = useAuth();
  const [route, setRoute] = useState({ name: "home", params: {} });
  const [personas, setPersonas] = useState([]);
  const [activePersona, setActivePersona] = useState(null);

  const go = useCallback((name, params = {}) => {
    setRoute({ name, params });
    window.scrollTo(0, 0);
  }, []);

  const refreshPersonas = useCallback(() => {
    if (!user?.id) {
      setPersonas([]);
      setActivePersona(null);
      return;
    }
    fetch(`/api/data?action=get-personas&userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        const ps = d.personas || [];
        setPersonas(ps);
        setActivePersona((prev) => (prev && ps.find((p) => p.id === prev.id)) || ps.find((p) => p.es_titular) || ps[0] || null);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => { refreshPersonas(); }, [refreshPersonas]);

  const onAuthed = (u) => { signIn(u); go("home"); };

  let screen;
  switch (route.name) {
    case "home": screen = <Home go={go} activePersona={activePersona} />; break;
    case "resultados": screen = <Resultados query={route.params.query} loc={route.params.loc} variante={route.params.variante} go={go} activePersona={activePersona} />; break;
    case "detalle": screen = <Detalle params={route.params} go={go} activePersona={activePersona} />; break;
    case "ahorro": screen = <Ahorro go={go} personas={personas} />; break;
    case "familia": screen = <Familia go={go} personas={personas} onRefresh={refreshPersonas} />; break;
    case "medicamentos": screen = <MisMedicamentos go={go} activePersona={activePersona} />; break;
    case "recetas": screen = <Recetas go={go} />; break;
    case "alertas": screen = <Alertas go={go} />; break;
    case "login": screen = <Login go={go} onAuthed={onAuthed} />; break;
    case "perfil": screen = <Perfil go={go} user={user} onSignOut={signOut} />; break;
    default: screen = <Home go={go} activePersona={activePersona} />;
  }

  return (
    <div className="bg-surface min-h-screen">
      <TopNav
        go={go}
        active={route.name}
        personas={personas}
        activePersona={activePersona}
        onChangePersona={setActivePersona}
        user={user}
        onProfile={() => go(user ? "perfil" : "login")}
      />
      {screen}
      {/* El #medisinas del mensaje predeterminado es lo que hace que el bot conteste como MediSinas. */}
      <a
        href="https://wa.me/51974826828?text=Hola%2C%20quiero%20consultar%20el%20precio%20de%20una%20medicina.%20%23medisinas"
        target="_blank"
        rel="noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className="fixed right-4 bottom-4 z-50 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#25D366] text-white text-body-sm font-semibold shadow-lg hover:bg-[#1da851] transition-colors active:scale-95"
      >
        {/* El logo de WhatsApp, no un ícono de chat genérico: se reconoce sin leer. */}
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
          <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.38a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0 0 12.04 2m0 1.8c2.16 0 4.2.84 5.73 2.37a8.06 8.06 0 0 1 2.37 5.73c0 4.47-3.63 8.1-8.1 8.1a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.06.8.82-2.99-.2-.31a8.05 8.05 0 0 1-1.23-4.3c0-4.46 3.64-8.09 8.1-8.09m-3.1 4.3c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.54 2.02.78 2.43.63 2.87.59.44-.04 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.64-1.19-1.42-1.33-1.66-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41h-.46Z" />
        </svg>
        <span className="hidden sm:inline">Consultar por WhatsApp</span>
      </a>
    </div>
  );
}
