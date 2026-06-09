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
    </div>
  );
}
