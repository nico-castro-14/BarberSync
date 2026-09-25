// ============================================================
// Utilidades wa.me — mensajería SIN la API de Meta.
// Los links https://wa.me/<numero>?text=<msg> abren WhatsApp con
// el mensaje prellenado: gratis, sin plantillas ni aprobación.
// ============================================================
import { to24Hour } from './format.js'

// WhatsApp oficial de la barbería (recibe las confirmaciones de reserva)
export const BARBERSHOP_WA_NUMBER = '573124769501'

/** Normaliza un teléfono escrito por el cliente a dígitos internacionales (CO). */
export function waDigits(phone) {
  let digits = String(phone || '').replace(/\D/g, '')
  if (digits.startsWith('57') && digits.length === 12) return digits
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`
  return digits
}

/** URL clic-a-chatear: https://wa.me/<destino>?text=<mensaje> */
export function buildWaLink(targetDigits, message) {
  return `https://wa.me/${targetDigits}?text=${encodeURIComponent(message)}`
}

/** Date local de la cita a partir de dateIso ("2026-09-23") + hora "03:00 PM". */
export function appointmentDateTime(dateIso, time12) {
  const time24 = to24Hour(time12)
  const d = new Date(`${dateIso}T${time24.length === 5 ? `${time24}:00` : time24}`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Link público único de la cita (la página /cita reconstruye el ticket). */
export function buildAppointmentUrl(booking) {
  const params = new URLSearchParams({
    cliente: booking.client,
    servicio: booking.service,
    barbero: booking.barberName,
    silla: booking.chair ?? '',
    fecha: booking.dateStr,
    hora: booking.time,
    precio: booking.price,
  })
  return `${window.location.origin}/cita?${params.toString()}`
}

// WhatsApp muestra como "cita destacada" (bloque gris) cada línea que
// empieza con "> "; por eso TODAS las líneas del mensaje lo llevan.
const quoteLine = (line) => `> ${line}`

/** Mensaje de confirmación que el cliente envía a la barbería. */
export function buildConfirmMessage(booking, appointmentUrl) {
  const lines = [
    '✂️ *NUEVA CITA CONFIRMADA*',
    '',
    `👤 Cliente: ${booking.client}`,
    `💈 Servicio: ${booking.service}`,
    `🧔 Barbero: ${booking.barberName} (${booking.chair})`,
    `📅 Fecha: ${booking.dateStr}`,
    `⏰ Hora: ${booking.time}`,
    `💰 Total en local: ${booking.price}`,
    `🔗 Mi cita: ${appointmentUrl}`,
    '',
    'Confirmado por BarberSync ✅',
  ]
  return lines.map(quoteLine).join('\n')
}

/** Mensaje post-servicio (lo envía el barbero al cliente) con link a calificar. */
export function buildReviewMessage(appointment, barber, reviewUrl) {
  const firstName = String(appointment.client || '').split(' ')[0]
  const lines = [
    `¡Hola ${firstName}! 💈`,
    '',
    `Gracias por visitar Barber New Yark. Tu ${appointment.service} con ${barber.name} ya está listo en nuestro historial.`,
    '',
    '¿Nos regalas 20 segundos para calificar tu corte? Tu opinión aparece verificada en el portafolio:',
    `⭐ ${reviewUrl}`,
    '',
    'Confirmado por BarberSync ✅',
  ]
  return lines.map(quoteLine).join('\n')
}

/** Link público del barbero para calificar (con nombre del cliente precargado). */
export function buildReviewUrl(barber, clientName) {
  const params = new URLSearchParams()
  if (clientName) params.set('cliente', clientName)
  return `${window.location.origin}/calificar/${barber.handle}${params.toString() ? `?${params}` : ''}`
}
