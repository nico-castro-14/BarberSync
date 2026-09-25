// ============================================================
// Capa de datos Supabase — BarberSync PRO
//
// Estrategia híbrida:
//   - Si VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY están definidas,
//     el catálogo (servicios, barberos, portafolio, citas de hoy) se lee
//     de Supabase y las escrituras persisten en la base de datos.
//   - Si NO están definidas (o cualquier query falla), la app conserva
//     los mocks de src/utils/mockData.js (modo demo intacto).
// ============================================================
import { supabase, isSupabaseConfigured } from './supabaseClient.js'
import { formatCLP, to12Hour, todayIso } from '../utils/format.js'

const SERVICE_ICON_BY_TAG = {
  Fade: 'sparkles',
  Barba: 'spray-can',
  Mullet: 'flame',
  Tinte: 'paint-brush',
  Clásico: 'scissors',
  Texturizado: 'scissors',
}

const DEFAULT_BARBER_COLOR = 'from-amber-600 to-yellow-500'

/** "00:45:00" | intervalo | número -> minutos */
function intervalToMinutes(raw) {
  if (typeof raw === 'string' && raw.includes(':')) {
    const [h, m] = raw.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  if (typeof raw === 'number') return raw
  return 45
}

function intervalToLabel(raw) {
  return `${intervalToMinutes(raw)} min`
}

function mapService(row) {
  return {
    id: row.id,
    name: row.name,
    price: formatCLP(row.price),
    numericPrice: Number(row.price),
    duration: intervalToLabel(row.duration),
    durationMin: intervalToMinutes(row.duration),
    desc: row.description ?? '',
    icon: SERVICE_ICON_BY_TAG[row.tag] ?? 'scissors',
    popular: Boolean(row.is_popular),
    tag: row.tag ?? 'Cabello',
  }
}

function mapBarber(row) {
  const name = row.profiles?.name ?? row.handle
  const initials = name
    .replaceAll('"', '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return {
    id: row.id,
    name,
    handle: row.handle,
    role: row.bio?.split('.')[0] || 'Barber Staff',
    rating: Number(row.rating ?? 5),
    reviews: 0,
    initials: initials || 'BN',
    color: row.color ?? DEFAULT_BARBER_COLOR,
    chair: row.chair ?? 'Silla',
    avatar: null, // las fotos de Storage se asignan tras la migración
    active: row.active ?? true,
    bio: row.bio ?? '',
    specialties: [],
    earningsToday: 0,
    earningsWeek: 0,
    tipsToday: 0,
    phone: row.profiles?.phone ?? '',
  }
}

function mapPortfolio(row) {
  return {
    id: row.id,
    title: row.title,
    barberId: row.barber_id,
    barberName: row.barbers?.profiles?.name ?? row.barbers?.handle ?? '',
    tag: row.tag,
    likes: row.likes ?? 0,
    liked: false,
    desc: row.description ?? '',
    imageUrl: row.image_url ?? null,
    imageBg: 'from-amber-900/40 via-stone-900 to-black',
  }
}

function mapAppointment(row) {
  return {
    id: row.id,
    time: to12Hour(row.start_time),
    client: row.client_name ?? row.client?.name ?? 'Cliente',
    phone: row.client_phone ?? row.client?.phone ?? '',
    service: row.services?.name ?? '',
    price: formatCLP(row.total_price),
    numericPrice: Number(row.total_price ?? 0),
    status: row.status,
    barberId: row.barber_id,
    dateIso: row.appointment_date,
  }
}

/**
 * Carga el catálogo completo desde Supabase.
 * @returns estructura lista para hidratar el StoreContext, o null si la
 *          app debe permanecer en modo demo (sin credenciales o error).
 */
export async function fetchCatalog() {
  if (!isSupabaseConfigured) return null

  const [servicesRes, barbersRes, portfolioRes, appointmentsRes] = await Promise.all([
    supabase.from('services').select('*').order('price', { ascending: true }),
    supabase.from('barbers').select('*, profiles(name, phone)'),
    supabase
      .from('portfolio_items')
      .select('*, barbers(handle, profiles(name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('*, services(name), client:profiles!appointments_client_id_fkey(name, phone)')
      .eq('appointment_date', todayIso())
      .in('status', ['pending', 'confirmed', 'completed', 'noshow']),
  ])

  // Cualquier error duro (RLS, red, tabla inexistente) → fallback a mocks.
  for (const res of [servicesRes, barbersRes, portfolioRes, appointmentsRes]) {
    if (res.error) {
      console.warn('[data] Error leyendo Supabase, se mantiene modo demo:', res.error.message)
      return null
    }
  }

  return {
    services: (servicesRes.data ?? []).map(mapService),
    barbers: (barbersRes.data ?? []).map(mapBarber),
    portfolioItems: (portfolioRes.data ?? []).map(mapPortfolio),
    appointments: (appointmentsRes.data ?? []).map(mapAppointment),
  }
}

/** Inserta una cita de invitado (sin cuenta) — permitido por la política RLS
 *  `appointments_public_insert` (status 'pending'). */
export async function insertAppointment({ barberId, serviceId, dateIso, time12, totalPrice, clientName, clientPhone }) {
  const payload = {
    barber_id: barberId,
    service_id: serviceId,
    appointment_date: dateIso,
    start_time: to24hourSafe(time12),
    status: 'pending',
    total_price: totalPrice,
    client_name: clientName,
    client_phone: clientPhone,
    client_id: null,
  }
  const { data, error } = await supabase.from('appointments').insert(payload).select().single()
  if (error) throw error
  return data
}

function to24hourSafe(time12) {
  // import local para evitar circularidades en tests de formato
  const match = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(time12 || '')
  if (!match) return time12
  let hours = Number(match[1])
  const minutes = match[2]
  const meridiem = match[3].toUpperCase()
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  return `${String(hours).padStart(2, '0')}:${minutes}:00`
}

export async function updateAppointment(id, fields) {
  const { error } = await supabase.from('appointments').update(fields).eq('id', id)
  if (error) throw error
}

export async function deleteAppointment(id) {
  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) throw error
}

export async function insertPortfolioItem({ barberId, title, tag, description, likes = 1 }) {
  const payload = { barber_id: barberId, title, tag, description, likes }
  const { data, error } = await supabase.from('portfolio_items').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updatePortfolioLikes(id, likes) {
  const { error } = await supabase.from('portfolio_items').update({ likes }).eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------
// CRUD de servicios (Admin) — requiere política services_admin_write
// ------------------------------------------------------------
export async function insertService({ name, numericPrice, durationMin, desc, tag, popular }) {
  const payload = {
    name,
    price: numericPrice,
    duration: `${durationMin} minutes`,
    description: desc,
    tag,
    is_popular: Boolean(popular),
  }
  const { data, error } = await supabase.from('services').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateServiceById(id, { name, numericPrice, durationMin, desc, tag, popular }) {
  const payload = {
    name,
    price: numericPrice,
    duration: `${durationMin} minutes`,
    description: desc,
    tag,
    is_popular: Boolean(popular),
  }
  const { error } = await supabase.from('services').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteServiceById(id) {
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------
// Equipo (Admin): activar / desactivar barbero del día
// ------------------------------------------------------------
export async function setBarberActive(id, active) {
  const { error } = await supabase.from('barbers').update({ active }).eq('id', id)
  if (error) throw error
}

// insertPortfolioItem ahora acepta la URL de la foto en Storage
export async function insertPortfolioItemWithImage({ barberId, title, tag, description, likes = 1, imageUrl = null }) {
  const payload = { barber_id: barberId, title, tag, description, likes, image_url: imageUrl }
  const { data, error } = await supabase.from('portfolio_items').insert(payload).select().single()
  if (error) throw error
  return data
}
