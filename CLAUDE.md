# MediSinas — Contexto para Claude Code

## Proyecto
Comparador de precios de medicamentos en Perú usando datos oficiales DIGEMID/MINSA.
- **Dominio:** medisinas.com
- **Repo:** franciscobarrientos64/medisinas
- **Vercel proyecto:** farmacompara-v2
- **Supabase:** jmkvphayyhwzootlybde (cuenta: franciscobarrientos64@gmail.com)

## Stack
- **Frontend:** React CRA (Create React App) — NO es Vite
- **Build output:** `/build` (NO `/dist`)
- **APIs:** Vercel Serverless Functions en `/api/*.js` (CommonJS, `module.exports`)
- **Base de datos:** Supabase PostgreSQL
- **Storage:** Supabase Storage (bucket `recetas-medicas`, privado)
- **Deploy:** GitHub → Vercel auto-deploy en cada push a `main`
- **Email:** Resend (dominio medisinas.com verificado)
- **SMS/WhatsApp:** Twilio Sandbox
- **Mapas:** Leaflet + Carto Light tiles + Nominatim geocoding

## Deploy — flujo de trabajo

```bash
# 1. Hacer cambios en el código
# 2. Commit y push — Vercel despliega automáticamente
git add -A
git commit -m "descripción del cambio"
git push origin main
# Build tarda ~60 segundos en Vercel
```

**IMPORTANTE:** El repo debe tener el token embebido:
```bash
git remote set-url origin https://TOKEN@github.com/franciscobarrientos64/medisinas.git
```

## Variables de entorno (Vercel farmacompara-v2)

```
# ⚠️ No commitear valores reales — usar Vercel dashboard para gestionar secrets
SUPABASE_URL=https://jmkvphayyhwzootlybde.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...  (service role key)
REACT_APP_SUPABASE_URL=https://jmkvphayyhwzootlybde.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...  (anon key)
TWILIO_ACCOUNT_SID=AC_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN_VALUE
TWILIO_WHATSAPP_FROM=whatsapp:+1XXXXXXXXXX
RESEND_API_KEY=re_...
CRON_SECRET=CRON_SECRET_VALUE
FB_APP_ID=FB_APP_ID_VALUE
FB_APP_SECRET=FB_APP_SECRET_VALUE
```

## Estructura del proyecto

```
medisinas/
├── public/
│   └── index.html              # Requerido por CRA
├── src/
│   ├── App.jsx                 # Componente principal — buscador, resultados, filtros
│   ├── UserAuth.jsx            # Auth OTP WhatsApp + Google OAuth + ProfileSheet
│   ├── MisMedicamentos.jsx     # Panel de medicamentos guardados
│   ├── GuardarMedModal.jsx     # Modal guardar med — fecha, dosis, unidades
│   ├── AlertaModal.jsx         # Modal alerta de precio
│   ├── RecetasPanel.jsx        # Panel recetas médicas — foto, periodicidad
│   ├── MapaFarmacias.jsx       # Mapa Leaflet con geocoding server-side
│   ├── HorarioBadge.jsx        # Badge abierto/cerrado/24h
│   ├── horarios.js             # Lógica de horarios por cadena (compartida)
│   └── ubigeos.js / utils.js
├── api/
│   ├── digemid.js              # Proxy DIGEMID con retry
│   ├── send-otp.js             # Envía OTP por WhatsApp (Twilio)
│   ├── verify-otp.js           # Verifica OTP, crea usuario
│   ├── update-profile.js       # Actualiza perfil usuario
│   ├── save-medicamento.js     # Guarda medicamento con frecuencia
│   ├── get-medicamentos.js     # Lista medicamentos del usuario
│   ├── delete-medicamento.js   # Elimina (soft delete) medicamento
│   ├── compre-hoy.js           # Registra compra, calcula próxima fecha
│   ├── save-alerta.js          # Guarda alerta de precio
│   ├── cron-alertas.js         # Cron 8am Lima — verifica precios, envía email
│   ├── save-receta.js          # Guarda receta médica
│   ├── get-recetas.js          # Lista recetas del usuario
│   ├── horario-farmacia.js     # Horarios vía Facebook Graph API + caché
│   ├── geocode.js              # Geocoding server-side con caché Supabase
│   ├── get-personas.js         # Lista personas a cargo (auto-crea titular)
│   ├── save-persona.js         # Crea/actualiza persona (perfil familiar)
│   ├── delete-persona.js       # Soft delete persona (no borra titular)
│   ├── registrar-busqueda.js   # Registra ahorro + snapshot de precio tras cada búsqueda
│   ├── get-ahorros.js          # Acumulados de ahorro (real/potencial, por persona)
│   ├── confirmar-compra.js     # Marca ahorro como real al confirmar compra
│   └── historial-precios.js    # Evolución de precios de un producto (gráfico)
└── vercel.json                 # outputDirectory: build, crons config
```

## Tablas Supabase

```sql
usuarios            — id, telefono, nombre, apellido, anio_nacimiento, genero, email
otp_codes           — phone, code, expires_at
medicamentos_usuario — usuario_id, nombre_producto, concent, forma_farmaceutica,
                       grupo, cod_grupo_ff, frecuencia_dias, cantidad_unidades,
                       ultima_compra, activo
alertas_precio      — usuario_id, nombre_producto, concent, grupo, cod_grupo_ff,
                      precio_objetivo, distrito, activa, ultima_notificacion
recetas_medicas     — usuario_id, persona_id, foto_url, foto_path, medicamentos[],
                      doctor_nombre, especialidad, fecha_emision, fecha_vencimiento,
                      diagnostico, periodicidad, cantidad_por_periodo, notas, activa
personas            — usuario_id, nombre, parentesco, genero, anio_nacimiento,
                      condiciones[], alergias[], color, es_titular, activo (perfiles familiares)
ahorros             — usuario_id, persona_id, nombre_producto, concent, grupo, cod_grupo_ff,
                      distrito, precio_min, precio_max, num_farmacias, ahorro_potencial,
                      ahorro_real, comprado, precio_pagado (ahorro por búsqueda)
historial_precios   — nombre_producto, concent, grupo, cod_grupo_ff, distrito, fecha,
                      precio_min, precio_max, precio_promedio, num_farmacias (1/producto/distrito/día)
pharmacy_hours      — nombre_comercial, distrito, facebook_page_id, hours,
                      is_24h, abierto_ahora, hora_apertura, hora_cierre, last_updated
geocoding_cache     — direccion, distrito, lat, lon (caché Nominatim → Supabase)
work_sessions       — project_id, session_date, horas, fase, descripcion (Alfred)
project_costs       — project_id, phase_number, categoria, item, costo_usd (Alfred)
```

## Features activos en producción

### Auth
- **WhatsApp OTP 6 dígitos** — Twilio Sandbox (`join interest-before` → +14155238886)
- **Google OAuth** — Supabase Auth + credenciales Google Cloud
- **Apple OAuth** — pendiente (Apple Developer en proceso)
- Perfil: nombre, apellido, año nacimiento, género (obligatorios) + email (opcional)
- Menú de perfil: bottom sheet con Mis medicamentos, Mis recetas, Mis alertas, Cerrar sesión

### Búsqueda
- Autocomplete con caché en memoria (5 min) + retry 3 intentos
- Síntomas → medicamentos (lookup table en utils.js)
- Filtros: Menor precio, Genérico, Solo público, 🟢 Abiertas ahora
- Variantes por concentración (chips seleccionables)
- Stats: precio mínimo, máximo, ahorro potencial, número de farmacias

### Mis Medicamentos
- Guardar con: fecha de compra (date picker), dosis/día (1-4x), unidades compradas
- Cálculo automático: días hasta agotarse = unidades ÷ dosis_día
- Recordatorio de recompra con código de color (verde/amarillo/rojo)
- Botón "✅ Compré hoy" para reiniciar el contador
- Botón 💊 Guardar en el buscador (aparece al seleccionar variante)

### Alertas de precio
- Modal con precio objetivo (pre-sugerido 10% menos) y preview de ahorro
- Cron diario 8am Lima (13:00 UTC) → verifica DIGEMID → envía email con Resend
- Template HTML de email: precio actual vs objetivo, nombre farmacia, botón CTA

### Recetas médicas
- Foto (bucket privado `recetas-medicas`, URLs firmadas 1h)
- Campos: medicamentos[], médico, especialidad, diagnóstico, fechas, periodicidad, cantidad
- Periodicidades: única, mensual, trimestral, semestral, anual
- Badge de vencimiento (✅ válida / ⚠️ por vencer / ❌ vencida)

### Mapa
- Toggle Lista/Mapa en los resultados
- Geocoding server-side con caché en Supabase (primera vez lento, luego instantáneo)
- Tiles Carto Light (limpio, moderno)
- Marcadores con precio y código de color por rango
- Popup: nombre, dirección, precio, tipo, teléfono, botón Google Maps

### Horarios
- Heurística por cadena: InkaFarma, MiFarma, Arcángel, Boticas y Salud,
  Farmacia Universal, Superfarma, Fasa, MásFarma, FarmaMinsa, Torres de Limatambo
- Detección 24h por nombre del establecimiento
- Hospitales y establecimientos públicos → siempre 24h
- Filtro "🟢 Abiertas ahora" en resultados

## Cadenas y horarios (heurística)

| Cadena | L-S | Domingo |
|--------|-----|---------|
| InkaFarma / MiFarma | 08:00-22:00 | 08:00-21:00 |
| Arcángel | 08:00-21:00 | 09:00-20:00 |
| Boticas y Salud / BTL | 08:00-22:00 | 08:00-21:00 |
| Farmacia Universal | 07:00-22:00 | 08:00-21:00 |
| Superfarma / Fasa / Más Farma | 08:00-21:00 | 09:00-20:00 |
| FarmaMinsa | 08:00-20:00 | 08:00-14:00 |

## Pendiente (roadmap)

- [ ] Apple OAuth (Apple Developer cuenta en proceso)
- [ ] Meta Business API WhatsApp para alertas (actualmente solo email)
- [ ] Cron recordatorio de recompra (falta agregar a cron-alertas.js)
- [ ] Pantalla Mis Alertas (botón en menú pero sin pantalla)
- [ ] Toggle genéricos en búsqueda
- [ ] SEO: meta tags, sitemap, structured data
- [ ] Google Places API para horarios precisos (requiere presupuesto)
- [ ] Facebook Graph API para horarios (pendiente review de Meta)

## Costeo actual

| Item | Costo | Estado |
|------|-------|--------|
| GitHub Free | $0/mes | Activo |
| Vercel Hobby | $0/mes | Activo |
| Supabase Free | $0/mes | Activo |
| Dominio medisinas.com | ~$20/año | Activo |
| Twilio WhatsApp Sandbox | $0 | Activo (solo números verificados) |
| Resend | $0 (100 emails/día) | Activo |
| **Total mensual** | **$0** | |

## Notas técnicas importantes

1. **CRA no Vite** — `vercel.json` debe tener `"outputDirectory": "build"`
2. **API functions** — CommonJS (`module.exports`), no ESM (`export default`)
3. **Supabase client en frontend** — usar `REACT_APP_SUPABASE_*` (no `VITE_`)
4. **Nominatim** — máximo 1 req/segundo, siempre incluir User-Agent
5. **Geocoding** — bounded=1 + viewbox Lima para evitar matches fuera de la ciudad
6. **Auth** — usuarios en tabla `usuarios` propia (no solo Supabase Auth)
7. **Google OAuth redirect** — `https://jmkvphayyhwzootlybde.supabase.co/auth/v1/callback`
8. **Supabase Site URL** — configurada como `https://medisinas.com`
