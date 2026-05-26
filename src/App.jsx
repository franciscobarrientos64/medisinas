import React, { useState, useCallback, useRef, useEffect } from 'react';
import { buscarVariantes, consultarPrecios } from './digemidApi';
import { UBIGEOS, getZona } from './ubigeos';
import { getEcommerceUrl } from './farmacias';
import { getHistorial, agregarAlHistorial, detectarSintoma, compartirWhatsApp, calcularDistancia, DISCLAIMER_SINTOMA, SINTOMAS } from './utils';
import { AuthModal, AuthButton, ProfileSheet, useAuth } from './UserAuth';
import { MisMedicamentosBtn, MisMedicamentosPanel, guardarMedicamento } from './MisMedicamentos';
import { GuardarMedModal } from './GuardarMedModal';
import { MapaFarmacias, ToggleVistaBtn } from './MapaFarmacias';
import { AlertaBtn, AlertaModal } from './AlertaModal';

const GA_ID = 'G-MZ744SDY8T';
function gtag(...args) { window.dataLayer = window.dataLayer || []; window.dataLayer.push(args); }
function trackEvent(name, params = {}) { if (typeof window !== 'undefined') { window.dataLayer = window.dataLayer || []; window.dataLayer.push(['event', name, params]); } }

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #F5F6FA; color: #4A5568; font-family: 'DM Sans', system-ui, sans-serif; min-height: 100vh; font-size: 15px; line-height: 1.6; }
  :root {
    --rojo: #CC0000; --rojo-dark: #A80000;
    --azul: #0B2D5E; --azul-mid: #1A4A8A; --azul-light: #EBF2FF;
    --verde: #00A878; --verde-dark: #007A58; --verde-light: #E8F8F3;
    --naranja: #FF6B35; --amarillo: #FFB800;
    --bg: #F5F6FA; --surface: #FFFFFF; --borde: #E2E8F0;
    --texto: #1A1A2E; --dim: #8898AA;
    --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
    --shadow-md: 0 4px 24px rgba(0,0,0,0.08);
    --shadow-lg: 0 8px 40px rgba(0,0,0,0.12);
    --font-display: 'Inter', system-ui, sans-serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
  }
  .app { min-height: 100vh; }

  /* ── Header ── */
  .header { background:linear-gradient(90deg,#0B2D5E 0%,#00614A 100%); height:58px; padding:0 40px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; box-shadow:0 2px 12px rgba(0,0,0,0.25); }
  @media (max-width:640px) {
    .header { padding:0 14px; height:52px; }
    .header-nav { display:none !important; }
    .live-badge { display:none !important; }
    .logo-text { font-size:17px; }
    .header-right { gap:8px; }
    .subheader { padding:0 14px; gap:16px; }
  }
  .logo { display:flex; align-items:center; gap:12px; text-decoration:none; }
  .logo-icon { width:36px; height:36px; background:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
  .logo-text { font-family:var(--font-display); font-weight:900; font-size:21px; color:#fff; letter-spacing:-0.5px; }
  .logo-text .si { color:#5DDFB8; }
  .header-right { display:flex; align-items:center; gap:16px; }
  .header-nav { display:flex; align-items:center; gap:24px; }
  .header-nav a { font-size:13px; color:rgba(255,255,255,0.85); text-decoration:none; font-weight:500; transition:color 0.15s; }
  .header-nav a:hover { color:#fff; }
  .live-badge { display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.15); padding:5px 12px; border-radius:var(--r-full,9999px); font-size:11px; color:#fff; font-weight:700; letter-spacing:0.3px; }
  .live-dot { width:6px; height:6px; border-radius:50%; background:#5DDFB8; animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(0.8)} }

  /* ── Subheader ── */
  .subheader { background:var(--azul); height:40px; padding:0 40px; display:flex; align-items:center; gap:28px; position:sticky; top:56px; z-index:99; }
  .subheader a { font-size:12px; color:rgba(255,255,255,0.65); text-decoration:none; font-weight:500; transition:color 0.15s; }
  .subheader a:hover { color:#fff; }

  /* ── Hero ── */
  .hero { background:linear-gradient(135deg,var(--azul) 0%,#0F1D45 100%); padding:48px 40px 44px; position:relative; overflow:visible; z-index:200; }
  .hero-inner { max-width:1060px; margin:0 auto; display:grid; grid-template-columns:1fr 340px; gap:52px; align-items:center; position:relative; z-index:201; overflow:visible; }
  .hero-left { position:relative; z-index:202; overflow:visible; }
  /* ── Buscador: siempre encima de todo */
  .search-wrap { position:relative; z-index:9000; }
  .autocomplete { position:absolute; top:calc(100% + 6px); left:0; right:0; background:#fff; border:1.5px solid var(--verde); border-radius:10px; overflow:hidden; z-index:99999; box-shadow:0 20px 50px rgba(0,0,0,0.3); max-height:420px; overflow-y:auto; }
  .hero-tag { display:inline-block; background:rgba(0,168,120,0.2); border:1px solid rgba(0,168,120,0.3); border-radius:var(--r-sm); padding:4px 10px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; color:#52D9B8; margin-bottom:14px; }
  .hero-title { font-family:var(--font-display); font-size:clamp(28px,3.5vw,42px); font-weight:900; color:#fff; line-height:1.05; letter-spacing:-2px; margin-bottom:10px; }
  .hero-title span { color:var(--verde); }
  .hero-tagline { font-size:15px; color:rgba(255,255,255,0.45); font-style:italic; margin-bottom:12px; }
  .hero-sub { font-size:14px; color:rgba(255,255,255,0.6); line-height:1.6; margin-bottom:24px; }
  .hero-sub strong { color:rgba(255,255,255,0.9); font-weight:600; }

  /* ── Geolocalización banner ── */
  .geo-banner { background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); border-radius:8px; padding:10px 14px; margin-bottom:14px; display:flex; align-items:center; gap:10px; cursor:pointer; transition:background 0.2s; }
  .geo-banner:hover { background:rgba(255,255,255,0.18); }
  .geo-banner-text { font-size:13px; color:rgba(255,255,255,0.85); font-weight:500; flex:1; }
  .geo-banner-btn { font-size:11px; font-weight:700; color:#fff; background:rgba(255,255,255,0.2); padding:4px 10px; border-radius:100px; white-space:nowrap; }
  .geo-active { background:rgba(46,125,50,0.25); border-color:rgba(46,125,50,0.5); }
  .geo-active .geo-banner-text { color:#A5D6A7; }

  /* ── Buscador ── */
  .search-input { width:100%; padding:16px 52px 16px 18px; border:none; border-radius:8px; font-size:16px; font-family:'Plus Jakarta Sans',sans-serif; color:var(--azul); background:#fff; outline:none; box-shadow:0 4px 24px rgba(0,0,0,0.25); transition:box-shadow 0.2s; }
  .search-input:focus { box-shadow:0 4px 24px rgba(0,0,0,0.35),0 0 0 3px rgba(255,255,255,0.2); }
  .search-input::placeholder { color:#9AA5B8; }
  .search-btn { position:absolute; right:7px; top:50%; transform:translateY(-50%); width:38px; height:38px; background:var(--rojo); border:none; border-radius:6px; font-size:15px; cursor:pointer; transition:background 0.15s; }
  .search-btn:hover { background:var(--rojo-dark); }

  /* ── Autocomplete ── */
  .autocomplete-header { padding:8px 16px 6px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--dim); border-bottom:1px solid var(--borde); text-align:left; background:#FAFBFF; }
  .autocomplete-section { padding:6px 16px 4px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--rojo); border-bottom:1px solid var(--borde); background:#FFF9F9; }
  .autocomplete-item { padding:11px 16px; cursor:pointer; display:flex; align-items:center; gap:12px; transition:background 0.12s; border-bottom:1px solid var(--borde); text-align:left; }
  .autocomplete-item:last-child { border-bottom:none; }
  .autocomplete-item:hover { background:#F4F6FA; }
  .ac-name { font-weight:700; color:var(--azul); font-size:14px; text-align:left; }
  .ac-detail { font-size:12px; color:var(--dim); margin-top:1px; text-align:left; }

  /* ── Síntoma sugerido ── */
  .sintoma-card { background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.25); border-radius:8px; padding:12px 16px; margin-top:10px; }
  .sintoma-title { font-size:12px; color:rgba(255,255,255,0.7); margin-bottom:8px; }
  .sintoma-tags { display:flex; gap:8px; flex-wrap:wrap; }
  .sintoma-tag { padding:5px 12px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:100px; font-size:12px; font-weight:700; color:#fff; cursor:pointer; transition:background 0.15s; }
  .sintoma-tag:hover { background:rgba(255,255,255,0.25); }

  /* ── Hero card ── */
  .hero-card { background:#fff; border-radius:12px; padding:22px; box-shadow:0 8px 40px rgba(0,0,0,0.3); }
  .hero-card-tag { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--verde); margin-bottom:8px; }
  .hero-card-name { font-size:14px; font-weight:700; color:var(--azul); margin-bottom:6px; }
  .hero-card-badges { display:flex; gap:5px; margin-bottom:10px; }
  .hero-card-price-label { font-size:10px; color:var(--dim); text-align:right; text-transform:uppercase; letter-spacing:0.5px; }
  .hero-card-price { font-size:44px; font-weight:800; color:var(--verde); letter-spacing:-2px; line-height:1; text-align:right; }
  .hero-card-addr { font-size:11px; color:var(--dim); margin-top:10px; padding-top:10px; border-top:1px solid var(--borde); }
  .hero-card-btns { display:flex; gap:6px; margin-top:10px; }
  .hc-btn-p { flex:1; padding:9px; background:var(--azul); color:#fff; border:none; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }
  .hc-btn-s { flex:1; padding:9px; background:#F4F6FA; color:var(--azul); border:1px solid var(--borde); border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }

  /* ── Stats bar ── */
  .stats-bar { background:#fff; border-bottom:1px solid var(--borde); }
  .stats-inner { max-width:1060px; margin:0 auto; display:grid; grid-template-columns:repeat(4,1fr); }
  .stat-item { padding:14px 20px; border-right:1px solid var(--borde); text-align:center; }
  .stat-item:last-child { border-right:none; }
  .stat-val { font-size:20px; font-weight:800; color:var(--azul); }
  .stat-val.green { color:var(--verde); }
  .stat-val.red { color:var(--rojo); }
  .stat-label { font-size:10px; color:var(--dim); text-transform:uppercase; letter-spacing:0.5px; margin-top:2px; }

  /* ── Main ── */
  .main { max-width:1060px; margin:0 auto; padding:24px 40px 48px; }

  /* ── Location ── */
  .location-filters { background:var(--surface); border:1px solid var(--borde); border-radius:10px; padding:12px 16px; margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center; box-shadow:var(--shadow); }
  .location-label { font-size:11px; color:var(--dim); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap; }
  .loc-select { padding:8px 12px; border-radius:6px; background:var(--bg); border:1.5px solid var(--borde); color:var(--texto); font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; cursor:pointer; outline:none; transition:border-color 0.2s; flex:1; min-width:140px; }
  .loc-select:focus { border-color:var(--azul); }
  .btn-buscar { padding:8px 16px; border-radius:6px; background:var(--azul); border:none; color:#fff; font-size:12px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap; transition:background 0.15s; }
  .btn-buscar:hover { background:var(--azul-mid); }
  .geo-indicator { font-size:11px; color:var(--verde); font-weight:700; display:flex; align-items:center; gap:5px; white-space:nowrap; }

  /* ── Distance slider ── */
  .distance-control { background:var(--surface); border:1px solid var(--borde); border-radius:10px; padding:12px 16px; margin-bottom:12px; display:flex; align-items:center; gap:16px; box-shadow:var(--shadow); }
  .distance-label { font-size:12px; font-weight:600; color:var(--azul); white-space:nowrap; }
  .distance-slider { flex:1; height:4px; -webkit-appearance:none; background:var(--borde); border-radius:2px; outline:none; }
  .distance-slider::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--rojo); cursor:pointer; }
  .distance-value { font-size:13px; font-weight:800; color:var(--rojo); white-space:nowrap; min-width:50px; text-align:right; }

  /* ── Modo rápido toggle ── */
  .modo-rapido-bar { background:var(--azul); border-radius:10px; padding:12px 16px; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:background 0.2s; }
  .modo-rapido-bar:hover { background:var(--azul-mid); }
  .modo-rapido-label { font-size:13px; font-weight:700; color:#fff; display:flex; align-items:center; gap:8px; }
  .modo-rapido-sub { font-size:11px; color:rgba(255,255,255,0.6); margin-top:2px; }
  .toggle { width:44px; height:24px; background:rgba(255,255,255,0.2); border-radius:100px; position:relative; transition:background 0.2s; }
  .toggle.on { background:var(--verde); }
  .toggle::after { content:''; position:absolute; width:18px; height:18px; background:#fff; border-radius:50%; top:3px; left:3px; transition:transform 0.2s; box-shadow:0 1px 4px rgba(0,0,0,0.2); }
  .toggle.on::after { transform:translateX(20px); }

  /* ── Filters ── */
  .filters-row { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; align-items:center; }
  .filter-select { padding:7px 12px; border-radius:6px; background:var(--surface); border:1.5px solid var(--borde); color:var(--texto); font-size:12px; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; cursor:pointer; outline:none; }
  .filter-chip { padding:7px 14px; border-radius:100px; border:1.5px solid var(--borde); background:var(--surface); color:var(--dim); font-size:12px; cursor:pointer; transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; }
  .filter-chip.active { background:var(--azul-light); border-color:var(--azul); color:var(--azul); }
  .results-count { margin-left:auto; font-size:12px; color:var(--dim); font-weight:600; }

  /* ── Variant tabs ── */
  .variant-tabs { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px; }
  .variant-tab { padding:6px 12px; border-radius:6px; background:var(--surface); border:1.5px solid var(--borde); color:var(--dim); font-size:12px; cursor:pointer; transition:all 0.15s; font-family:'Plus Jakarta Sans',sans-serif; font-weight:600; }
  .variant-tab.active { background:var(--azul-light); border-color:var(--azul); color:var(--azul); }

  /* ── Genérico vs Marca banner ── */
  .generico-banner { background:linear-gradient(90deg,#E8F5E9,#F1F8F2); border:1.5px solid #A5D6A7; border-radius:10px; padding:14px 18px; margin-bottom:14px; display:flex; align-items:center; gap:14px; }
  .generico-icon { font-size:24px; flex-shrink:0; }
  .generico-text { flex:1; }
  .generico-title { font-size:13px; font-weight:700; color:var(--verde); margin-bottom:3px; }
  .generico-desc { font-size:12px; color:#555; }
  .generico-btn { padding:8px 16px; background:var(--verde); color:#fff; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap; }

  /* ── Cards ── */
  .results { display:flex; flex-direction:column; gap:10px; }
  .card { background:var(--surface); border:1px solid var(--borde); border-radius:10px; padding:18px 22px; display:grid; grid-template-columns:1fr auto; gap:20px; align-items:center; transition:box-shadow 0.2s,border-color 0.2s; box-shadow:var(--shadow); position:relative; overflow:hidden; }
  .card:hover { box-shadow:0 6px 24px rgba(26,43,94,0.12); border-color:#BCC8E0; }
  .card.best { border-left:4px solid var(--verde); background:linear-gradient(90deg,#FAFFFE 0%,#fff 20%); }
  .best-tag { font-size:10px; font-weight:700; color:var(--verde); text-transform:uppercase; letter-spacing:1px; margin-bottom:5px; font-family:var(--font-display); }
  .card-name { font-family:var(--font-display); font-size:14px; font-weight:700; color:var(--azul); margin-bottom:5px; }
  .card-badges { display:flex; gap:5px; flex-wrap:wrap; margin-bottom:5px; }
  .badge { font-size:10px; font-weight:700; padding:2px 7px; border-radius:4px; text-transform:uppercase; letter-spacing:0.3px; }
  .badge-pub { background:var(--verde-light); color:var(--verde); }
  .badge-priv { background:#FFF3E0; color:#E65100; }
  .badge-tipo { background:var(--azul-light); color:var(--azul); }
  .badge-dist { background:#F3F4F6; color:#6B7280; }
  .badge-online { background:#FFF9E6; color:#B8860B; }
  .badge-dist-km { background:#FFF0F0; color:var(--rojo); font-weight:800; }
  .card-addr { font-size:12px; color:var(--dim); }
  .card-meta { font-size:11px; color:#B0BAC9; margin-top:4px; display:flex; gap:12px; flex-wrap:wrap; }

  /* ── Precio ── */
  .price-section { text-align:right; min-width:120px; }
  .price-unit-label { font-size:10px; color:var(--dim); text-transform:uppercase; letter-spacing:0.5px; }
  .price { font-family:var(--font-display); font-size:32px; font-weight:800; color:var(--verde); letter-spacing:-1px; line-height:1; }
  .price-caja { font-size:11px; color:var(--dim); margin-top:2px; margin-bottom:10px; }
  .btn-group { display:flex; flex-direction:column; gap:5px; }
  .btn-primary { padding:8px 14px; border-radius:var(--r-md); background:var(--azul); border:none; color:#fff; font-size:11px; font-weight:600; cursor:pointer; font-family:var(--font-body); white-space:nowrap; width:100%; transition:background 0.15s; letter-spacing:0.2px; }
  .btn-primary:hover { background:var(--azul-mid); }
  .btn-secondary { padding:8px 14px; border-radius:var(--r-md); background:var(--surface); border:1.5px solid var(--borde); color:var(--azul); font-size:11px; font-weight:600; cursor:pointer; font-family:var(--font-body); text-decoration:none; display:block; text-align:center; transition:border-color 0.15s; }
  .btn-secondary:hover { border-color:var(--azul); }
  .btn-ecommerce { padding:8px 14px; border-radius:var(--r-md); border:none; font-size:11px; font-weight:700; cursor:pointer; font-family:var(--font-body); width:100%; text-align:center; text-decoration:none; display:block; transition:opacity 0.15s; }
  .btn-ecommerce:hover { opacity:0.88; }
  .btn-whatsapp { padding:8px 14px; border-radius:var(--r-md); background:#25D366; border:none; color:#fff; font-size:11px; font-weight:700; cursor:pointer; font-family:var(--font-body); width:100%; transition:opacity 0.15s; }
  .btn-whatsapp:hover { opacity:0.88; }

  /* ── Modo rápido card ── */
  .card-rapida { background:var(--surface); border:2px solid var(--verde); border-radius:12px; padding:24px 28px; }
  .rapida-header { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--verde); margin-bottom:12px; }
  .rapida-grid { display:grid; grid-template-columns:1fr auto; gap:20px; align-items:center; }
  .rapida-name { font-size:16px; font-weight:800; color:var(--azul); margin-bottom:6px; }
  .rapida-price { font-size:48px; font-weight:800; color:var(--verde); letter-spacing:-2px; line-height:1; text-align:right; }
  .rapida-price-label { font-size:11px; color:var(--dim); text-align:right; margin-bottom:4px; }
  .rapida-info { font-size:13px; color:var(--dim); margin-top:6px; line-height:1.6; }
  .rapida-btns { display:flex; flex-direction:column; gap:6px; margin-top:14px; }

  /* ── Loading ── */
  .loading { text-align:center; padding:60px 20px; display:flex; flex-direction:column; align-items:center; gap:12px; }
  .spinner { width:38px; height:38px; border-radius:50%; border:3px solid var(--borde); border-top-color:var(--rojo); animation:spin 0.8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
  .loading-text { font-size:15px; color:var(--dim); font-weight:600; }

  /* ── Empty / Warning ── */
  .empty { text-align:center; padding:60px 20px; }
  .empty-icon { font-size:48px; margin-bottom:12px; }
  .empty-title { font-size:18px; font-weight:800; color:var(--azul); margin-bottom:6px; }
  .empty-text { font-size:14px; color:var(--dim); }
  .warning { background:#FEF3C7; border:1px solid #FDE68A; border-radius:8px; padding:9px 14px; margin-bottom:12px; font-size:12px; color:#92400E; display:flex; align-items:flex-start; gap:8px; }

  /* ── Historial ── */
  .historial-section { margin-bottom:20px; }
  .historial-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--dim); margin-bottom:10px; }
  .historial-items { display:flex; gap:8px; flex-wrap:wrap; }
  .historial-item { display:flex; align-items:center; gap:6px; padding:7px 12px; background:var(--surface); border:1.5px solid var(--borde); border-radius:8px; cursor:pointer; transition:all 0.15s; font-size:12px; font-weight:600; color:var(--azul); }
  .historial-item:hover { border-color:var(--azul); background:var(--azul-light); }

  /* ── Map sheet ── */
  .map-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:9999; display:flex; align-items:flex-end; justify-content:center; }
  .map-sheet { background:#fff; border-radius:16px 16px 0 0; padding:28px 24px; width:100%; max-width:480px; border-top:4px solid var(--rojo); }
  .map-sheet-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--dim); margin-bottom:16px; text-align:center; }
  .map-btns { display:flex; gap:12px; margin-bottom:12px; }
  .map-btn { flex:1; padding:14px; border-radius:10px; text-align:center; text-decoration:none; font-weight:800; font-size:14px; display:block; }
  .map-btn-gmaps { background:var(--azul-light); color:var(--azul); border:1.5px solid var(--borde); }
  .map-btn-waze { background:#FFF4EE; color:#E8521A; border:1.5px solid #FED7C0; }
  .map-cancel { width:100%; padding:12px; background:var(--bg); border:1.5px solid var(--borde); border-radius:8px; color:var(--dim); font-weight:700; font-size:14px; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; }

  /* ── Footer ── */
  .footer { background:var(--azul); padding:36px 40px; }
  .footer-inner { max-width:1060px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr 1fr; gap:40px; }
  .footer-brand { font-family:var(--font-display); font-size:20px; font-weight:800; color:#fff; margin-bottom:6px; letter-spacing:-0.5px; }
  .footer-brand .si { color:var(--verde); }
  .footer-tagline { font-size:13px; color:rgba(255,255,255,0.45); font-style:italic; }
  .footer-email { margin-top:12px; }
  .footer-email a { color:var(--verde); font-size:13px; font-weight:600; text-decoration:none; }
  .footer-version { margin-top:10px; display:inline-flex; align-items:center; gap:6px; font-size:10px; font-weight:700; color:rgba(255,255,255,0.25); font-family:var(--font-display); letter-spacing:1px; text-transform:uppercase; background:rgba(255,255,255,0.06); padding:3px 8px; border-radius:var(--r-full); }
  .footer-col-title { font-family:var(--font-display); font-size:10px; text-transform:uppercase; letter-spacing:1.5px; color:rgba(255,255,255,0.35); margin-bottom:12px; font-weight:700; }
  .footer-link { display:block; font-size:13px; color:rgba(255,255,255,0.6); margin-bottom:6px; text-decoration:none; transition:color 0.15s; }
  .footer-link:hover { color:#fff; }
  .footer-legal { font-size:11px; color:rgba(255,255,255,0.25); line-height:1.7; }

  /* ── Responsive ── */
  @media (max-width:768px) {
    .hero-inner { grid-template-columns:1fr; }
    .hero-card { display:none; }
    .stats-inner { grid-template-columns:repeat(2,1fr); }
    .footer-inner { grid-template-columns:1fr; }
    .header { padding:0 16px; }
    .subheader { display:none; }
    .hero { padding:32px 16px; }
    .main { padding:16px 16px 48px; }
    .footer { padding:32px 20px; }
  }
  @media (max-width:600px) {
    .card { grid-template-columns:1fr; }
    .price-section { text-align:left; }
    .btn-group { flex-direction:row; flex-wrap:wrap; }
    .location-filters { flex-direction:column; }
    .loc-select { width:100%; }
    .rapida-grid { grid-template-columns:1fr; }
    .rapida-price { text-align:left; }
  }
`;

// ── Logo ──────────────────────────────────────────────────
function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon">
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="8" fill="#1A2B5E"/>
          <path d="M8 18C8 13.582 11.582 10 16 10H18V26H16C11.582 26 8 22.418 8 18Z" fill="#FFFFFF"/>
          <path d="M18 10H20C24.418 10 28 13.582 28 18C28 22.418 24.418 26 20 26H18V10Z" fill="#CC0000"/>
          <rect x="16" y="5" width="4" height="2" rx="1" fill="#4CAF50"/>
          <rect x="17.5" y="3.5" width="1" height="5" rx="0.5" fill="#4CAF50"/>
        </svg>
      </div>
      <span className="logo-text">Medi<span className="si">Si</span>nas</span>
    </div>
  );
}

// ── MapSheet ──────────────────────────────────────────────
function MapSheet({ direccion, onClose, geoPos }) {
  const dest = encodeURIComponent(direccion + ', Lima, Peru');

  // Con GPS: origen → destino (modo navegación directo)
  // Sin GPS: solo buscar el destino
  const gmapsUrl = geoPos
    ? `https://maps.google.com/maps?saddr=${geoPos.lat},${geoPos.lon}&daddr=${dest}&directionsmode=driving`
    : `https://maps.google.com/?q=${dest}`;

  const wazeUrl = geoPos
    ? `https://waze.com/ul?ll=${encodeURIComponent(dest)}&navigate=yes&from=${geoPos.lat},${geoPos.lon}`
    : `https://waze.com/ul?q=${dest}`;

  return (
    <div className="map-overlay" onClick={onClose}>
      <div className="map-sheet" onClick={e => e.stopPropagation()}>
        <div className="map-sheet-title">
          {geoPos ? '🧭 Navegando desde tu ubicación' : 'Abrir con'}
        </div>
        <div className="map-btns">
          <a href={gmapsUrl} target="_blank" rel="noreferrer" className="map-btn map-btn-gmaps" onClick={onClose}>
            🗺️ Google Maps{geoPos ? ' → Ir' : ''}
          </a>
          <a href={wazeUrl} target="_blank" rel="noreferrer" className="map-btn map-btn-waze" onClick={onClose}>
            🚗 Waze{geoPos ? ' → Ir' : ''}
          </a>
        </div>
        {geoPos && (
          <div style={{fontSize:'11px', color:'var(--dim)', textAlign:'center', marginBottom:'12px'}}>
            📍 Ruta calculada desde tu posición GPS actual
          </div>
        )}
        <button className="map-cancel" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  const { user, signOut, signIn } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mismedOpen, setMismedOpen] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [mostrarGenericos, setMostrarGenericos] = useState(false);
  const [vista, setVista] = useState('lista'); // 'lista' | 'mapa'
  const [alertaData, setAlertaData] = useState(null); // { variante, precioActual, distrito }
  const [guardarData, setGuardarData] = useState(null); // variante a guardar
  const [alertasActivas, setAlertasActivas] = useState(new Set()); // keys de alertas activas

  const [query, setQuery] = useState('');
  const [queryUsuario, setQueryUsuario] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [variantes, setVariantes] = useState([]);
  const [varianteActiva, setVarianteActiva] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busquedaActiva, setBusquedaActiva] = useState('');
  const [mapSheet, setMapSheet] = useState(null);
  const [totalFarmacias, setTotalFarmacias] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [sintomaDetectado, setSintomaDetectado] = useState(null);
  const [busquedaEsSintoma, setBusquedaEsSintoma] = useState(false);
  const [modoRapido, setModoRapido] = useState(false);
  const [distanciaMax, setDistanciaMax] = useState(10);
  const [filtrarPorDistancia, setFiltrarPorDistancia] = useState(false);
  const [geoPos, setGeoPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle'); // idle | loading | active | denied

  const [depSel, setDepSel] = useState('LIMA METROPOLITANA');
  const [provSel, setProvSel] = useState('Lima');
  const [distSel, setDistSel] = useState('Todos los distritos');
  const [soloGenerico, setSoloGenerico] = useState(false);
  const [soloPublico, setSoloPublico] = useState(false);
  const [sortBy, setSortBy] = useState('precio');
  const debounceRef = useRef(null);

  // Init
  useEffect(() => {
    if (GA_ID !== 'G-XXXXXXXXXX') {
      const s = document.createElement('script');
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      s.async = true;
      document.head.appendChild(s);
      s.onload = () => { gtag('js', new Date()); gtag('config', GA_ID); };
    }
    setHistorial(getHistorial());
    // Intentar geo silencioso si ya fue aceptado antes
    if (localStorage.getItem('geo_accepted') === 'true') solicitarGeo(true);
    // Total farmacias
    fetch('/api/digemid', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ endpoint:'preciovista/ciudadano', body:{ filtro:{ codigoProducto:2841, codigoDepartamento:null, codigoProvincia:null, codigoUbigeo:null, codTipoEstablecimiento:null, catEstablecimiento:null, codGrupoFF:'3', concent:'20mg', tamanio:1, pagina:1, tokenGoogle:'token', nombreProducto:null } } }) })
      .then(r=>r.json()).then(d=>{ if(d?.cantidad) setTotalFarmacias(d.cantidad.toLocaleString('es-PE')); }).catch(()=>{});
  }, []);

  // Geolocalización
  const solicitarGeo = useCallback((silencioso = false) => {
    if (!navigator.geolocation) return;
    if (!silencioso) setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setGeoPos({ lat: latitude, lon: longitude });
        setGeoStatus('active');
        localStorage.setItem('geo_accepted', 'true');
        // Autodetectar distrito más cercano basado en coords
        autoDetectarDistrito(latitude, longitude);
      },
      () => {
        setGeoStatus('denied');
        localStorage.removeItem('geo_accepted');
      },
      { timeout: 8000 }
    );
  }, []);

  const autoDetectarDistrito = (lat, lon) => {
    // Mapa aproximado de coordenadas de distritos de Lima
    const distritoCoords = {
      'Miraflores':       { lat:-12.1211, lon:-77.0290 },
      'San Isidro':       { lat:-12.0974, lon:-77.0365 },
      'San Borja':        { lat:-12.1083, lon:-77.0050 },
      'Santiago de Surco':{ lat:-12.1467, lon:-76.9989 },
      'Barranco':         { lat:-12.1436, lon:-77.0196 },
      'Surquillo':        { lat:-12.1121, lon:-77.0142 },
      'La Molina':        { lat:-12.0888, lon:-76.9443 },
      'San Miguel':       { lat:-12.0774, lon:-77.0862 },
      'Lince':            { lat:-12.0851, lon:-77.0348 },
      'Jesús María':      { lat:-12.0736, lon:-77.0495 },
      'Lima Centro':      { lat:-12.0464, lon:-77.0428 },
      'Breña':            { lat:-12.0606, lon:-77.0530 },
      'Rímac':            { lat:-12.0271, lon:-77.0287 },
      'La Victoria':      { lat:-12.0631, lon:-77.0201 },
      'El Agustino':      { lat:-12.0431, lon:-76.9978 },
      'Ate':              { lat:-12.0256, lon:-76.9169 },
      'San Martín de Porres': { lat:-12.0200, lon:-77.0914 },
      'Los Olivos':       { lat:-11.9944, lon:-77.0758 },
      'Independencia':    { lat:-11.9994, lon:-77.0547 },
      'Comas':            { lat:-11.9483, lon:-77.0519 },
      'San Juan de Lurigancho': { lat:-11.9894, lon:-76.9964 },
      'San Juan de Miraflores': { lat:-12.1574, lon:-76.9747 },
      'Villa El Salvador': { lat:-12.2133, lon:-76.9311 },
      'Chorrillos':       { lat:-12.1679, lon:-77.0217 },
    };
    let minDist = Infinity, mejorDist = 'Miraflores';
    for (const [dist, coords] of Object.entries(distritoCoords)) {
      const d = calcularDistancia(lat, lon, coords.lat, coords.lon);
      if (d < minDist) { minDist = d; mejorDist = dist; }
    }
    if (UBIGEOS['LIMA METROPOLITANA']?.provincias['Lima']?.distritos[mejorDist]) {
      setDepSel('LIMA METROPOLITANA');
      setProvSel('Lima');
      setDistSel(mejorDist);
    }
  };

  function handleGuardarMed(variante) {
    if (!user) { setAuthOpen(true); return; }
    setGuardarData(variante);
  }

  const departamentos = Object.keys(UBIGEOS);
  const provincias = depSel ? Object.keys(UBIGEOS[depSel]?.provincias || {}) : [];
  const distritos = (depSel && provSel) ? Object.keys(UBIGEOS[depSel]?.provincias[provSel]?.distritos || {}) : [];
  const distCod = (depSel && provSel && distSel !== 'Todos los distritos') ? UBIGEOS[depSel]?.provincias[provSel]?.distritos[distSel] : null;

  const handleDepChange = dep => { setDepSel(dep); const fp=Object.keys(UBIGEOS[dep]?.provincias||{})[0]||''; setProvSel(fp); setDistSel('Todos los distritos'); };
  const handleProvChange = prov => { setProvSel(prov); setDistSel('Todos los distritos'); };
  const handleDistChange = dist => {
    setDistSel(dist);
    if (!varianteActiva) return;
    const dc = (depSel&&provSel&&dist!=='Todos los distritos') ? UBIGEOS[depSel]?.provincias[provSel]?.distritos[dist] : null;
    buscarPrecios(varianteActiva, depSel, provSel, dc);
  };

  const buscarPrecios = useCallback(async (variante, dep, prov, distCodigo) => {
    const zona = getZona(dep, prov, distCodigo);
    setLoading(true); setResultados([]);
    let todos = [];
    const fetchPag = async (ubigeo, depC, provC) => {
      let p=1;
      while (todos.length<500) {
        const {registros,cantidad} = await consultarPrecios(variante.grupo,variante.codGrupoFF,variante.concent,ubigeo,depC,provC,p,100);
        todos=[...todos,...registros];
        if (p>=Math.ceil((cantidad||0)/100)||registros.length<100) break;
        p++;
      }
    };
    if (zona.ubigeo) await fetchPag(zona.ubigeo,zona.dep,zona.prov);
    else await fetchPag(null,zona.dep,null);
    setResultados(todos); setLoading(false);
  }, []);

  // Caché de autocomplete — evita llamadas repetidas a DIGEMID
  const autocompleteCache = useRef({});

  const ordenarVariantes = (vars) => {
    const seen = new Set();
    const unique = vars.filter(v => {
      const k = `${v.grupo}_${v.codGrupoFF}_${v.concent}`;
      if (seen.has(k)) return false; seen.add(k); return true;
    });
    const fb = ['TABLETA','CAPSULA','COMPRIMIDO','GRAGEA'];
    const fc = ['INYECTABLE','SOLUCION','SUSPENSION','JARABE','AMPOLLA'];
    return [...unique].sort((a,b) => {
      const av = fb.some(f=>a.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 0
               : fc.some(f=>a.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 2 : 1;
      const bv = fb.some(f=>b.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 0
               : fc.some(f=>b.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 2 : 1;
      if (av !== bv) return av - bv;
      return (parseFloat((a.concent||'0').replace(',','.'))||0) -
             (parseFloat((b.concent||'0').replace(',','.'))||0);
    }).slice(0, 10);
  };

  const buscarConRetry = async (val, intentos = 3) => {
    for (let i = 0; i < intentos; i++) {
      try {
        const vars = await buscarVariantes(val);
        if (vars && vars.length > 0) return vars;
        if (i < intentos - 1) await new Promise(r => setTimeout(r, 600 * (i + 1)));
      } catch(err) {
        if (i < intentos - 1) await new Promise(r => setTimeout(r, 600 * (i + 1)));
      }
    }
    return [];
  };

  const handleQueryChange = useCallback(e => {
    const val = e.target.value;
    setQuery(val); setQueryUsuario(val);
    clearTimeout(debounceRef.current);

    const sint = detectarSintoma(val);
    setSintomaDetectado(sint);

    if (val.length < 3) { setSugerencias([]); return; }

    debounceRef.current = setTimeout(async () => {
      try {
        // Usar caché si existe (válido por 5 min)
        const cacheKey = val.toLowerCase().trim();
        const cached = autocompleteCache.current[cacheKey];
        if (cached && Date.now() - cached.ts < 300000) {
          setSugerencias(cached.data);
          return;
        }
        const vars = await buscarConRetry(val);
        if (!vars || vars.length === 0) { setSugerencias([]); return; }
        const ord = ordenarVariantes(vars);
        autocompleteCache.current[cacheKey] = { data: ord, ts: Date.now() };
        setSugerencias(ord);
      } catch(err) {
        console.error('buscarVariantes error:', err);
        setSugerencias([]);
      }
    }, 400);
  }, []);

  const seleccionarVariante = useCallback(async (variante, esSintoma = false) => {
    const nd=`${variante.nombreProducto} ${variante.concent} ${variante.nombreFormaFarmaceutica}`;
    setQuery(nd); setBusquedaActiva(nd); setSugerencias([]); setSintomaDetectado(null);
    setBusquedaEsSintoma(esSintoma);
    setFiltrarPorDistancia(false); setDistanciaMax(10); // resetear slider
    trackEvent('search',{search_term:variante.nombreProducto});
    const h = agregarAlHistorial(variante);
    setHistorial(h);
    const vars=await buscarVariantes(variante.nombreProducto.split(' ')[0]);
    const seen=new Set();
    const unique=vars.filter(v=>{const k=`${v.grupo}_${v.codGrupoFF}_${v.concent}`;if(seen.has(k))return false;seen.add(k);return true;});
    setVariantes(unique); setVarianteActiva(variante);
    buscarPrecios(variante,depSel,provSel,distCod);
  }, [depSel,provSel,distCod,buscarPrecios]);

  const buscarSintoma = useCallback(async med => {
    // Poner el nombre del medicamento en el buscador y buscar variantes en DIGEMID
    // El usuario verá el autocomplete con opciones reales para elegir
    setQuery(med); setQueryUsuario(med);
    setSintomaDetectado(null); setBusquedaEsSintoma(true);
    setSugerencias([]); setLoading(true); setResultados([]);
    trackEvent('search_sintoma', { sintoma: med });

    try {
      // Buscar variantes en DIGEMID
      let vars = await buscarVariantes(med);
      if (!vars || vars.length === 0) {
        vars = await buscarVariantes(med.split(' ')[0]);
      }

      if (!vars || vars.length === 0) {
        setLoading(false);
        setBusquedaActiva(med);
        return;
      }

      // Deduplicar
      const seen = new Set();
      const unique = vars.filter(v => {
        const k = `${v.grupo}_${v.codGrupoFF}_${v.concent}`;
        if (seen.has(k)) return false; seen.add(k); return true;
      });

      // Ordenar: tabletas/cápsulas con menor concentración primero
      const fb = ['TABLETA','CAPSULA','COMPRIMIDO','GRAGEA'];
      const fc = ['INYECTABLE','SOLUCION','SUSPENSION','JARABE','AMPOLLA'];
      const ordenados = [...unique].sort((a,b) => {
        const av = fb.some(f=>a.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 0
                 : fc.some(f=>a.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 2 : 1;
        const bv = fb.some(f=>b.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 0
                 : fc.some(f=>b.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 2 : 1;
        if (av !== bv) return av - bv;
        return (parseFloat((a.concent||'0').replace(',','.'))||0) -
               (parseFloat((b.concent||'0').replace(',','.'))||0);
      });

      // Seleccionar automáticamente la primera variante (más económica) y buscar precios
      const primera = ordenados[0];
      setVariantes(ordenados);
      setVarianteActiva(primera);
      const h = agregarAlHistorial(primera);
      setHistorial(h);

      // Actualizar el buscador con el nombre completo
      const nd = `${primera.nombreProducto} ${primera.concent} ${primera.nombreFormaFarmaceutica}`;
      setQuery(nd); setBusquedaActiva(nd);

      // Buscar precios
      const zona = getZona(depSel, provSel, distCod);
      let todos = [];
      let p = 1;
      while (todos.length < 300) {
        const { registros, cantidad } = await consultarPrecios(
          primera.grupo, primera.codGrupoFF, primera.concent,
          zona.ubigeo || null, zona.dep, zona.ubigeo ? zona.prov : null, p, 100
        );
        todos = [...todos, ...registros];
        if (p >= Math.ceil((cantidad||0)/100) || registros.length < 100) break;
        p++;
      }

      // Fallback nacional si no hay resultados locales
      if (todos.length === 0) {
        p = 1;
        while (todos.length < 300) {
          const { registros, cantidad } = await consultarPrecios(
            primera.grupo, primera.codGrupoFF, primera.concent,
            null, null, null, p, 100
          );
          todos = [...todos, ...registros];
          if (p >= Math.ceil((cantidad||0)/100) || registros.length < 100) break;
          p++;
        }
      }

      setResultados(todos);
      setFiltrarPorDistancia(false);
      setDistanciaMax(10);
    } catch(e) {
      console.error('buscarSintoma error:', e);
    } finally {
      setLoading(false);
    }
  }, [depSel, provSel, distCod]);

  const cambiarVariante = useCallback(v=>{setVarianteActiva(v);buscarPrecios(v,depSel,provSel,distCod);},[depSel,provSel,distCod,buscarPrecios]);
  const aplicarFiltro = ()=>{if(varianteActiva)buscarPrecios(varianteActiva,depSel,provSel,distCod);};

  // Coordenadas aproximadas por ubigeo para calcular distancia
  // Cache de geocodificación para no repetir llamadas
  const geocacheRef = useRef({});

  // Geocodificar dirección real via Nominatim (gratis, sin API key)
  const geocodificarDireccion = useCallback(async (direccion, distrito) => {
    const key = `${direccion}_${distrito}`;
    if (geocacheRef.current[key] !== undefined) return geocacheRef.current[key];
    geocacheRef.current[key] = null; // marcar como en proceso
    try {
      const q = encodeURIComponent(`${direccion.split(',')[0]}, ${distrito || ''}, Lima, Peru`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=pe`,
        { headers: { 'User-Agent': 'MediSinas/1.0 info@medisinas.com' } });
      const data = await res.json();
      if (data[0]) {
        const coords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        geocacheRef.current[key] = coords;
        return coords;
      }
    } catch(e) {}
    geocacheRef.current[key] = null;
    return null;
  }, []);

  // Distancias calculadas para los resultados actuales
  const [distancias, setDistancias] = useState({});

  // Geocodificar los primeros 30 resultados cuando llegan
  useEffect(() => {
    if (!geoPos || !resultados.length) { setDistancias({}); return; }
    setDistancias({});
    const calcular = async () => {
      const primeros = resultados.slice(0, 30);
      const nuevas = {};
      await Promise.all(primeros.map(async (r, i) => {
        const coords = await geocodificarDireccion(r.direccion, r.distrito);
        if (coords) {
          const dist = calcularDistancia(geoPos.lat, geoPos.lon, coords.lat, coords.lon);
          nuevas[r.codEstab + '_' + i] = dist;
        }
      }));
      setDistancias(prev => ({ ...prev, ...nuevas }));
    };
    calcular();
  }, [resultados, geoPos, geocodificarDireccion]);

  const getDistancia = (r, i) => distancias[r.codEstab + '_' + i] ?? null;

  // Detectar genérico equivalente
  const detectarGenerico = () => {
    if (!varianteActiva || !busquedaActiva) return null;
    const nombre = varianteActiva.nombreProducto?.toUpperCase();
    const sustancia = resultados[0]?.nombreSustancia?.toUpperCase();
    if (!sustancia || !nombre) return null;
    // Si el nombre del producto es diferente a la sustancia activa, hay versión genérica
    if (nombre !== sustancia && !nombre.startsWith(sustancia?.split(' ')[0]||'')) {
      const genericoMasBarato = resultados.filter(r =>
        r.nombreProducto?.toUpperCase().includes(sustancia?.split(' ')[0]||'')
      ).sort((a,b)=>(a.precio2||a.precio1||999)-(b.precio2||b.precio1||999))[0];
      if (genericoMasBarato) {
        const pGen = genericoMasBarato.precio2 || genericoMasBarato.precio1;
        const pMarca = Math.min(...resultados.map(r=>r.precio2||r.precio1||999).filter(p=>p>0));
        if (pGen && pGen < pMarca * 0.7) {
          return { producto: genericoMasBarato, precio: pGen, sustancia };
        }
      }
    }
    return null;
  };

  // Filtrar y ordenar
  let filtrados = resultados.filter((r, i) => {
    if (soloGenerico && r.catCodigo!=='04'&&r.catCodigo!=='06') return false;
    if (soloPublico && r.setcodigo!=='Público') return false;
    if (filtrarPorDistancia && geoPos) {
      const dist = getDistancia(r, i);
      // Si aún no tenemos distancia calculada (geocoding en curso), no filtrar
      if (dist !== null && dist > distanciaMax) return false;
    }
    return true;
  });

  filtrados = [...filtrados].sort((a,b)=>{
    if (sortBy==='precio') return (a.precio2||a.precio1||999)-(b.precio2||b.precio1||999);
    if (sortBy==='distancia' && geoPos) {
      const ia = resultados.indexOf(a), ib = resultados.indexOf(b);
      const da = getDistancia(a, ia) ?? 999;
      const db = getDistancia(b, ib) ?? 999;
      return da - db;
    }
    return (a.nombreComercial||'').localeCompare(b.nombreComercial||'');
  });

  const precios=filtrados.map(r=>r.precio2||r.precio1||0).filter(p=>p>0);
  const minP=precios.length?Math.min(...precios):null;
  const maxP=precios.length?Math.max(...precios):null;
  const farmaciasText=totalFarmacias?`${totalFarmacias} farmacias`:'más de 30,000 farmacias';
  const generico=detectarGenerico();
  const bestResult=filtrados[0];

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* Header */}
        <header className="header">
          <Logo />
          <nav className="header-nav">
            <a href="#">Medicamentos</a>
            <a href="#">Farmacias</a>
            <a href="#">Acerca</a>
          </nav>
          <div className="header-right" style={{display:'flex',alignItems:'center',gap:'14px'}}>
            <div className="live-badge"><div className="live-dot"/>Precios en vivo</div>
            <MisMedicamentosBtn user={user} onClick={() => setMismedOpen(true)} />
            <AuthButton user={user} onOpen={() => setAuthOpen(true)} onProfileOpen={() => setProfileOpen(true)} />
          </div>
        </header>

        {/* Subheader */}
        <div className="subheader">
          <a href="#">🏠 Inicio</a>
          <a href="#">💊 Medicamentos</a>
          <a href="#">🏥 Farmacias públicas</a>
          <a href="#">📊 Comparar precios</a>
          <a href="#">❓ Ayuda</a>
        </div>

        {/* Hero */}
        <div className="hero">
          <div className="hero-inner">
            <div className="hero-left">
              <div className="hero-tag">🇵🇪 {farmaciasText} · Datos DIGEMID</div>
              <h1 className="hero-title">Compara precios de<br/>medicamentos en<br/><span>todo el Perú</span></h1>
              <p className="hero-tagline">Sí, puedes vivir mejor gastando menos</p>
              <p className="hero-sub"><strong>{farmaciasText} verificadas</strong> · Datos oficiales MINSA actualizados al instante.</p>

              {/* Banner geolocalización */}
              {geoStatus === 'idle' && (
                <div className="geo-banner" onClick={()=>solicitarGeo(false)}>
                  <span style={{fontSize:20}}>📍</span>
                  <div className="geo-banner-text">¿Quieres ver las farmacias más cercanas a ti?</div>
                  <div className="geo-banner-btn">Usar mi ubicación</div>
                </div>
              )}
              {geoStatus === 'loading' && (
                <div className="geo-banner">
                  <span style={{fontSize:20}}>⏳</span>
                  <div className="geo-banner-text">Detectando tu ubicación...</div>
                </div>
              )}
              {geoStatus === 'active' && (
                <div className="geo-banner geo-active">
                  <span style={{fontSize:20}}>✅</span>
                  <div className="geo-banner-text">Ubicación activa — mostrando farmacias cercanas · Distrito detectado: <strong>{distSel}</strong></div>
                </div>
              )}
              {geoStatus === 'denied' && (
                <div className="geo-banner" style={{borderColor:'rgba(255,100,100,0.4)'}}>
                  <span style={{fontSize:20}}>📍</span>
                  <div className="geo-banner-text" style={{color:'rgba(255,200,200,0.8)'}}>Ubicación no disponible — selecciona tu distrito manualmente</div>
                </div>
              )}

              {/* Buscador */}
              <div className="search-wrap">
                <input className="search-input" type="text"
                  placeholder="¿Qué medicamento o síntoma buscas? Ej: omeprazol, dolor de cabeza..."
                  value={query} onChange={handleQueryChange}
                  onKeyDown={e=>{if(e.key==='Escape'){ setSugerencias([]); setSintomaDetectado(null); }}}
                  onFocus={()=>{ if(busquedaActiva){ setQuery(''); setQueryUsuario(''); setSugerencias([]); } }}
                  autoComplete="off"/>
                <button className="search-btn"
                  onMouseDown={e=>e.preventDefault()}
                  onClick={()=>{ setSugerencias([]); setSintomaDetectado(null); }}>🔍</button>

                {/* Botón guardar — aparece cuando hay variante seleccionada */}
                {varianteActiva && (
                  <button
                    onMouseDown={e=>e.preventDefault()}
                    onClick={() => handleGuardarMed(varianteActiva)}
                    style={{
                      position:'absolute', right:56, top:'50%', transform:'translateY(-50%)',
                      background:'#E8F7F3', border:'1.5px solid #0A7B5E', borderRadius:8,
                      color:'#0A7B5E', fontSize:12, fontWeight:700, padding:'5px 10px',
                      cursor:'pointer', whiteSpace:'nowrap', zIndex:10,
                    }}
                    title="Guardar este medicamento en mi lista"
                  >
                    💊 Guardar
                  </button>
                )}

                {/* Autocomplete */}
                {(sugerencias.length > 0 || (sintomaDetectado && query.length >= 3)) && (
                  <div className="autocomplete">
                    {sintomaDetectado && (
                      <>
                        <div className="autocomplete-section">
                          🩺 Medicamentos comunes para: {sintomaDetectado.sintoma}
                        </div>
                        <div style={{padding:'8px 16px',fontSize:'11px',color:'#92400E',background:'#FEF3C7',borderBottom:'1px solid #FDE68A',lineHeight:'1.5',textAlign:'left'}}>
                          ⚠️ Solo orientativo. No reemplaza la consulta médica. Consulta con tu médico o farmacéutico antes de automedicarte.
                        </div>
                        {sintomaDetectado.medicamentos.map((med,i) => (
                          <div key={i} className="autocomplete-item"
                            onMouseDown={e=>e.preventDefault()}
                            onClick={async ()=>{
                              // Poner el nombre en el buscador y buscar variantes en DIGEMID
                              setQuery(med); setQueryUsuario(med);
                              setSintomaDetectado(null); setBusquedaEsSintoma(true);
                              // Buscar variantes reales en DIGEMID y mostrarlas en el autocomplete
                              try {
                                const vars = await buscarVariantes(med);
                                if (vars && vars.length > 0) {
                                  const seen = new Set();
                                  const unique = vars.filter(v => {
                                    const k = `${v.grupo}_${v.codGrupoFF}_${v.concent}`;
                                    if (seen.has(k)) return false; seen.add(k); return true;
                                  });
                                  const fb = ['TABLETA','CAPSULA','COMPRIMIDO','GRAGEA'];
                                  const ord = [...unique].sort((a,b) => {
                                    const av = fb.some(f=>a.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 0 : 1;
                                    const bv = fb.some(f=>b.nombreFormaFarmaceutica?.toUpperCase().includes(f)) ? 0 : 1;
                                    if (av !== bv) return av - bv;
                                    return (parseFloat((a.concent||'0').replace(',','.'))||0) - (parseFloat((b.concent||'0').replace(',','.'))||0);
                                  });
                                  setSugerencias(ord.slice(0, 10));
                                }
                              } catch(e) {}
                            }}>
                            <span style={{fontSize:16,flexShrink:0}}>🌿</span>
                            <div style={{flex:1,textAlign:'left'}}>
                              <div className="ac-name">{med}</div>
                              <div className="ac-detail">Toca para ver opciones disponibles</div>
                            </div>
                            <span style={{fontSize:'9px',fontWeight:'800',padding:'2px 6px',borderRadius:'4px',background:'#E8F8F3',color:'#00A878',textTransform:'uppercase',flexShrink:0,whiteSpace:'nowrap'}}>ver precio</span>
                          </div>
                        ))}
                        {sugerencias.length > 0 && <div className="autocomplete-section">🔍 También encontramos: "{query}"</div>}
                      </>
                    )}
                    {!sintomaDetectado && sugerencias.length > 0 && (
                      <div className="autocomplete-header">💡 Opciones más económicas primero</div>
                    )}
                    {sugerencias.map((v,i) => {
                      const esBarato=['TABLETA','CAPSULA','COMPRIMIDO','GRAGEA'].some(f=>v.nombreFormaFarmaceutica?.toUpperCase().includes(f));
                      return (
                        <div key={i} className="autocomplete-item"
                          onMouseDown={e=>e.preventDefault()}
                          onClick={()=>seleccionarVariante(v)}>
                          <span style={{fontSize:16,flexShrink:0}}>💊</span>
                          <div style={{flex:1,textAlign:'left'}}>
                            <div className="ac-name">{v.nombreProducto}</div>
                            <div className="ac-detail">{v.concent} · {v.nombreFormaFarmaceutica}</div>
                          </div>
                          {esBarato&&i<3&&<span style={{fontSize:'9px',fontWeight:'800',padding:'2px 6px',borderRadius:'4px',background:'#E8F8F3',color:'#00A878',whiteSpace:'nowrap',textTransform:'uppercase',flexShrink:0}}>+ económico</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Hero card */}
            {!busquedaActiva && (
              <div className="hero-card">
                <div className="hero-card-tag">⭐ Ejemplo · Mejor precio Lima</div>
                <div className="hero-card-name">Hospital Casimiro Ulloa</div>
                <div className="hero-card-badges">
                  <span className="badge badge-pub">Público</span>
                  <span className="badge badge-tipo">Tableta</span>
                </div>
                <div className="hero-card-price-label">Omeprazol 20mg · por unidad</div>
                <div className="hero-card-price">S/ 0.09</div>
                <div className="hero-card-addr">📍 Av. República de Panamá 6355, Miraflores<br/>🗓 29/04/2026 · Fuente: DIGEMID</div>
                <div className="hero-card-btns">
                  <button className="hc-btn-p">📍 Cómo llegar</button>
                  <button className="hc-btn-s">📞 Llamar</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        {!loading && filtrados.length > 0 && (
          <div className="stats-bar">
            <div className="stats-inner">
              <div className="stat-item"><div className="stat-val green">S/ {minP?.toFixed(2)}</div><div className="stat-label">Precio mínimo</div></div>
              <div className="stat-item"><div className="stat-val">S/ {maxP?.toFixed(2)}</div><div className="stat-label">Precio máximo</div></div>
              <div className="stat-item"><div className="stat-val red">S/ {(maxP-minP)?.toFixed(2)}</div><div className="stat-label">Puedes ahorrar</div></div>
              <div className="stat-item"><div className="stat-val">{filtrados.length}</div><div className="stat-label">Farmacias</div></div>
            </div>
          </div>
        )}

        {/* Main */}
        <div className="main">

          {/* Historial */}
          {!busquedaActiva && historial.length > 0 && (
            <div className="historial-section">
              <div className="historial-title">🕐 Búsquedas recientes</div>
              <div className="historial-items">
                {historial.map((h,i) => (
                  <div key={i} className="historial-item" onClick={()=>seleccionarVariante(h)}>
                    <span>💊</span>
                    <span>{h.nombreProducto} {h.concent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Lista / Mapa */}
          {busquedaActiva && filtrados.length > 0 && (
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
              <ToggleVistaBtn vista={vista} onChange={setVista}/>
            </div>
          )}

          {/* Vista Mapa */}
          {busquedaActiva && vista === 'mapa' && filtrados.length > 0 && (
            <MapaFarmacias
              resultados={filtrados}
              geocacheRef={geocacheRef}
              geoPos={geoPos}
              varianteActiva={varianteActiva}
            />
          )}

          {/* Modo rápido toggle */}
          {busquedaActiva && filtrados.length > 0 && vista === 'lista' && (
            <div className="modo-rapido-bar" onClick={()=>setModoRapido(!modoRapido)}>
              <div>
                <div className="modo-rapido-label">⚡ Modo rápido</div>
                <div className="modo-rapido-sub">Ver solo el precio más bajo — sin comparar</div>
              </div>
              <div className={`toggle ${modoRapido?'on':''}`}/>
            </div>
          )}

          {/* Modo rápido — best result */}
          {modoRapido && bestResult && (() => {
            const precio=bestResult.precio2||bestResult.precio1||bestResult.precio3;
            const ecommerce=getEcommerceUrl(bestResult.nombreComercial);
            return (
              <div className="card-rapida">
                <div className="rapida-header">⭐ El precio más bajo encontrado</div>
                <div className="rapida-grid">
                  <div>
                    <div className="rapida-name">{bestResult.nombreComercial}</div>
                    <div className="rapida-info">
                      📍 {bestResult.direccion}{bestResult.distrito?`, ${bestResult.distrito}`:''}<br/>
                      {bestResult.telefono&&<>📞 {bestResult.telefono}<br/></>}
                      🗓 {bestResult.fecha?.split(' ')[0]} · 🔬 {bestResult.nombreSustancia}
                    </div>
                    <div className="rapida-btns">
                      <button className="btn-primary" onClick={()=>setMapSheet(bestResult.direccion+(bestResult.distrito?`, ${bestResult.distrito}`:''))}>📍 Cómo llegar</button>
                      {bestResult.telefono&&<a href={`tel:${bestResult.telefono}`} className="btn-secondary">📞 {bestResult.telefono}</a>}
                      {ecommerce&&queryUsuario&&(()=>{
                        const lc=ecommerce.buildUrl(queryUsuario);
                        const valido=lc&&!lc.endsWith('=')&&!lc.endsWith('keyword=')&&!lc.endsWith('q=');
                        return valido ? <a href={lc} target="_blank" rel="noreferrer" className="btn-ecommerce" style={{background:ecommerce.color,color:ecommerce.textColor}}>🛒 {ecommerce.label}</a> : null;
                      })()}
                      <button className="btn-whatsapp" onClick={()=>{
                        const lc=ecommerce&&queryUsuario?ecommerce.buildUrl(queryUsuario):null;
                        const valido=lc&&!lc.endsWith('=')&&!lc.endsWith('keyword=');
                        compartirWhatsApp(bestResult.nombreComercial,parseFloat(precio).toFixed(2),varianteActiva?.nombreProducto,bestResult.distrito,bestResult.direccion,bestResult.telefono,valido?lc:null,ecommerce?.nombreCadena,geoPos);
                      }}>📲 Compartir por WhatsApp</button>
                    </div>
                  </div>
                  <div>
                    <div className="rapida-price-label">{bestResult.precio2?'por unidad':'precio caja'}</div>
                    <div className="rapida-price">S/ {parseFloat(precio).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Ubicación */}
          {!modoRapido && (
            <div className="location-filters">
              <span className="location-label">📍 Ubicación</span>
              <select className="loc-select" value={depSel} onChange={e=>handleDepChange(e.target.value)}>
                {departamentos.map(d=><option key={d}>{d}</option>)}
              </select>
              <select className="loc-select" value={provSel} onChange={e=>handleProvChange(e.target.value)}>
                {provincias.map(p=><option key={p}>{p}</option>)}
              </select>
              <select className="loc-select" value={distSel} onChange={e=>handleDistChange(e.target.value)}>
                {distritos.map(d=><option key={d}>{d}</option>)}
              </select>
              {busquedaActiva&&<button className="btn-buscar" onClick={aplicarFiltro}>Buscar aquí</button>}
              {geoStatus==='active'&&<div className="geo-indicator">📍 GPS activo</div>}
            </div>
          )}

          {/* Filtro distancia — slider directo sin checkbox */}
          {geoStatus==='active' && busquedaActiva && !modoRapido && (
            <div className="distance-control">
              <span className="distance-label">📍 Radio de búsqueda</span>
              <input type="range" className="distance-slider" min="0.5" max="10" step="0.5"
                value={distanciaMax}
                onChange={e=>{setDistanciaMax(Number(e.target.value)); setFiltrarPorDistancia(Number(e.target.value)<10);}}/>
              <div className="distance-value">{distanciaMax>=10?'Sin límite':`≤ ${distanciaMax} km`}</div>
            </div>
          )}

          {/* Aviso todos Lima */}
          {busquedaActiva && distSel==='Todos los distritos' && !modoRapido && (
            <div className="warning">
              <span>⚠️</span>
              <span>Mostrando todo el departamento de Lima. Selecciona un distrito para resultados más precisos y cercanos.</span>
            </div>
          )}

          {/* Variant tabs */}
          {!modoRapido && variantes.length>1 && (
            <div className="variant-tabs">
              {variantes.map((v,i)=>(
                <button key={i} className={`variant-tab ${varianteActiva?.grupo===v.grupo&&varianteActiva?.codGrupoFF===v.codGrupoFF&&varianteActiva?.concent===v.concent?'active':''}`}
                  onClick={()=>cambiarVariante(v)}>{v.concent} · {v.nombreFormaFarmaceutica}</button>
              ))}
            </div>
          )}

          {/* Banner genérico */}
          {!modoRapido && generico && (
            <div className="generico-banner">
              <div className="generico-icon">💡</div>
              <div className="generico-text">
                <div className="generico-title">Versión genérica disponible — más económica</div>
                <div className="generico-desc">
                  <strong>{generico.producto.nombreProducto}</strong> ({generico.sustancia}) desde <strong>S/ {parseFloat(generico.precio).toFixed(2)}</strong> · Mismo principio activo, diferente marca
                </div>
              </div>
              <button className="generico-btn" onClick={()=>seleccionarVariante(generico.producto)}>Ver genérico</button>
            </div>
          )}

          {/* Disclaimer síntoma — cuando la búsqueda vino de síntoma */}
          {busquedaActiva && !modoRapido && busquedaEsSintoma && filtrados.length > 0 && (
            <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'8px',padding:'10px 14px',marginBottom:'12px',fontSize:'12px',color:'#92400E',lineHeight:'1.5',display:'flex',gap:'8px',alignItems:'flex-start'}}>
              <span style={{flexShrink:0}}>⚕️</span>
              <span>{DISCLAIMER_SINTOMA}</span>
            </div>
          )}

          {/* Filtros */}
          {!modoRapido && busquedaActiva && (
            <div className="filters-row">
              <select className="filter-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="precio">Menor precio</option>
                {geoStatus==='active'&&<option value="distancia">Más cercano</option>}
                <option value="nombre">Farmacia A-Z</option>
              </select>
              <button className={`filter-chip ${soloGenerico?'active':''}`} onClick={()=>setSoloGenerico(!soloGenerico)}>Genérico</button>
              <button className={`filter-chip ${soloPublico?'active':''}`} onClick={()=>setSoloPublico(!soloPublico)}>Solo público</button>
              {!loading&&<span className="results-count">{filtrados.length} resultados</span>}
            </div>
          )}

          {/* Loading */}
          {loading&&(
            <div className="loading">
              <div className="spinner"/>
              <div className="loading-text">Consultando precios en tiempo real...</div>
              <div style={{fontSize:'13px',color:'var(--dim)'}}>Buscando en {farmaciasText}</div>
            </div>
          )}

          {/* Resultados completos */}
          {!loading && !modoRapido && filtrados.length>0 && (
            <div className="results">
              {filtrados.map((r,i)=>{
                const precioUnidad=r.precio2||null;
                const precioCaja=r.precio1||null;
                const precioMostrar=precioUnidad||precioCaja||r.precio3;
                const isBest=precioMostrar===minP;
                const isPublico=r.setcodigo==='Público';
                const ecommerce=getEcommerceUrl(r.nombreComercial);
                const tieneMulti=precioCaja&&precioUnidad&&precioCaja!==precioUnidad;
                // Usar índice original en resultados para distancia geocodificada
                const idxOriginal = resultados.indexOf(r);
                const distKm = getDistancia(r, idxOriginal);
                // Link de compra — usar queryUsuario que tiene el término buscado
                const linkCompra = ecommerce && queryUsuario ? ecommerce.buildUrl(queryUsuario) : null;
                return (
                  <div key={i} className={`card ${isBest?'best':''}`}>
                    <div>
                      {isBest&&<div className="best-tag">⭐ Mejor precio</div>}
                      <div className="card-name">{r.nombreComercial||r.codEstab}</div>
                      <div className="card-badges">
                        {isPublico?<span className="badge badge-pub">Público</span>:<span className="badge badge-priv">Privado</span>}
                        <span className="badge badge-tipo">{r.nomGrupoFF}</span>
                        <span className="badge badge-dist">{r.concent}</span>
                        {r.distrito&&<span className="badge badge-dist">{r.distrito}</span>}
                        {distKm!==null&&<span className="badge badge-dist-km">📍 {distKm.toFixed(1)} km</span>}
                        {ecommerce&&<span className="badge badge-online">🛒 Online</span>}
                      </div>
                      <div className="card-addr">📍 {r.direccion}</div>
                      <div className="card-meta">
                        {r.fecha&&<span>🗓 {r.fecha.split(' ')[0]}</span>}
                        {r.nombreSustancia&&<span>🔬 {r.nombreSustancia}</span>}
                        {r.fracciones&&tieneMulti&&<span>📦 Caja: {r.fracciones}u</span>}
                      </div>
                    </div>
                    <div className="price-section">
                      <div className="price-unit-label">{precioUnidad?'por unidad':'precio caja'}</div>
                      <div className="price">S/ {parseFloat(precioMostrar).toFixed(2)}</div>
                      {tieneMulti&&<div className="price-caja">Caja ({r.fracciones}u): S/ {parseFloat(precioCaja).toFixed(2)}</div>}
                      <div className="btn-group">
                        <button className="btn-primary" onClick={()=>{setMapSheet(r.direccion+(r.distrito?`, ${r.distrito}`:''));trackEvent('click_directions',{farmacia:r.nombreComercial});}}>📍 Cómo llegar</button>
                        {r.telefono&&<a href={`tel:${r.telefono}`} className="btn-secondary" onClick={()=>trackEvent('click_phone',{farmacia:r.nombreComercial})}>📞 {r.telefono}</a>}
                        <button className="btn-whatsapp" onClick={()=>compartirWhatsApp(r.nombreComercial,parseFloat(precioMostrar).toFixed(2),varianteActiva?.nombreProducto,r.distrito,r.direccion,r.telefono,linkCompra,ecommerce?.nombreCadena,geoPos)}>📲 Compartir precio</button>
                        <AlertaBtn
                          activa={alertasActivas.has(`${varianteActiva?.grupo}_${varianteActiva?.codGrupoFF}_${varianteActiva?.concent}`)}
                          onClick={()=>{
                            if(!user){setAuthOpen(true);return;}
                            setAlertaData({variante:varianteActiva,precioActual:parseFloat(precioMostrar),distrito:r.distrito||distActual||null});
                          }}
                        />
                        {linkCompra&&<a href={linkCompra} target="_blank" rel="noreferrer" className="btn-ecommerce" style={{background:ecommerce.color,color:ecommerce.textColor}} onClick={()=>trackEvent('click_ecommerce',{farmacia:r.nombreComercial,cadena:ecommerce.nombreCadena,termino:queryUsuario})}>🛒 {ecommerce.label}</a>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sin resultados */}
          {!loading&&busquedaActiva&&filtrados.length===0&&resultados.length===0&&(
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">Sin resultados en esta zona</div>
              <div className="empty-text">Prueba seleccionando "Todos los distritos" o una provincia diferente</div>
            </div>
          )}

          {/* Estado inicial */}
          {!busquedaActiva&&!loading&&historial.length===0&&(
            <div className="empty">
              <div className="empty-icon">💊</div>
              <div className="empty-title">Busca tu medicamento</div>
              <div className="empty-text">Escribe el nombre o síntoma arriba y compara precios en {farmaciasText}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <div>
              <div className="footer-brand">Medi<span className="si">Si</span>nas</div>
              <div className="footer-tagline">Sí, puedes vivir mejor gastando menos</div>
              <div className="footer-email"><a href="mailto:info@medisinas.com">✉️ info@medisinas.com</a></div>
              <div className="footer-version">v1.2.0 · Mayo 2026</div>
            </div>
            <div>
              <div className="footer-col-title">Información</div>
              <a className="footer-link" href="mailto:info@medisinas.com?subject=Publicidad en MediSinas">📢 Publicidad</a>
              <a className="footer-link" href="mailto:info@medisinas.com?subject=Sugerencia para MediSinas">💡 Sugerencias</a>
              <a className="footer-link" href="mailto:info@medisinas.com?subject=Ayuda MediSinas">❓ Ayuda</a>
            </div>
            <div>
              <div className="footer-legal">Los precios provienen del Observatorio de Precios de Medicamentos del MINSA (DIGEMID). MediSinas no vende medicamentos ni tiene acuerdos comerciales con farmacias.<br/><br/>🏥 Datos: DIGEMID — Ministerio de Salud del Perú · © {new Date().getFullYear()} MediSinas</div>
            </div>
          </div>
        </footer>

        {mapSheet&&<MapSheet direccion={mapSheet} onClose={()=>setMapSheet(null)} geoPos={geoPos}/>}
        <MisMedicamentosPanel
          user={user}
          open={mismedOpen}
          onClose={() => setMismedOpen(false)}
          onBuscar={(med) => seleccionarVariante(med)}
        />
        <AlertaModal
          open={!!alertaData}
          onClose={() => setAlertaData(null)}
          variante={alertaData?.variante}
          precioActual={alertaData?.precioActual}
          distrito={alertaData?.distrito}
          user={user}
          onSuccess={() => {
            if (alertaData?.variante) {
              const key = `${alertaData.variante.grupo}_${alertaData.variante.codGrupoFF}_${alertaData.variante.concent}`;
              setAlertasActivas(prev => new Set([...prev, key]));
            }
            setAlertaData(null);
          }}
        />
        <ProfileSheet
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
          onSignOut={() => { signOut(); setProfileOpen(false); }}
          onMisMeds={() => { setProfileOpen(false); setMismedOpen(true); }}
        />
        <GuardarMedModal
          open={!!guardarData}
          onClose={() => setGuardarData(null)}
          variante={guardarData}
          user={user}
          onSuccess={() => {
            if (guardarData) {
              setSavedIds(prev => new Set([...prev, `${guardarData.grupo}_${guardarData.codGrupoFF}_${guardarData.concent}`]));
            }
            setGuardarData(null);
          }}
        />
        <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onSuccess={(u)=>{ signIn(u); setAuthOpen(false); }} />
      </div>
    </>
  );
}// force 1779768582
