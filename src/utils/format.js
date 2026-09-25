// Utilidades de formato compartidas por la UI y la capa de datos.

/** 22000 -> "$22.000" (es-CL) */
export function formatCLP(value) {
  return `$${Number(value || 0).toLocaleString('es-CL')}`
}

/** "02:00 PM" -> "14:00" (formato HH:MM 24h para la columna time de Postgres) */
export function to24Hour(time12) {
  const match = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(time12 || '')
  if (!match) return time12
  let hours = Number(match[1])
  const minutes = match[2]
  const meridiem = match[3].toUpperCase()
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}`
}

/** "14:00:00" | "14:00" -> "02:00 PM" (formato 12h de la UI) */
export function to12Hour(time24) {
  const [hRaw, mRaw] = String(time24 || '').split(':')
  const hours = Number(hRaw)
  if (Number.isNaN(hours)) return time24
  const meridiem = hours >= 12 ? 'PM' : 'AM'
  const h12 = hours % 12 === 0 ? 12 : hours % 12
  return `${String(h12).padStart(2, '0')}:${mRaw ?? '00'} ${meridiem}`
}

/** Fecha local de hoy en formato YYYY-MM-DD (para appointment_date) */
export function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** id tipo uuid v4 (para decidir si un registro ya vive en Supabase) */
export function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value))
}
