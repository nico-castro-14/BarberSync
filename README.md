# BarberSync PRO

Sistema integral de barbería: reserva de citas sin registro, portafolio público por barbero, panel del barbero, panel de administración y automatización de WhatsApp.

## Stack

- **Frontend:** React 18 + Vite 6 + Tailwind CSS 3 (tema oscuro, Plus Jakarta Sans) + lucide-react + react-router-dom 6
- **Base de datos:** Supabase (PostgreSQL + RLS) — esquema en `supabase/schema.sql`
- **Backend de supervisión:** Python + Flask en `backend/guardian.py` (watcher/middleware estilo Tasker)

## Estructura

```
src/
  components/   Navbar, Sidebar, Toast, Footer, Stepper, tarjetas, modales
  pages/        ClientBooking, BarberPortfolio, BarberDashboard, AdminDashboard
  context/      BookingContext (flujo de reserva), StoreContext (datos), ToastContext
  hooks/        useBooking, useStore, useToast
  services/     supabaseClient.js, whatsappService.js
  utils/        mockData.js (datos de demo hasta conectar Supabase)
supabase/
  schema.sql    DDL + políticas RLS (instrucciones en la cabecera del archivo)
backend/
  guardian.py   Watcher + API de validación/limpieza/webhook
  .env.example
```

## Rutas de la app

La app no usa navbar superior: la home es 100% cliente y el equipo entra
desde el footer ("Ingresar como Barbero / Barbería").

| Ruta               | Área     | Vista                                             |
| ------------------ | -------- | ------------------------------------------------- |
| `/`                | Pública  | Reserva del cliente (stepper 4 pasos)             |
| `/barbero/:handle` | Pública  | Perfil y portafolio público del barbero           |
| `/login`           | Acceso   | Login del equipo (`?rol=barbero` \| `?rol=barberia`)|
| `/panel`           | Privada  | Panel del barbero (requiere sesión barbero/admin) |
| `/admin`           | Privada  | Dashboard del dueño (requiere sesión admin)       |

Sesión: `SessionContext` persiste en localStorage; modo demo sin credenciales,
`supabase.auth.signInWithPassword` cuando `VITE_SUPABASE_*` estén definidas.

## Levantar el proyecto

### 1. Frontend

```powershell
npm install
npm run dev        # http://localhost:5173
```

Build de producción: `npm run build` (salida en `dist/`).

### 2. Backend (guardián)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # rellenar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
python guardian.py       # http://localhost:5050/health
```

Sin credenciales, el guardián corre en **modo simulado** (no escribe en la DB).

### 3. Supabase

1. Crear proyecto en https://supabase.com
2. SQL Editor → pegar `supabase/schema.sql` → Run
3. Copiar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` a un `.env` en la raíz
   (ver `.env.example`)

### 4. WhatsApp (Fase 5)

El frontend hace `POST` del payload de la cita confirmada a
`VITE_WHATSAPP_WEBHOOK_URL` (ver `src/services/whatsappService.js`). Si no está
configurado, se muestra el **modal simulado de WhatsApp** como fallback visual.

Edge Function incluida en `supabase/functions/notify-whatsapp/index.ts`
(envía la plantilla vía Meta WhatsApp Cloud API):

```powershell
supabase login; supabase link --project-ref <ref>
supabase secrets set WHATSAPP_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=... NOTIFY_WEBHOOK_SECRET=...
supabase functions deploy notify-whatsapp
# .env (raíz): VITE_WHATSAPP_WEBHOOK_URL=https://<ref>.supabase.co/functions/v1/notify-whatsapp
```

## Notas

- `code.html` se conserva como referencia del diseño original.
- No subir `.env` al repositorio (la `service_role` key solo vive en el backend).
