# MediSinas — Prompts para Google Stitch (3 direcciones estéticas)

Objetivo: definir la estética del producto en **Google Stitch** de forma que **no se parezca a un desarrollo clásico de IA**, transmitiendo **cercanía, profesionalismo y confianza** para un público de adultos mayores, padres/madres de familia, personas con enfermedades crónicas y sus cuidadores en Perú.

## Cómo usar este documento en Stitch

1. Abre Google Stitch y elige el modo **Mobile** (recomendado empezar por móvil) o **Web/Desktop**.
2. Para cada dirección: **primero pega el bloque "Sistema de Diseño"** como contexto/instrucción de estilo global.
3. Luego genera **una pantalla a la vez** pegando el prompt de pantalla correspondiente (móvil o desktop).
4. Itera con ajustes cortos ("hazlo con más aire", "agranda los precios", etc.).
5. Genera las 3 direcciones y compara con evidencia visual antes de decidir.

## Comparación rápida de las 3 direcciones

| | **1. Futurista / Wellness** | **2. Ilustrado / Calma** | **3. Plano / Minimal** |
|---|---|---|---|
| **Sensación** | Tecnología de bienestar premium, pulcra y luminosa | Humana, cálida, te acompaña, baja la ansiedad | Utilidad pública digna, orden y claridad radical |
| **Color primario** | Teal medicinal `#0E7C66` | Verde petróleo `#0E5A52` + ámbar/terracota | Verde pino `#0B3B3C` + 1 acento terracota |
| **Fondo** | Blanco verdoso `#F4F7F6` | Crema cálido `#FBF6EC` | Hueso cálido `#FBFAF7` |
| **Tipografía** | Bricolage Grotesque + Source Sans 3 | Fraunces (serif) + Public Sans | Fraunces (serif) + Libre Franklin |
| **Recurso clave** | Sombras suaves, spot illustrations lineales | Ilustración a mano con textura, personas peruanas | Líneas finas como ornamento, espacio en blanco |
| **Riesgo** | Puede sentirse "app" para alguien muy mayor | Depende de buena ilustración (la más difícil de clavar) | Mal hecho cae en el look genérico de IA |
| **Mejor si quieres…** | Proyectar innovación y modernidad confiable | Máxima cercanía y calidez emocional | Máxima legibilidad/seriedad, cero distracción |

> Recomendación para A/B con el público objetivo: las direcciones **2 (Calma)** y **3 (Minimal)** suelen rendir mejor en confianza con adultos mayores; la **1 (Wellness)** proyecta más innovación. Genera las tres y prueba.

---

# DIRECCIÓN 1 — Futurista / Tecnología de Wellness

## A. SISTEMA DE DISEÑO (pegar como contexto global en Stitch)

```
CONTEXTO DE MARCA Y SISTEMA DE DISEÑO — MediSinas

Concepto: MediSinas es un comparador de precios de medicamentos en Perú con datos
oficiales DIGEMID/MINSA. La estética es "tecnología de bienestar de gama alta":
limpia, luminosa y precisa, con la calidez de una clínica moderna bien iluminada,
no la frialdad del cyberpunk. Transmite innovación CONFIABLE para un público que
no es tech-savvy —adultos mayores, cuidadores, padres y personas con enfermedades
crónicas—, así que prioriza legibilidad alta, contraste fuerte, jerarquía clarísima
y áreas táctiles grandes. La confianza nace de la pulcritud y la precisión, no de
los efectos.

PALETA DE COLOR (usar exactamente estos HEX):
- Fondo base (lienzo): #F4F7F6  (blanco verdoso muy claro, "aire de clínica", reduce
  el deslumbramiento del blanco puro para ojos mayores).
- Superficie / tarjetas: #FFFFFF con borde sutil #E2E9E7 (1px). Tarjetas opacas, NO
  glassmorphism.
- Primario (marca/acción): #0E7C66  (verde teal medicinal profundo — salud, confianza,
  no es el azul genérico de SaaS). Hover/activo: #0B6353.
- Primario claro (fondos de chip/realce): #D7EFE9.
- Acento secundario (datos/innovación): #1F6FEB tratado con moderación, solo para
  enlaces e indicadores de "dato oficial". Evitar como color dominante.
- Acento cálido (humano/cercanía): #F4A259  (ámbar suave) para destacar ahorro y
  llamadas amables, en dosis pequeñas.
- Texto principal: #102A26  (casi negro verdoso, contraste AAA sobre fondo).
- Texto secundario: #4A5B57.
- Estados: Éxito #1B9E77 / Alerta-precaución #E8A23D / Error #D64545.
  Mapeo de horarios: Abierto=#1B9E77, Cierra pronto=#E8A23D, Cerrado=#D64545,
  24h=#0E7C66.
PROHIBIDO: gradientes morados o violeta, fondos oscuros tipo cyberpunk, blobs
degradados, glassmorphism, sombras de color saturado.

TIPOGRAFÍA (pareja concreta):
- Display / títulos: "Bricolage Grotesque" (geométrica humanista, carácter distintivo
  y moderno, no es Inter). Pesos 600–700. Tracking ligeramente negativo en titulares.
- Cuerpo / UI: "Source Sans 3" (altísima legibilidad, x-height generosa, ideal para
  adultos mayores). Pesos 400/600.
- Números/precios destacados: "Bricolage Grotesque" 700 para que los precios canten.
- Tamaños base PENSADOS PARA ADULTOS MAYORES (móvil): cuerpo 17px mínimo, labels 15px,
  títulos de sección 22–26px, H1 de pantalla 30–34px, precio protagonista 34–44px.
  Interlineado 1.5. Nada por debajo de 14px nunca.

FORMA / SUPERFICIE / ESPACIO:
- Radios: tarjetas 20px, botones 14px, chips/badges 999px (píldora), inputs 16px.
- Sombras suaves y neutras (nunca de color): 0 2px 8px rgba(16,42,38,0.06) en reposo,
  0 8px 24px rgba(16,42,38,0.10) en elevación. Sensación "flotación tranquila".
- Bordes hairline #E2E9E7 para separar sin ruido.
- Sistema de espaciado base 8px (4,8,12,16,24,32,48,64). Mucho aire entre bloques.
- Áreas táctiles mínimo 48x48px. Botones primarios altos (56px móvil).

ICONOGRAFÍA E IMÁGENES:
- Iconos de línea redondeada, grosor 2px, estilo "Phosphor / Lucide rounded".
  NUNCA emojis en la UI.
- Ilustración: spot illustrations lineales con relleno plano en la paleta teal/ámbar,
  estilo editorial-médico amable (frascos, pastillas, cápsula, mapa, escudo de datos
  oficiales). Sin stock photos genéricos sonrientes.
- Imagen de confianza: un sello/badge "Datos oficiales DIGEMID · MINSA" con icono de
  escudo, fondo #D7EFE9, texto teal.

MOVIMIENTO / MICROINTERACCIONES:
- Transiciones suaves 200–300ms ease-out; el botón primario eleva 2px y oscurece al
  pulsar; los badges de precio aparecen con un fade+rise sutil.
- El medidor de "días hasta agotarse" anima su barra de color al cargar (verde→ámbar→
  rojo). Respetar prefers-reduced-motion.

TONO DE COPY (español de Perú, cálido y directo):
- Trato de "tú", frases cortas, verbos claros. Ej.: "Busca tu medicina", "Mira dónde
  está más barata", "Te avisamos si baja de precio", "Guárdala y te recordamos".
- Cero jerga. Acompañar siempre los precios con contexto ("Ahorras S/ 12").
```

## B. PROMPTS POR PANTALLA

### 1.1 Home / Buscador — MÓVIL

```
Diseña la pantalla de inicio móvil de MediSinas aplicando el sistema de diseño teal
de wellness. Fondo #F4F7F6.

Top bar mínima: a la izquierda el logo "MediSinas" en Bricolage Grotesque 700 teal
#0E7C66 con un pequeño icono de cápsula de línea; a la derecha un avatar circular de
perfil (48px) con borde hairline.

Sección hero (con generoso aire arriba): título grande en dos líneas, Bricolage
Grotesque 700, 32px, color #102A26: "Encuentra tu medicina al mejor precio". Debajo
un subtítulo en Source Sans 3 17px #4A5B57: "Precios reales de farmacias en todo el
Perú".

Buscador PROTAGONISTA: un input grande (altura 64px, radio 16px, fondo blanco, borde
hairline, sombra suave) con icono de lupa de línea a la izquierda y placeholder
"Busca tu medicina, ej. Paracetamol". Debajo del input, una fila scrollable de chips
píldora con búsquedas frecuentes reales: "Paracetamol 500mg", "Losartán 50mg",
"Metformina 850mg", "Atorvastatina 20mg". Chips fondo #D7EFE9, texto teal.

Sello de confianza justo bajo el buscador: badge horizontal ancho con icono de escudo,
fondo #D7EFE9, texto teal 15px: "Datos oficiales DIGEMID · MINSA".

Accesos rápidos: una grilla de 2x2 de tarjetas blancas (radio 20px, sombra suave,
icono de línea teal arriba, label debajo en Source Sans 3 16px semibold):
"Mis medicinas", "Mis recetas", "Mis alertas", "Farmacias cerca".

Banner inferior cálido (fondo #FFF, borde ámbar sutil, radio 20px): spot illustration
de una alcancía/pastilla a la izquierda y texto "Guarda tus medicinas y te avisamos
cuándo recomprarlas" con un botón texto teal "Empezar".

Nav inferior fijo con 4 iconos de línea redondeada y label de 12px: Inicio (activo,
teal), Buscar, Mis medicinas, Perfil. Barra blanca con sombra superior suave, altura
cómoda, áreas táctiles grandes.
```

### 1.1 Home / Buscador — DESKTOP (qué cambia)

```
Versión desktop del Home de MediSinas, mismo sistema de diseño. Cambios respecto a
móvil:
- Header superior completo horizontal: logo a la izquierda; al centro un menú de texto
  ("Buscar", "Mis medicinas", "Mis recetas", "Mis alertas"); a la derecha el sello
  "Datos oficiales DIGEMID · MINSA" y el avatar de perfil.
- Hero a dos columnas dentro de un contenedor centrado de máx 1200px: columna
  izquierda (60%) con el título grande (Bricolage 700, 48px), subtítulo, el buscador
  ancho de 64px de alto y la fila de chips de medicinas frecuentes. Columna derecha
  (40%) con una spot illustration editorial grande (mapa del Perú estilizado con pines
  de farmacia teal y un frasco de pastillas), sin foto stock.
- Los accesos rápidos pasan de grilla 2x2 a una fila de 4 tarjetas horizontales.
- El banner cálido de "guarda tus medicinas" se vuelve una franja ancha a todo el
  contenedor con la ilustración a la derecha.
- Sin nav inferior (la navegación vive en el header). Más espaciado vertical (secciones
  separadas 64px).
```

### 1.2 Resultados — MÓVIL

```
Diseña la pantalla de resultados de búsqueda móvil de MediSinas, sistema teal wellness,
fondo #F4F7F6.

Encabezado: botón atrás (flecha de línea), y el input de búsqueda compacto mostrando
"Paracetamol 500mg" con una X para limpiar. Debajo, texto secundario 15px #4A5B57:
"32 farmacias · desde S/ 1.20".

Barra de filtros: fila scrollable horizontal de chips píldora. El primero "Menor
precio" activo (fondo teal #0E7C66, texto blanco); los demás inactivos (fondo blanco,
borde hairline, texto #102A26): "Genérico", "Abiertas ahora", "Solo público". A la
derecha, un toggle segmentado Lista/Mapa (icono lista activo teal, icono mapa).

Lista de tarjetas de farmacia (blancas, radio 20px, sombra suave, padding 16px, una
debajo de otra con 12px de separación). Cada tarjeta:
- Fila superior: nombre de farmacia en Bricolage 600 18px (ej. "InkaFarma"), y a la
  derecha un badge de horario píldora con punto de color: "Abierto" verde #1B9E77.
- Línea de dirección en Source Sans 3 15px #4A5B57 con icono de pin: "Av. Larco 345,
  Miraflores · 1.2 km".
- Fila inferior: a la izquierda el PRECIO grande Bricolage 700 28px teal "S/ 1.20"; si
  es el más barato, una pequeña etiqueta ámbar "Más barato"; a la derecha un botón
  secundario píldora "Ver" con borde teal.

Ejemplos de tarjetas con datos reales y variedad de estados:
1) InkaFarma — S/ 1.20 — badge "Abierto" verde — etiqueta "Más barato".
2) MiFarma — S/ 1.50 — badge "Cierra 22:00" ámbar #E8A23D.
3) Boticas y Salud — S/ 1.80 — badge "Abierto" verde.
4) Hospital Loayza (Farmacia) — S/ 0.90 — badge "24h" teal #0E7C66 — etiqueta
   "Solo público".
5) Farmacia Universal — S/ 2.10 — badge "Cerrado" rojo #D64545.

Nav inferior igual que el Home.
```

### 1.2 Resultados — DESKTOP (qué cambia)

```
Versión desktop de Resultados, mismo sistema. Cambios:
- Layout de dos paneles dentro de contenedor máx 1320px. Panel izquierdo (55%): la
  lista de tarjetas de farmacia, ahora más anchas y con la info distribuida en
  columnas (nombre+dirección a la izquierda, badge de horario al centro, precio + botón
  "Ver" a la derecha). Panel derecho (45%): el MAPA siempre visible y fijo (sticky)
  con tiles claros estilo Carto Light y pines de color por rango de precio, en vez del
  toggle Lista/Mapa.
- Barra de filtros como fila completa de chips en la parte superior del panel
  izquierdo, sin scroll horizontal; añade un dropdown "Ordenar por" a la derecha.
- Al pasar el cursor por una tarjeta, su pin correspondiente en el mapa se resalta y
  eleva (microinteracción).
- Header superior de navegación como en el Home; sin nav inferior.
```

### 1.3 Mis Medicamentos — MÓVIL

```
Diseña la pantalla "Mis medicinas" móvil de MediSinas, sistema teal wellness, fondo
#F4F7F6.

Encabezado: título de pantalla Bricolage 700 30px #102A26 "Mis medicinas" y debajo
subtítulo 16px #4A5B57 "Te recordamos cuándo recomprar". A la derecha un botón circular
teal con icono "+" (añadir).

Tarjeta de resumen superior (fondo blanco, radio 20px): tres mini-stats en fila con
número grande Bricolage y label pequeño: "4 medicinas", "1 por agotarse", "S/ 38
ahorrados".

Lista de tarjetas de medicamento (blancas, radio 20px, sombra suave, padding 16px,
12px de separación). Cada tarjeta:
- Fila superior: nombre Bricolage 600 18px (ej. "Losartán 50mg") y a la derecha un
  icono de tres puntos para opciones.
- Línea de presentación 15px #4A5B57: "Tableta · 1 vez al día".
- MEDIDOR DE RECOMPRA: una barra de progreso horizontal redondeada con código de color
  + texto de estado a la derecha. Tres estados de ejemplo:
   · Losartán 50mg → barra verde #1B9E77, "Te alcanza 18 días".
   · Metformina 850mg → barra ámbar #E8A23D, "Te alcanza 4 días".
   · Atorvastatina 20mg → barra roja #D64545, "Se te acabó ayer".
- Fila inferior de acciones: botón primario píldora teal "Compré hoy" (alto, táctil) y
  botón secundario de borde "Buscar precio".

Incluye una cuarta tarjeta: "Paracetamol 500mg · Tableta · según necesidad" con barra
verde y texto "Tienes 20 unidades".

Estado del medicamento por agotarse resaltado con un sutil borde ámbar a la izquierda
de la tarjeta para que salte a la vista de un adulto mayor.

Nav inferior con "Mis medicinas" activo.
```

### 1.3 Mis Medicamentos — DESKTOP (qué cambia)

```
Versión desktop de "Mis medicinas", mismo sistema. Cambios:
- Contenedor centrado máx 1200px. La tarjeta de resumen superior se convierte en una
  franja ancha con las 3 stats más grandes y separadas, más un botón primario "Añadir
  medicina" a la derecha (en vez del botón circular +).
- Las tarjetas de medicamento se muestran en grilla de 2 columnas. Cada tarjeta más
  amplia, con el medidor de recompra ocupando todo el ancho y las acciones ("Compré
  hoy", "Buscar precio") alineadas a la derecha en una fila.
- Header de navegación superior; sin nav inferior.
- Al pulsar "Compré hoy" la barra de progreso se reinicia a verde con una animación
  suave de relleno.
```

### 1.4 Detalle de medicamento — MÓVIL

```
Diseña la pantalla de detalle de medicamento móvil de MediSinas, sistema teal wellness,
fondo #F4F7F6.

Encabezado: botón atrás (flecha de línea) y a la derecha un icono de "guardar"
(marcador de línea).

Bloque principal: nombre del medicamento Bricolage 700 30px #102A26 "Metformina" y
debajo, en chips píldora seleccionables, las VARIANTES POR CONCENTRACIÓN: "500mg",
"850mg" (seleccionada, fondo teal #0E7C66 texto blanco), "1000mg". Bajo los chips, la
forma farmacéutica en 15px #4A5B57: "Tableta recubierta".

Tarjeta de precios destacada (fondo blanco, radio 20px, sombra suave): tres columnas
con label pequeño arriba y número grande Bricolage:
- "Más barato" → S/ 0.90 en teal 36px.
- "Más caro" → S/ 4.50 en #4A5B57.
- "Ahorras" → S/ 3.60 en ámbar #F4A259, con un pequeño icono de etiqueta.
Debajo, una línea de contexto 15px: "Comparado en 32 farmacias de Lima".

Dos botones de acción a ancho completo, apilados, altos y táctiles:
- Primario teal "Guardar en mis medicinas" (icono +).
- Secundario borde teal "Crear alerta de precio" (icono campana). Bajo este, microcopy
  15px #4A5B57: "Te avisamos por email si baja de S/ 0.81".

Sección "Dónde comprarla": subtítulo Bricolage 22px y lista compacta de 4 farmacias
con datos reales (mismo estilo de tarjeta que en Resultados, versión condensada):
nombre, badge de horario con color, distancia y precio grande teal. Ejemplos:
- Hospital Loayza (Farmacia) — 24h teal — S/ 0.90 — "Más barato".
- InkaFarma — Abierto verde — S/ 1.30.
- MiFarma — Cierra 22:00 ámbar — S/ 1.50.
- Farmacia Universal — Cerrado rojo — S/ 4.50.
Al final, un enlace teal "Ver las 32 farmacias".

Nav inferior estándar.
```

### 1.4 Detalle de medicamento — DESKTOP (qué cambia)

```
Versión desktop del detalle de medicamento, mismo sistema. Cambios:
- Layout de dos columnas, contenedor máx 1200px. Columna izquierda (sticky, 40%):
  nombre del medicamento, chips de concentración, forma farmacéutica, la tarjeta de
  precios (más barato / más caro / ahorras) y los dos botones de acción ("Guardar en
  mis medicinas", "Crear alerta de precio") apilados, más el microcopy de la alerta.
  Esta columna queda fija al hacer scroll.
- Columna derecha (60%): la sección "Dónde comprarla" como lista completa y ancha de
  farmacias con info en columnas (nombre+dirección, badge horario, distancia, precio +
  botón "Ver"), encabezada por una fila de filtros chip ("Menor precio", "Abiertas
  ahora") y un mini-mapa opcional arriba.
- Header de navegación superior; sin nav inferior.
- Microinteracción: al cambiar el chip de concentración, la tarjeta de precios y la
  lista de farmacias se actualizan con un fade suave.
```

---

# DIRECCIÓN 2 — Ilustrado / Calma

## A. SISTEMA DE DISEÑO (pegar como contexto global en Stitch)

**Concepto.** MediSinas se siente como una visita a alguien de confianza que conoce de medicinas y te acompaña sin apuro. Calidez ilustrada, profesionalismo sereno y cero frialdad clínica: el producto reduce la ansiedad de la salud con superficies cálidas, espacio generoso y dibujos hechos a mano. Encaja con un público que incluye adultos mayores y cuidadores porque prioriza legibilidad alta, contraste fuerte, áreas táctiles amplias y una jerarquía que nunca obliga a adivinar.

**Paleta de color (HEX y rol).**
- `#0E5A52` **Verde petróleo — primario.** Color de marca, botones principales, encabezados. Transmite salud, confianza y calma; evita por completo el cliché morado/violeta de IA.
- `#0B423C` **Verde profundo — primario presionado / texto sobre claro.** Estados active y hover oscuro.
- `#F3B14E` **Ámbar cálido — acento humano.** Detalles ilustrados, estrellas, highlights, sol de las ilustraciones. Aporta la calidez "mano amiga".
- `#E76F51` **Terracota — acento secundario / CTA cálido suave.** Botón "Compré hoy", elementos afectivos. Tono latino, nada corporativo.
- `#FBF6EC` **Crema cálido — fondo de app.** Reemplaza el blanco frío azulado típico. Sensación de papel, descanso visual para la vista cansada.
- `#FFFFFF` **Blanco puro — superficie de tarjetas** sobre el crema (contraste suave entre fondo y tarjeta sin sombras agresivas).
- `#1E2A28` **Carbón verdoso — texto principal.** Contraste >12:1 sobre crema; nunca negro puro (más suave a la vista).
- `#5C6B68` **Gris salvia — texto secundario / etiquetas.** Mantiene 4.5:1 mínimo.
- `#E3DCCB` **Arena — bordes, divisores, contornos de tarjeta** (1px, en vez de sombras pesadas).
- Estados: `#2E7D5B` **éxito** (abierto, precio bajo, receta válida) · `#E8A23D` **alerta/aviso** (por vencer, recompra próxima) · `#C8472F` **error/urgente** (cerrado, vencido, recompra vencida) · `#2F6F8F` **info** (24h, datos oficiales).

**Tipografía (legibilidad para adultos mayores como criterio rector).**
- **Display / títulos: "Fraunces"** (serif moderna con carácter cálido y curvas suaves). Da identidad humana, nada de Inter por defecto. Pesos 500–600.
- **Cuerpo e interfaz: "Public Sans"** (sans humanista, abierta, excelente legibilidad; alternativa "Source Sans 3"). Pesos 400/600/700.
- Escala base grande: cuerpo `18px` (nunca menos de 16px), etiquetas `16px`, precio destacado `28–34px` peso 700, H1 `34–40px` (móvil 30–34px), H2 `24px`. Interlineado cuerpo `1.6`. Botones `18px` peso 600.

**Estilo de ILUSTRACIÓN (preciso).** Ilustración **flat con textura de lápiz suave**, dibujada a mano: línea de contorno **media (2–2.5px)** en verde profundo `#0B423C`, no negra; relleno en planos cálidos de la paleta (verde petróleo, ámbar, terracota, crema) con un **grano sutil tipo papel/acuarela seca** que evita el look vectorial perfecto. Esquinas redondeadas, formas orgánicas, cero brillos 3D, cero degradados, cero estilo "Corporate Memphis" (nada de extremidades larguísimas ni colores chillones). **Personas peruanas/latinas con diversidad real:** tonos de piel variados (del trigueño al oscuro), una **abuela de cabello cano con chompa**, un **señor con bigote y lentes**, una **madre joven con su hijo**, un **cuidador adulto**, rasgos andinos y costeños; ropa cotidiana, cálida, nada de batas blancas salvo un farmacéutico amable de fondo. Motivos recurrentes: manos que sostienen o acompañan, una taza humeante, plantas en maceta, blísteres y frascos amables, un sol/mate ámbar. Las ilustraciones acompañan, no decoran de relleno: aparecen en hero, estados vacíos y confirmaciones.

**Forma / superficie.** Radios generosos: tarjetas `20px`, botones `14px`, chips/badges `999px` (pastilla). Elevación mínima y suave: sombra `0 2px 8px rgba(30,42,40,0.06)` solo en elementos accionables; preferir **borde arena 1px** a sombra. Mucho aire: padding de tarjeta `20–24px`, separación entre bloques `24–32px`. Nada de glassmorphism.

**Iconografía.** Set de **línea redondeada 2px** (estilo Phosphor/Lucide redondeado) en verde petróleo, tamaño mínimo `24px`. **Prohibido emojis** en la UI; los estados usan icono + color + texto (no solo color), por accesibilidad.

**Movimiento / microinteracciones.** (1) Botones y tarjetas accionables: leve `scale(0.98)` + sombra al presionar, transición `150ms ease`; respeta `prefers-reduced-motion`. (2) Al guardar un medicamento o confirmar "Compré hoy", una pequeña ilustración (blíster con check ámbar) hace un *fade-in + rise* de `12px` en `300ms` como recompensa cálida.

**Tono de copy (español de Perú, cercano y claro).** Trato de "tú" amable, frases cortas, cero jerga. Ej.: "Busca tu medicina y encuentra dónde cuesta menos", "Te avisamos cuando baje de precio", "Ya casi se te acaba — toca cuando vuelvas a comprar". Confianza explícita: "Precios oficiales de DIGEMID/MINSA".

## B. PROMPTS POR PANTALLA

### 2.1 Home / Buscador — MÓVIL

```
Diseña la pantalla de inicio de una app móvil de salud llamada "MediSinas" sobre fondo
crema cálido #FBF6EC. Arriba, una barra simple: logo "MediSinas" en serif Fraunces
verde petróleo #0E5A52 a la izquierda y un avatar circular de perfil a la derecha.
Debajo, un encabezado grande en Fraunces (34px): "¿Qué medicina necesitas hoy?" y un
subtítulo en Public Sans gris salvia (18px): "Compara precios y encuentra dónde cuesta
menos". El protagonista es una barra de búsqueda grande (altura 60px, radio 14px, borde
arena 1px, fondo blanco) con icono de lupa de línea redondeada y placeholder "Busca:
Paracetamol, Losartán, Metformina…". Bajo el buscador, una fila de chips pastilla
sugeridos: "Paracetamol 500mg", "Losartán 50mg", "Metformina 850mg". A la derecha del
título, integrada en el hero, una ilustración flat con textura de lápiz de una abuela
peruana de cabello cano y un farmacéutico amable señalando un frasco, en planos verde
petróleo, ámbar #F3B14E y terracota #E76F51, con contorno verde profundo de 2px. Más
abajo, una sección de accesos rápidos en tres tarjetas blancas con icono de línea,
título y subtítulo: "Mis medicamentos" (icono blíster), "Mis recetas" (icono
documento), "Alertas de precio" (icono campana). Al pie, un sello de confianza: icono
escudo info #2F6F8F + texto "Precios oficiales de DIGEMID / MINSA". Tipografía grande,
mucho aire, contraste alto. Barra de navegación inferior con 4 items (Buscar,
Medicinas, Recetas, Perfil) en iconos de línea redondeada.
```

### 2.1 Home / Buscador — DESKTOP (qué cambia)

```
Mismo sistema, layout de dos columnas en contenedor centrado de 1200px. Izquierda
(55%): título Fraunces a 40px, subtítulo, barra de búsqueda aún más ancha y los chips
sugeridos en una sola fila; el sello DIGEMID/MINSA queda justo bajo el buscador.
Derecha (45%): la ilustración de la abuela y el farmacéutico a mayor escala como pieza
central cálida. Los accesos rápidos pasan a ser una fila de 3 tarjetas anchas a todo lo
largo, debajo del hero. Sin barra inferior: navegación en un header superior horizontal.
```

### 2.2 Resultados — MÓVIL

```
Diseña la pantalla de resultados de búsqueda de "MediSinas", fondo crema #FBF6EC.
Header con flecha de volver, el término buscado en Fraunces (24px) "Paracetamol 500mg"
y un subtítulo gris salvia "32 farmacias encontradas". Debajo, una fila horizontal de
chips de filtro pastilla (scroll lateral): "Menor precio" (activo, fondo verde petróleo
#0E5A52 texto blanco), "Genérico", "Abiertas ahora", "24 horas". A la derecha, un
toggle Lista/Mapa tipo segmented control. Luego una lista de tarjetas de farmacia
blancas (radio 20px, borde arena 1px): cada una con el nombre de la cadena en peso 600
(ej. "Inkafarma", "Mifarma", "Boticas y Salud"), dirección y distrito en gris salvia,
un badge de horario con icono + texto (verde #2E7D5B "Abierto · cierra 22:00", rojo
#C8472F "Cerrado", info #2F6F8F "Abierto 24h") y, alineado a la derecha, el precio en
grande (30px peso 700) "S/ 2.50" con el más barato resaltado con una etiqueta ámbar
"Más barato". Botón de fila "Ver en mapa". Texto grande y áreas táctiles amplias. Evita
listas densas: cada tarjeta respira con padding 20px y separación 16px.
```

### 2.2 Resultados — DESKTOP (qué cambia)

```
Layout de dos columnas en 1200px. Columna izquierda fija (320px): panel de filtros
vertical con los mismos controles como lista de toggles grandes y un buscador
secundario. Columna derecha: lista de tarjetas de farmacia en una o dos columnas, cada
tarjeta más ancha mostrando precio, horario y dirección en una misma fila bien
espaciada. El toggle Lista/Mapa vive arriba a la derecha; en modo Mapa, el mapa ocupa
la columna derecha completa con marcadores de precio (pines pastilla con "S/ 2.50")
coloreados por rango, y la lista se vuelve una columna estrecha a la izquierda del mapa.
```

### 2.3 Mis Medicamentos — MÓVIL

```
Diseña la pantalla "Mis medicamentos" de "MediSinas", fondo crema #FBF6EC. Header en
Fraunces (30px) "Mis medicamentos" y subtítulo "Te avisamos cuando se te vayan
acabando". Lista de tarjetas de medicamento blancas grandes (radio 20px): cada tarjeta
muestra el nombre en peso 600 (ej. "Metformina 850mg", "Losartán 50mg", "Paracetamol
500mg"), la forma farmacéutica en gris salvia, y un indicador de recompra con código de
color por texto+icono+barra: verde #2E7D5B "Te alcanza 18 días", ámbar #E8A23D "Se te
acaba en 4 días", rojo #C8472F "Ya se te acabó". Incluye una barra de progreso fina del
mismo color. En cada tarjeta, un botón terracota #E76F51 ancho y prominente "Compré
hoy" (radio 14px, 52px de alto) y un enlace secundario "Ver precios". Un botón flotante
o de cabecera "+ Agregar medicina". Cuando no haya medicinas, muestra un estado vacío
ilustrado: dibujo flat con textura de lápiz de una repisa con frascos amables y una
planta, y el texto "Aún no guardas ninguna medicina. Agrega la primera y te ayudamos a
no quedarte sin ella." Tipografía grande y botones amplios pensados para adultos
mayores.
```

### 2.3 Mis Medicamentos — DESKTOP (qué cambia)

```
Grid de tarjetas de 2 o 3 columnas en contenedor de 1200px, cada tarjeta con más
respiración y el botón "Compré hoy" y el indicador de días bien visibles. Header con el
título a la izquierda y el botón "+ Agregar medicina" a la derecha. El estado vacío usa
la misma ilustración a mayor escala, centrada con el texto debajo y un CTA primario
verde petróleo.
```

### 2.4 Detalle de medicamento — MÓVIL

```
Diseña la pantalla de detalle de un medicamento en "MediSinas", fondo crema #FBF6EC.
Header con flecha de volver y el nombre en Fraunces (28px) "Paracetamol 500mg",
subtítulo gris salvia "Tableta · Genérico disponible". Debajo, una fila de chips de
concentración/variante seleccionables en pastilla: "500mg" (activo verde petróleo),
"650mg", "1g". Luego un bloque de resumen de precio en tarjeta blanca con tres datos en
grande: "Desde S/ 2.50" (precio mín, 34px peso 700, verde éxito), "Hasta S/ 8.00" (gris
salvia) y una etiqueta ámbar destacada "Ahorras hasta S/ 5.50". Dos botones de acción a
todo el ancho, lado a lado: primario verde petróleo "Guardar medicina" (icono blíster)
y secundario con borde "Crear alerta de precio" (icono campana). Más abajo, título
"Dónde comprarlo" y una lista de tarjetas de farmacia (mismas que en Resultados):
nombre de cadena, distrito, badge de horario con icono+color+texto y precio grande a la
derecha, ordenadas de menor a mayor. Una pequeña ilustración cálida flat de una mano
sosteniendo un blíster junto al bloque de precio. Texto grande, alto contraste, botones
amplios.
```

### 2.4 Detalle de medicamento — DESKTOP (qué cambia)

```
Layout de dos columnas en 1200px. Izquierda (40%): tarjeta sticky con el nombre, los
chips de concentración, el bloque de resumen de precio (mín/máx/ahorro), los dos botones
de acción apilados y la ilustración de la mano con el blíster. Derecha (60%): el listado
completo "Dónde comprarlo" con tarjetas de farmacia más anchas mostrando precio, horario
y dirección en una fila, más un toggle a vista de mapa. La jerarquía mantiene el precio
mínimo como elemento más prominente de toda la pantalla.
```

---

# DIRECCIÓN 3 — Plano / Minimal

## A. SISTEMA DE DISEÑO (pegar como contexto global en Stitch)

**Concepto.** MediSinas es una utilidad de salud pública digna y serena: la confianza nace del orden, el espacio en blanco y la legibilidad radical, no del adorno. Cada pantalla respira como un formulario gubernamental bien hecho cruzado con una app financiera de confianza, pero con la calidez y el tamaño que un adulto mayor o un cuidador agradecen. Minimalismo como acto de accesibilidad: nada compite por la atención excepto lo que el usuario necesita ahora mismo —el precio, la farmacia, el siguiente paso.

**Paleta de color (restringida, memorable, con HEX y rol).**
- `#0B3B3C` **Verde pino profundo — PRIMARIO.** Color de marca, botones principales, encabezados clave. Evita el azul clínico genérico y el morado de IA; transmite salud, serenidad y seriedad institucional peruana.
- `#0E7C6B` **Verde salvia medio — PRIMARIO claro / interacción.** Estados hover, enlaces, acentos sobre fondo claro.
- `#FBFAF7` **Hueso cálido — FONDO base.** No blanco puro: reduce la fatiga visual de ojos mayores y aporta calidez sin caer en la tarjeta blanca flotante típica de IA.
- `#FFFFFF` **Blanco — SUPERFICIE.** Solo para zonas de contenido que deben separarse del fondo hueso mediante una línea fina, nunca por sombra dramática.
- `#13211F` **Verde casi negro — TEXTO principal.** Alto contraste sobre hueso (supera ampliamente 4.5:1).
- `#5A6562` **Gris verdoso — TEXTO secundario.** Etiquetas, metadatos, ayuda.
- `#E7E3DA` **Arena — LÍNEAS Y DIVISORES.** El ornamento principal del sistema: bordes finos de 1px que organizan, en vez de sombras.
- `#C9472E` **Terracota — ACENTO / PRECIO DESTACADO y CTA secundario de urgencia.** Un único acento cálido distintivo (no rojo alarma), reservado al dato económico que importa: el precio más bajo y el ahorro.
- Estados: `#1F8A53` **Éxito / abierto ahora**, `#C98A14` **Alerta / por vencer / cierra pronto**, `#B23121` **Error / vencido / cerrado**. Tonos terrosos, no neón.

**Tipografía (con personalidad, nombre real).**
- **Display / títulos: "Fraunces"** (serif contemporánea de Google Fonts, con carácter editorial y humanista). Aporta cercanía y dignidad —se siente escrita por una persona, no por un sistema. Usar en peso 500–600, tracking ligeramente cerrado.
- **Cuerpo / UI: "Libre Franklin"** (grotesca humanista, abierta y muy legible). Alternativa: "Public Sans" (la tipografía del gobierno de EE. UU., refuerza el aire de utilidad pública confiable).
- Tamaños base pensados para adultos mayores (no reducir): cuerpo base **18px** (nunca menor a 16px), etiquetas/metadatos **16px**, H3 sección **22px**, H2 **28px**, H1/Display **34–40px** (móvil) / **44–56px** (desktop), precios destacados **30–40px** en Fraunces. Interlineado generoso (1.5 en cuerpo).

**Forma y superficie.** Radios sobrios y consistentes: **8px** en botones, inputs y chips; **12px** en contenedores grandes. Nada de píldoras exageradas ni esquinas a 0. **Líneas finas de 1px en color arena (`#E7E3DA`)** como sistema estructural principal: separan filas de farmacias, agrupan secciones, enmarcan tarjetas. La línea es el ornamento. **Sombras prácticamente ausentes** (máximo `0 1px 2px rgba(19,33,31,0.06)` en elementos elevados reales como la barra de búsqueda fija). **Espacio en blanco abundante y rítmico**, escala de 8px (8/16/24/32/48/64). El aire es la jerarquía.

**Iconografía.** Estilo **lineal (outline), grosor 1.5–2px**, esquinas suaves, set coherente tipo Lucide / Phosphor (regular). Tamaño mínimo 24px. **Cero emojis.** Iconos en verde primario o gris verdoso, nunca multicolor.

**Movimiento / microinteracciones (sutiles).** Transiciones de 150–200ms ease-out solo en hover/focus de botones y en el cambio Lista↔Mapa (crossfade suave de 250ms). El foco de teclado dibuja un anillo arena de 2px. Los badges de estado (abierto/cerrado) aparecen con un fade corto, sin rebotes ni animaciones llamativas.

**Tono de la copy UI (español de Perú).** Claro, cálido y respetuoso. Tutea con amabilidad sin ser informal en exceso. Frases cortas, verbos directos. Ejemplos: "Busca tu medicamento", "Aquí lo encuentras más barato", "Guardé tu medicina, te avisaré cuando se acabe", "Compré hoy". Evita tecnicismos; explica con palabras simples. Refuerza confianza: "Precios oficiales de DIGEMID".

## B. PROMPTS POR PANTALLA

### 3.1 Home / Buscador — MÓVIL

```
Diseña la pantalla de inicio de una app móvil de salud llamada MediSinas, un comparador
de precios de medicamentos en Perú. Estética plana, minimalista, cálida y de alta
legibilidad para adultos mayores. Fondo color hueso cálido #FBFAF7. Tipografía de
títulos serif "Fraunces", cuerpo en "Libre Franklin". Sin sombras llamativas, sin
gradientes, sin emojis; usa líneas finas color arena #E7E3DA como separadores.

Arriba, una barra superior simple: a la izquierda el logotipo "MediSinas" en Fraunces
verde pino #0B3B3C (34px), a la derecha un ícono lineal de perfil de usuario (outline,
24px). Debajo, mucho aire.

Bloque principal centrado a la izquierda: un titular grande en Fraunces (38px, verde
casi negro #13211F): "Encuentra tu medicina al mejor precio". Subtítulo en Libre
Franklin 18px gris verdoso #5A6562: "Precios oficiales de farmacias en todo el Perú,
verificados con DIGEMID."

El protagonista absoluto: una barra de búsqueda grande (altura 64px, radio 8px, fondo
blanco, borde 1px arena), con ícono lupa lineal a la izquierda y placeholder "Busca tu
medicamento, ej. Paracetamol". A su derecha dentro del campo, un botón compacto verde
pino "Buscar". Debajo de la barra, en texto pequeño: "También puedes buscar por
síntoma: dolor de cabeza, presión alta…".

Más abajo, sección "Accesos rápidos": tres filas tipo lista (no tarjetas flotantes),
cada una separada por línea fina arena, con ícono lineal a la izquierda, título en 18px
y descripción en 16px gris: (1) "Mis medicamentos — guarda tus medicinas y recibe
recordatorios", (2) "Mis alertas de precio — te avisamos cuando baje", (3) "Mis recetas
— guarda la foto de tu receta médica".

Al pie, una franja discreta de confianza con un ícono lineal de escudo/verificado y el
texto: "Datos oficiales DIGEMID · MINSA". Áreas táctiles amplias (mínimo 48px),
contraste fuerte, espaciado generoso en escala de 8px.
```

### 3.1 Home / Buscador — DESKTOP (qué cambia)

```
Misma pantalla en versión desktop, ancho máximo de contenido centrado (1120px) sobre
fondo hueso. La barra superior se vuelve horizontal con navegación: "Buscar", "Mis
medicamentos", "Mis recetas", "Mis alertas" alineadas a la derecha junto al ícono de
perfil. El titular crece a 52px en Fraunces y se acompaña, a la derecha, de una columna
secundaria sobria (sin imagen decorativa) con una lista vertical de 3 cifras de
confianza separadas por líneas arena: "+10 000 farmacias", "Precios actualizados a
diario", "100% datos oficiales". La barra de búsqueda se centra y ocupa unos 720px de
ancho. Los accesos rápidos pasan de filas apiladas a tres columnas separadas por líneas
verticales finas arena, manteniendo el estilo de lista (no tarjetas con sombra).
```

### 3.2 Resultados — MÓVIL

```
Diseña la pantalla de resultados de búsqueda de MediSinas en móvil, misma estética plana
minimalista cálida, fondo hueso #FBFAF7, títulos Fraunces, cuerpo Libre Franklin,
separadores en líneas finas arena, sin sombras fuertes ni emojis.

Arriba, barra de búsqueda compacta fija (fondo blanco, borde arena, radio 8px) mostrando
el término buscado: "Losartán 50 mg". Debajo, una línea de contexto en gris verdoso: "23
farmacias encontradas cerca de ti".

Fila de filtros horizontales deslizables como chips de borde fino (radio 8px, borde
arena, texto verde pino): "Menor precio" (seleccionado, relleno verde pino con texto
blanco), "Genérico", "Abiertas ahora", "Solo público". A la derecha del todo, un toggle
Lista / Mapa sobrio (dos segmentos con borde arena; "Lista" activo en verde pino).

Lista de resultados como filas separadas por líneas finas arena, no como tarjetas
flotantes. Cada fila contiene, a la izquierda: nombre de la farmacia en 18px verde casi
negro (ej. "Inkafarma", "Mifarma", "Boticas y Salud", "Farmacia Universal"), debajo la
dirección y distrito en 16px gris ("Av. Arequipa 1234, Lince"), y un badge de horario
lineal: "Abierto ahora" con punto verde #1F8A53, o "Cierra 22:00", o "Cerrado" en
terracota #B23121, o "24 horas". A la derecha de la fila, el precio destacado en Fraunces
28px color terracota #C9472E (ej. "S/ 3.20") y debajo, pequeño, "por blíster". La fila
más barata muestra una etiqueta sutil "Más barato" sobre fondo verde claro.

Áreas táctiles amplias en cada fila, mucho aire vertical entre filas. Toda la jerarquía
se construye con tamaño tipográfico y líneas, no con color de fondo.
```

### 3.2 Resultados — DESKTOP (qué cambia)

```
Versión desktop con ancho de contenido 1120px centrado. Los filtros dejan de ser
deslizables y se muestran todos en una barra de filtros fija arriba; el toggle
Lista/Mapa queda a la derecha. En vista Mapa, la pantalla se divide en dos columnas: a
la izquierda (40%) la lista de farmacias en filas con líneas arena, a la derecha (60%)
un mapa limpio estilo Carto Light con marcadores que muestran el precio (pin verde pino
con número de precio); el marcador más barato resaltado en terracota. Al pasar el cursor
sobre una fila, se resalta su marcador en el mapa con una transición suave de 200ms. En
vista Lista, los resultados pueden mostrarse en dos columnas de filas para aprovechar el
ancho, conservando las líneas separadoras.
```

### 3.3 Mis Medicamentos — MÓVIL

```
Diseña la pantalla "Mis medicamentos" de MediSinas en móvil. Misma estética plana,
cálida y legible: fondo hueso #FBFAF7, títulos Fraunces, cuerpo Libre Franklin,
divisores en líneas finas arena, sin sombras dramáticas ni emojis.

Encabezado de página en Fraunces 32px: "Mis medicamentos". Subtítulo gris: "Te avisamos
antes de que se te acaben."

Lista de medicamentos guardados como filas amplias separadas por líneas arena. Cada
fila: a la izquierda, nombre del medicamento en 20px verde casi negro y concentración
debajo en 16px gris (ej. "Metformina 850 mg", "Losartán 50 mg", "Atorvastatina 20 mg").
Debajo, una barra de estado de recompra con código de color terroso: una barra
horizontal fina que se llena según los días restantes —verde #1F8A53 "Te alcanza 18
días", ámbar #C98A14 "Te queda para 4 días", terracota #B23121 "Se te acabó". El texto
del estado aparece junto a la barra en 16px.

A la derecha de cada fila, un botón secundario sobrio "Compré hoy" (borde verde pino,
texto verde pino, fondo transparente, radio 8px, altura táctil 48px) que reinicia el
contador. Un ícono lineal de tres puntos para más opciones (editar, eliminar).

El medicamento en estado rojo aparece ordenado primero. Arriba a la derecha o como
botón flotante inferior, un botón principal verde pino "Agregar medicamento" con ícono
"+" lineal. Mucho espacio vertical, tipografía grande, jerarquía por tamaño y por la
barra de color, no por tarjetas.
```

### 3.3 Mis Medicamentos — DESKTOP (qué cambia)

```
Versión desktop, contenido centrado a 1120px. Las filas se ensanchan y la información se
distribuye en columnas alineadas a una grilla: columna 1 nombre + concentración, columna
2 la barra de recompra con su texto, columna 3 fecha de última compra y dosis ("1 vez al
día · comprado el 12 may"), columna 4 el botón "Compré hoy" y el menú de opciones, todas
separadas visualmente por el ritmo de la grilla y una línea inferior arena por fila.
Encabezados de columna sutiles en gris 16px ("Medicamento", "Estado", "Última compra",
""). El botón "Agregar medicamento" pasa a la esquina superior derecha del encabezado,
en verde pino sólido. Opcionalmente, un panel lateral derecho fino con un resumen: "2
medicinas por acabarse esta semana", separado por línea vertical arena.
```

### 3.4 Detalle de medicamento — MÓVIL

```
Diseña la pantalla de detalle de un medicamento en MediSinas, móvil. Estética plana
minimalista cálida, fondo hueso #FBFAF7, títulos Fraunces, cuerpo Libre Franklin,
divisores líneas finas arena, sin sombras fuertes ni emojis.

Arriba, una flecha lineal de regreso y luego el nombre del medicamento como título en
Fraunces 34px: "Paracetamol". Debajo, en gris, su forma: "Tableta · varios
laboratorios".

Sección "Concentración": chips seleccionables de borde fino arena (radio 8px), uno
activo en verde pino con texto blanco: "500 mg" (activo), "650 mg", "1 g". Áreas
táctiles amplias.

Bloque de resumen de precios, separado por líneas arena arriba y abajo, en tres datos
alineados horizontalmente: "Precio mínimo S/ 0.30" (en Fraunces 32px terracota #C9472E),
"Precio máximo S/ 2.10", y "Ahorras hasta 86%". El dato de ahorro lleva un pequeño
realce sobre fondo verde claro.

Dos botones de acción lado a lado, altura táctil 56px: principal verde pino sólido
"Guardar en mis medicamentos" (con ícono lineal de marcador), y secundario de borde
verde pino "Crear alerta de precio" (con ícono lineal de campana).

Debajo, encabezado "Dónde comprarlo" y una lista de farmacias en filas separadas por
líneas arena (igual estilo que la pantalla de resultados): nombre, dirección/distrito,
badge de horario "Abierto ahora" con punto verde, y precio destacado en Fraunces a la
derecha. La farmacia más barata, primera, con etiqueta sutil "Más barato". Al pie, nota
de confianza: "Precios oficiales DIGEMID, actualizados hoy."
```

### 3.4 Detalle de medicamento — DESKTOP (qué cambia)

```
Versión desktop, contenido a 1120px en dos columnas. Columna izquierda (sticky al hacer
scroll): el título del medicamento, los chips de concentración, el bloque de resumen de
precios en formato vertical (mínimo, máximo, ahorro, cada uno separado por línea arena)
y los dos botones de acción apilados a ancho completo de la columna. Columna derecha
(más ancha): el encabezado "Dónde comprarlo" y la lista de farmacias en filas con líneas
arena, con la opción de un pequeño toggle Lista/Mapa reutilizando el estilo de la
pantalla de resultados. La jerarquía se mantiene editorial: el precio mínimo en
terracota grande sigue siendo el elemento más llamativo de la página.
```
