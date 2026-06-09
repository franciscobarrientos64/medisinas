# MediSinas — Ideas en desarrollo

> Lista viva de ideas de producto. Capturadas mientras se trabaja la estética en Stitch.
> Última actualización: 2026-06-08

---

## Idea 1 — Perfiles familiares / "personas a tu cargo"  ✅ Backend listo

**Qué:** convertir Medisinas de app personal a centro de control de medicinas de la familia.
La cuenta tiene un titular y puede agregar **personas**; cada medicamento, receta y alerta
se asigna a una persona y todo se filtra por quién.

**Por qué encaja:** el público objetivo (cuidadores de adultos mayores, padres de familia)
maneja las medicinas de varias personas, no solo las propias.

**Campos por persona:** nombre/apodo, parentesco (yo/madre/padre/hijo/hija/pareja/abuelo/
abuela/otro), género, edad o año de nacimiento, condiciones crónicas (chips), alergias a
medicamentos, color/avatar.

**UX:** no recargar el login/OTP. Onboarding post-login "¿Para quién compras medicinas?",
saltable y editable después. El titular se crea automáticamente (lazy) la primera vez.

---

## Idea 2 — Ahorro por búsqueda, acumulado  ✅ Backend listo

**Qué:** después de cada búsqueda, mostrar el monto de ahorro y guardarlo. Contador
acumulado "Has ahorrado S/ XXX con Medisinas".

**Métricas (decisión de confianza):**
- **Ahorro potencial:** precio más caro de la zona − más barato. Se muestra en cada
  búsqueda. Motivador pero teórico.
- **Ahorro real:** se contabiliza solo cuando el usuario confirma la compra. Es el número
  defendible para el acumulado.

**Zona = distrito** (decidido).

**Público vs privado:** el frontend decide qué precios manda en `precios[]` (recomendado:
filtrar por categoría comparable para no distorsionar máx/mín con farmacias de hospital).

---

## Idea 3 — Historial de precios de medicinas  ✅ Backend listo

**Qué:** guardar la evolución del precio de cada medicamento por distrito para graficar
la tendencia ("este medicamento está más barato que el mes pasado").

**Cómo se alimenta:** un snapshot por **producto + distrito + día** (precio mín/máx/promedio
y nº de farmacias). Se llena automáticamente en cada búsqueda (mismo endpoint que el ahorro).
Pendiente: que el cron de alertas también registre snapshots de productos sin búsquedas.

---

## Estado en Supabase (tablas creadas)

```sql
personas           — id, usuario_id, nombre, parentesco, genero, anio_nacimiento,
                     condiciones[], alergias[], color, es_titular, activo, created_at
ahorros            — id, usuario_id, persona_id, nombre_producto, concent, grupo,
                     cod_grupo_ff, distrito, precio_min, precio_max, num_farmacias,
                     ahorro_potencial, ahorro_real, comprado, precio_pagado, created_at
historial_precios  — id, nombre_producto, concent, grupo, cod_grupo_ff, distrito,
                     fecha, precio_min, precio_max, precio_promedio, num_farmacias
-- + columna persona_id (nullable) agregada a:
--   medicamentos_usuario, recetas_medicas, alertas_precio
```

## Endpoints creados (`/api`)

| Endpoint | Método | Para qué |
|---|---|---|
| `get-personas` | GET `?userId` | Lista personas (auto-crea titular si no hay) |
| `save-persona` | POST | Crea o actualiza persona (con `id` = update) |
| `delete-persona` | POST | Soft delete (no permite borrar al titular) |
| `registrar-busqueda` | POST | Registra ahorro + snapshot de precio (llamar tras cada búsqueda) |
| `get-ahorros` | GET `?userId` | Acumulados: real/potencial, total/mes, por persona |
| `confirmar-compra` | POST | Marca ahorro como real al confirmar compra |
| `historial-precios` | GET | Evolución de precios de un producto (para gráfico) |

## Contrato de integración frontend (para conectar tras el diseño)

```js
// Tras cada búsqueda con resultados:
POST /api/registrar-busqueda
{ userId, persona_id?, distrito,
  medicamento: { nombreProducto, concent, grupo, codGrupoFF },
  precios: [12.5, 9.8, 15.0, ...] }   // precios encontrados en la zona
// → { ahorro_potencial, precio_min, precio_max, ahorro_id }

// Al confirmar dónde compró:
POST /api/confirmar-compra
{ userId, ahorroId, precio_pagado }   // → { ahorro_real }

// Onboarding / gestión de personas:
GET  /api/get-personas?userId=...
POST /api/save-persona   { userId, id?, nombre, parentesco, genero, anio_nacimiento, condiciones[], alergias[], color }
POST /api/delete-persona { userId, personaId }

// Dashboard de ahorro:
GET  /api/get-ahorros?userId=...

// Gráfico de tendencia:
GET  /api/historial-precios?grupo=...&cod_grupo_ff=...&concent=...&distrito=...&dias=90
```

## Pendiente (frontend + mejoras)
- [ ] Onboarding "¿Para quién compras?" + selector de persona en la UI (post-diseño)
- [ ] Llamar a `registrar-busqueda` desde App.jsx tras cada búsqueda
- [ ] Dashboard de ahorro acumulado (total y por persona)
- [ ] Gráfico de historial de precios en el detalle del medicamento
- [ ] Que `cron-alertas.js` registre también snapshots en `historial_precios`
- [ ] ¿Qué condiciones crónicas precargar como chips?
