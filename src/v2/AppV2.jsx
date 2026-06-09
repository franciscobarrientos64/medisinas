import React, { useState, useEffect, useCallback } from "react";
import "./theme.css";
import { useAuth } from "../UserAuth";
import TopNav from "./TopNav";
import Home from "./Home";
import Resultados from "./Resultados";
import Detalle from "./Detalle";
import Ahorro from "./Ahorro";
import Familia from "./Familia";

function Placeholder({ title, go }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 px-margin-page text-center">
      <span className="material-symbols-outlined text-5xl text-outline mb-4">construction</span>
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2 capitalize">{title}</h2>
      <p className="text-on-surface-variant text-body-md mb-6">Esta pantalla está en construcción en el rediseño.</p>
      <button onClick={() => go("home")} className="px-8 py-3 bg-primary text-white font-bold rounded-full">Volver al inicio</button>
    </div>
  );
}

export default function AppV2() {
  const { user } = useAuth();
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
    fetch(`/api/get-personas?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        const ps = d.personas || [];
        setPersonas(ps);
        setActivePersona((prev) => (prev && ps.find((p) => p.id === prev.id)) || ps.find((p) => p.es_titular) || ps[0] || null);
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => { refreshPersonas(); }, [refreshPersonas]);

  let screen;
  switch (route.name) {
    case "home":
      screen = <Home go={go} activePersona={activePersona} />;
      break;
    case "resultados":
      screen = <Resultados query={route.params.query} go={go} activePersona={activePersona} />;
      break;
    case "detalle":
      screen = <Detalle params={route.params} go={go} activePersona={activePersona} />;
      break;
    case "ahorro":
      screen = <Ahorro go={go} personas={personas} />;
      break;
    case "familia":
      screen = <Familia go={go} personas={personas} onRefresh={refreshPersonas} />;
      break;
    default:
      screen = <Placeholder title={route.name} go={go} />;
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
