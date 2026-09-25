// ============================================================
// Motor de horarios — Barber New Yark
// Genera la grilla de slots disponibles para un día dado.
//
// Regla estricta de cierre:
//   - Domingo: el último slot debe TERMINAR a las 19:00.
//   - Lunes a Sábado: el último slot debe TERMINAR a las 20:00.
// Un slot solo se renderiza si (inicio + duración del servicio) <= cierre.
// ============================================================
import { to24Hour, to12Hour, todayIso } from './format.js'

export const DEFAULT_INTERVAL_MIN = 30

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number)
  return h * 60 + m
}

function toHHMM(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * @param {string} dateIso            Fecha 'YYYY-MM-DD' seleccionada.
 * @param {number} dayOfWeek          0 = Domingo … 6 = Sábado.
 * @param {{weekly:{open:string, close:string}, sunday:{open:string, close:string}}} businessHours
 * @param {Array}  appointments       Citas del día (para bloquear slots ocupados).
 * @param {object} options
 * @param {number} options.intervalMin Paso de la grilla (30 o 45 min).
 * @param {number} options.durationMin Duración del servicio seleccionado.
 * @param {string} [options.barberId]  Filtrar agenda por barbero.
 * @returns {Array<{time:string, start:string, available:boolean}>}
 */
export function generateTimeSlots(dateIso, dayOfWeek, businessHours, appointments = [], options = {}) {
  const { intervalMin = DEFAULT_INTERVAL_MIN, durationMin = 45, barberId = null } = options

  const isSunday = dayOfWeek === 0
  const hours = isSunday ? businessHours.sunday : businessHours.weekly
  const openMin = toMinutes(hours.open) // 08:00
  const closeMin = toMinutes(hours.close) // 19:00 dom / 20:00 lun-sáb

  // Ventanas ocupadas de la agenda del barbero en esa fecha
  const busy = appointments
    .filter(
      (a) =>
        a.dateIso === dateIso &&
        (!barberId || a.barberId === barberId) &&
        a.status !== 'cancelled' &&
        a.status !== 'noshow',
    )
    .map((a) => {
      const start = toMinutes(to24Hour(a.time))
      return { start, end: start + (a.durationMin ?? 45) }
    })

  // Si la fecha es hoy, bloquear horas que ya pasaron
  const now = new Date()
  const nowMin = dateIso === todayIso() ? now.getHours() * 60 + now.getMinutes() : -1

  const slots = []
  for (let start = openMin; start + durationMin <= closeMin; start += intervalMin) {
    const end = start + durationMin
    const overlaps = busy.some((b) => start < b.end && b.start < end)
    const inPast = start <= nowMin
    slots.push({
      time: to12Hour(toHHMM(start)), // "08:30 AM" (formato de la UI)
      start: toHHMM(start), // "08:30" (formato 24h para la DB)
      available: !overlaps && !inPast,
    })
  }
  return slots
}
