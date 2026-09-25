# Roadmap — BarberSync PRO → **Barber New Yark** (Cajicá)

> Última actualización: adaptación completa al cliente real ejecutada.
> Frontend: `http://localhost:5173` · Guardián: `http://localhost:5050`

## 6. Adaptación a Cliente Real (Barber New Yark) ✅
- [x] Actualizar `mockData.js` con los 5 barberos (Jhon, Rodolfo, Leonardo, Rafael, Andy).
      → Con **fotos reales** (`src/assets/barbers/*.png`), sillas 01–05, colores y especialidades.
- [x] Actualizar lista de servicios exactos (Corte 25k · Barba 20k · Cejas 5k · Combo 35k).
      → Con duraciones reales (45/30/15/60 min) que alimentan el calendario.
- [x] Implementar función `generateTimeSlots()` que respete cierre a las 20:00 Lun-Sab y 19:00 Dom.
      → `src/utils/schedule.js`. Grilla de 30 min, bloqueo de citas ocupadas/pasadas.
      → **Test unitario OK**: último slot Dom 18:00 (termina 18:45 ≤ 19:00) · Sáb 19:00 (termina 20:00 exacto) · cita existente queda BLOQUEADA.
- [x] Añadir botón de navegación a Google Maps (Cra 6 # 0-72).
      → Botón "Cómo llegar" en la home (enlace con dirección exacta) + en el modal de WhatsApp.
- [x] Extra: fechas del stepper dinámicas (Hoy + 5 días) y horarios editables desde el admin alimentan la grilla en vivo.

## 7. Interfaces CRUD en Admin Dashboard ✅
- [x] Crear sub-vista de "Servicios" (Crear, Leer, Actualizar, Borrar).
      → Tabla + `ServiceFormModal` (nuevo) + eliminación con doble confirmación.
      → Handlers listos para API: `handleSaveService(data)` / `handleDeleteService(id)` → persisten en Supabase `services` en modo live, optimistas en demo.
- [x] Crear sub-vista de "Barberos" (Activar/Desactivar).
      → Switch por barbero → `store.toggleBarberActive` (columna `barbers.active` añadida al schema + RLS). El inactivo se bloquea en la reserva ("No disponible hoy").
- [x] Crear sub-vista de "Horarios y Configuración".
      → Inputs `type="time"` separados Lun–Sáb vs Domingo, nombre, dirección y política → actualizan `businessInfo` y el motor de slots en vivo.

## 8. Infraestructura de Archivos y Marca Blanca ✅
- [x] Configurar lógica de `<input type="file">` en el modal de portafolio para Supabase Storage.
      → `UploadCutModal`: file input real + drag&drop + preview + nombre único `<barberId>/<timestamp>-<rand>.<ext>`.
      → `src/services/storageService.js`: `uploadPortfolioImage()` contra bucket **`portfolio_images`**.
      → `supabase/schema.sql`: creación del bucket + políticas (lectura pública / escritura solo staff con `is_staff()`).
- [x] Actualizar Footer con branding B2B (Detaim S.A.S.).
      → "Plataforma tecnológica impulsada por Detaim S.A.S." (texto pequeño, muted) + dirección y horario resumido.

## Marca verificada ✅
- [x] Logo real (`src/assets/brand/logo.jpg`) en home, login y footer.
- [x] Título de pestaña: "Barber New Yark — Reserva tu cita en Cajicá".
- [x] Cero referencias restantes a la marca/ubicación anterior en `src/`.
- [x] Build de producción OK (1660 módulos, assets de marca empaquetados).

## Pendiente para go-live (requiere credenciales del cliente)
- [ ] Ejecutar `supabase/schema.sql` en el proyecto Supabase del cliente (incluye seed comentado con los 4 servicios exactos).
- [ ] Crear cuentas Auth para Jhon/Rodolfo/Leonardo/Rafael/Andy + dueño y enlazar `profiles.role`.
- [ ] Subir fotos de barberos a Storage y poblar tabla `barbers`.
- [ ] Desplegar Edge Function `notify-whatsapp` (plantilla Meta aprobada) y apuntar `VITE_WHATSAPP_WEBHOOK_URL`.
- [ ] Webhook `appointments` → `guardian.py` en producción.
