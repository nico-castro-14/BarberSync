"""
============================================================================
 guardian.py — Guardián de BarberSync PRO (arquitectura estándar "Tasker")
============================================================================

Watcher + middleware que supervisa las transacciones críticas de la base de
datos de Supabase:

  1. VALIDACIÓN DE SOLAPAMIENTO — antes de confirmar una cita, comprueba que
     el barbero no tenga otra cita activa cuya ventana de tiempo se cruce.
  2. LIMPIEZA DE RESERVAS NO CONFIRMADAS — barrido periódico que cancela las
     citas en estado 'pending' que superan el TTL sin confirmación (evita
     "huecos fantasma" en la agenda).
  3. SEGURIDAD DE ENDPOINTS — todos los endpoints sensibles exigen el header
     `X-Guardian-Key` (middleware `require_guardian_key`).

Uso:
    cd backend
    python -m venv venv && venv\\Scripts\\activate   (Windows)
    pip install -r requirements.txt
    copy .env.example .env   # y rellena las credenciales
    python guardian.py

Endpoints:
    GET  /health                              → estado del guardián (público)
    POST /guardian/appointments/validate      → valida solapamiento de una cita
    POST /guardian/webhook                    → receptor de Database Webhooks
                                                (Supabase → tabla appointments)
    POST /guardian/maintenance/sweep          → fuerza el barrido de pendientes
============================================================================
"""

from __future__ import annotations

import logging
import os
import threading
import time
from datetime import datetime, timedelta, timezone
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from supabase import Client, create_client

# ----------------------------------------------------------------------------
# Configuración
# ----------------------------------------------------------------------------
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
GUARDIAN_API_KEY = os.getenv("GUARDIAN_API_KEY", "dev-guardian-key")
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "30"))
PENDING_EXPIRATION_MINUTES = int(os.getenv("PENDING_EXPIRATION_MINUTES", "15"))
GUARDIAN_PORT = int(os.getenv("GUARDIAN_PORT", "5050"))
GUARDIAN_DEBUG = os.getenv("GUARDIAN_DEBUG", "false").lower() == "true"

DEFAULT_DURATION_MIN = 45  # fallback si el servicio no define duración
ACTIVE_STATUSES = ("pending", "confirmed")

logging.basicConfig(
    level=logging.DEBUG if GUARDIAN_DEBUG else logging.INFO,
    format="%(asctime)s [guardian] %(levelname)s %(message)s",
)
log = logging.getLogger("guardian")

# ----------------------------------------------------------------------------
# Conexión segura a Supabase (service_role — SOLO en backend)
# ----------------------------------------------------------------------------
supabase: Client | None = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    log.info("Conectado a Supabase: %s", SUPABASE_URL)
else:
    log.warning(
        "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no definidas. "
        "El guardián arranca en MODO SIMULADO (sin escrituras en DB)."
    )

app = Flask(__name__)

# ----------------------------------------------------------------------------
# Middleware de seguridad de endpoints
# ----------------------------------------------------------------------------
def require_guardian_key(view):
    """Exige el header X-Guardian-Key en endpoints sensibles."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        key = request.headers.get("X-Guardian-Key", "")
        if key != GUARDIAN_API_KEY:
            log.warning("Acceso denegado a %s desde %s", request.path, request.remote_addr)
            return jsonify({"ok": False, "error": "unauthorized"}), 401
        return view(*args, **kwargs)

    return wrapper


# ----------------------------------------------------------------------------
# Reglas de negocio
# ----------------------------------------------------------------------------
def _parse_iso(dt_str: str) -> datetime:
    return datetime.fromisoformat(dt_str.replace("Z", "+00:00"))


def _duration_minutes(raw) -> int:
    """Normaliza la duración del servicio a minutos.

    Acepta intervalos serializados por PostgREST ('00:45:00'), dicts de
    postgres o números (minutos).
    """
    if raw is None:
        return DEFAULT_DURATION_MIN
    if isinstance(raw, (int, float)):
        return int(raw)
    if isinstance(raw, str):
        try:
            h, m, s = raw.split(":")
            return int(h) * 60 + int(m) + (1 if int(float(s)) > 0 else 0)
        except ValueError:
            return DEFAULT_DURATION_MIN
    if isinstance(raw, dict):  # {'hours': .., 'minutes': ..} según driver
        return int(raw.get("hours", 0)) * 60 + int(raw.get("minutes", 0))
    return DEFAULT_DURATION_MIN


def find_overlaps(barber_id: str, date_str: str, start_time_str: str, duration_min: int) -> list[dict]:
    """Devuelve las citas activas del barbero que se solapan con la ventana
    [start_time, start_time + duration) en la fecha indicada."""
    if not supabase:
        return []

    result = (
        supabase.table("appointments")
        .select("id, start_time, status, service_id")
        .eq("barber_id", barber_id)
        .eq("appointment_date", date_str)
        .in_("status", ACTIVE_STATUSES)
        .execute()
    )

    new_start = datetime.strptime(start_time_str[:5], "%H:%M")
    new_end = new_start + timedelta(minutes=duration_min)

    conflicts = []
    for apt in result.data or []:
        existing_start = datetime.strptime(apt["start_time"][:5], "%H:%M")
        existing_end = existing_start + timedelta(minutes=DEFAULT_DURATION_MIN)
        if new_start < existing_end and existing_start < new_end:
            conflicts.append(apt)
    return conflicts


def sweep_stale_pending() -> int:
    """Cancela citas 'pending' cuya antigüedad supera el TTL sin confirmarse.

    Retorna el número de citas canceladas (0 en modo simulado)."""
    if not supabase:
        log.debug("Modo simulado: se omite el barrido de pendientes.")
        return 0

    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=PENDING_EXPIRATION_MINUTES)).isoformat()
    stale = (
        supabase.table("appointments")
        .select("id")
        .eq("status", "pending")
        .lt("created_at", cutoff)
        .execute()
    )
    ids = [row["id"] for row in stale.data or []]
    if not ids:
        return 0

    supabase.table("appointments").update({"status": "cancelled"}).in_("id", ids).execute()
    log.info("Barrido: %d cita(s) pendientes expiradas → cancelled: %s", len(ids), ids)
    return len(ids)


# ----------------------------------------------------------------------------
# Watcher en segundo plano (polling periódico, estándar Tasker)
# ----------------------------------------------------------------------------
def watcher_loop(stop_event: threading.Event) -> None:
    log.info(
        "Watcher iniciado: barrido cada %ds, TTL de pendientes %d min.",
        POLL_INTERVAL_SECONDS,
        PENDING_EXPIRATION_MINUTES,
    )
    while not stop_event.is_set():
        try:
            cancelled = sweep_stale_pending()
            if cancelled:
                log.info("Watcher: %d cita(s)_limpiadas.", cancelled)
        except Exception:  # el watcher nunca debe morir
            log.exception("Error en el ciclo del watcher (se reintentará).")
        stop_event.wait(POLL_INTERVAL_SECONDS)
    log.info("Watcher detenido.")


# ----------------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------------
@app.get("/health")
def health():
    return jsonify(
        {
            "ok": True,
            "service": "barbersync-guardian",
            "supabase_connected": supabase is not None,
            "poll_interval_seconds": POLL_INTERVAL_SECONDS,
            "pending_ttl_minutes": PENDING_EXPIRATION_MINUTES,
            "time": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.post("/guardian/appointments/validate")
@require_guardian_key
def validate_appointment():
    """Valida que una nueva cita no se solape con la agenda activa del barbero.

    Body JSON: {barber_id, appointment_date ('YYYY-MM-DD'),
                start_time ('HH:MM'), duration_min? }"""
    body = request.get_json(silent=True) or {}
    required = ("barber_id", "appointment_date", "start_time")
    missing = [k for k in required if not body.get(k)]
    if missing:
        return jsonify({"ok": False, "error": f"campos requeridos: {missing}"}), 400

    conflicts = find_overlaps(
        barber_id=body["barber_id"],
        date_str=body["appointment_date"],
        start_time_str=body["start_time"],
        duration_min=_duration_minutes(body.get("duration_min")),
    )
    return jsonify({"ok": not conflicts, "conflicts": conflicts})


@app.post("/guardian/webhook")
@require_guardian_key
def supabase_webhook():
    """Receptor de Database Webhooks de Supabase para la tabla appointments.

    Configurar en: Dashboard → Database → Webhooks → tabla `appointments`,
    eventos INSERT/UPDATE, URL https://<host>/guardian/webhook con el header
    X-Guardian-Key. Aquí se enganchan las automatizaciones (p. ej. disparar el
    mensaje de WhatsApp post-confirmación o la encuesta 15 min post-servicio).
    """
    event = request.get_json(silent=True) or {}
    log.info(
        "Webhook appointments: type=%s table=%s record_id=%s",
        event.get("type"),
        event.get("table"),
        (event.get("record") or {}).get("id"),
    )
    # Punto de extensión: reaccionar a cambios de estado (completed → encuesta,
    # confirmed → WhatsApp de confirmación, etc.)
    return jsonify({"ok": True, "received": True})


@app.post("/guardian/maintenance/sweep")
@require_guardian_key
def manual_sweep():
    cancelled = sweep_stale_pending()
    return jsonify({"ok": True, "cancelled": cancelled})


# ----------------------------------------------------------------------------
# Arranque
# ----------------------------------------------------------------------------
def main() -> None:
    stop_event = threading.Event()
    watcher_thread = threading.Thread(target=watcher_loop, args=(stop_event,), daemon=True)
    watcher_thread.start()

    try:
        app.run(host="0.0.0.0", port=GUARDIAN_PORT, debug=GUARDIAN_DEBUG)
    finally:
        stop_event.set()
        watcher_thread.join(timeout=5)


if __name__ == "__main__":
    main()
