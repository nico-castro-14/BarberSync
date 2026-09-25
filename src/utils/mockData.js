// ============================================================
// Datos base — BARBER NEW YARK (Cra 6 # 0-72, Cajicá)
// Esta data sirve para poblar Supabase en la migración (seed).
// Mientras tanto alimenta el modo demo del frontend.
// ============================================================
import jhonAvatar from '../assets/barbers/jhon.png'
import rodolfoAvatar from '../assets/barbers/rodolfo.png'
import leonardoAvatar from '../assets/barbers/leonardo.png'
import rafaelAvatar from '../assets/barbers/rafael.png'
import andyAvatar from '../assets/barbers/andy.png'
import { todayIso } from './format.js'

// ------------------------------------------------------------
// Negocio (tabla business_settings futura)
// ------------------------------------------------------------
export const BUSINESS_INFO = {
  name: 'Barber New Yark',
  tagline: 'Estilo y moda desde 2014 en el corazón de Cajicá',
  address: 'Cra 6 # 0-72, Cajicá, Cundinamarca',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Barber New Yark, Cra 6 # 0-72, Cajicá, Cundinamarca'),
  phone: '+57 310 000 0000',
  cancellationPolicy: 'Cancelación gratuita hasta 2 horas antes de la cita.',
  // Fase 2: programa de fidelidad (tarjeta de sellos). Se activa desde /admin.
  loyaltyEnabled: false,
  loyaltyGoal: 6, // sellos para el beneficio
  // Horarios estructurados (fuente única para generateTimeSlots)
  weekdayOpen: '08:00', // Lunes a Sábado
  weekdayClose: '20:00',
  sundayOpen: '08:00', // Domingo
  sundayClose: '19:00',
}

// Sello B2B visible en el footer
export const PLATFORM_CREDIT = 'Plataforma tecnológica impulsada por Detaim S.A.S.'

// ------------------------------------------------------------
// Servicios exactos de la barbería (tabla: services)
// ------------------------------------------------------------
export const SERVICES = [
  {
    id: 's1',
    name: 'Corte de cabello',
    price: '$25.000',
    numericPrice: 25000,
    duration: '45 min',
    durationMin: 45,
    desc: 'Corte a máquina o tijera, acabado con navaja en contornos y peinado final.',
    icon: 'scissors',
    popular: true,
    tag: 'Cabello',
  },
  {
    id: 's2',
    name: 'Corte de barba',
    price: '$20.000',
    numericPrice: 20000,
    duration: '30 min',
    durationMin: 30,
    desc: 'Perfilado y diseño de barba con navaja, toalla caliente y aceites.',
    icon: 'spray-can',
    popular: false,
    tag: 'Barba',
  },
  {
    id: 's3',
    name: 'Depilación de cejas',
    price: '$5.000',
    numericPrice: 5000,
    duration: '15 min',
    durationMin: 15,
    desc: 'Perfilado de cejas a navaja o cera, acabado limpio y natural.',
    icon: 'eye',
    popular: false,
    tag: 'Cejas',
  },
  {
    id: 's4',
    name: 'Corte de cabello y diseño de barba',
    price: '$35.000',
    numericPrice: 35000,
    duration: '60 min',
    durationMin: 60,
    desc: 'El combo insignia: corte completo + diseño de barba con toalla caliente.',
    icon: 'crown',
    popular: true,
    tag: 'Combo',
  },
]

// ------------------------------------------------------------
// Equipo (tabla: barbers) — fotos reales en src/assets/barbers
// ------------------------------------------------------------
export const BARBERS_DATA = [
  {
    id: 'b1',
    name: 'Jhon',
    handle: 'jhon',
    role: 'Master Barber & Fundador',
    rating: 4.9,
    reviews: 412,
    initials: 'JH',
    color: 'from-amber-600 to-yellow-500',
    chair: 'Silla 01',
    avatar: jhonAvatar,
    active: true,
    bio: 'Fundador de Barber New Yark. 15 años perfeccionando fades y cortes clásicos en Cajicá.',
    specialties: ['Cabello', 'Fade', 'Combo'],
    earningsToday: 150000,
    earningsWeek: 860000,
    tipsToday: 18000,
    phone: '+57 310 456 7812',
  },
  {
    id: 'b2',
    name: 'Rodolfo',
    handle: 'rodolfo',
    role: 'Especialista en Barba',
    rating: 4.8,
    reviews: 287,
    initials: 'RD',
    color: 'from-stone-600 to-zinc-800',
    chair: 'Silla 02',
    avatar: rodolfoAvatar,
    active: true,
    bio: 'Navaja libre, toalla caliente y diseño de barba con precisión artesanal.',
    specialties: ['Barba', 'Clásico'],
    earningsToday: 120000,
    earningsWeek: 690000,
    tipsToday: 12000,
    phone: '+57 311 523 9041',
  },
  {
    id: 'b3',
    name: 'Leonardo',
    handle: 'leonardo',
    role: 'Barbero Senior & Fades',
    rating: 4.9,
    reviews: 231,
    initials: 'LE',
    color: 'from-yellow-700 to-amber-900',
    chair: 'Silla 03',
    avatar: leonardoAvatar,
    active: true,
    bio: 'Degradados milimétricos y cortes urbanos de tendencia.',
    specialties: ['Fade', 'Cabello'],
    earningsToday: 135000,
    earningsWeek: 740000,
    tipsToday: 9500,
    phone: '+57 312 774 3025',
  },
  {
    id: 'b4',
    name: 'Rafael',
    handle: 'rafael',
    role: 'Barbero & Detalle de Cejas',
    rating: 4.8,
    reviews: 198,
    initials: 'RF',
    color: 'from-neutral-700 to-stone-500',
    chair: 'Silla 04',
    avatar: rafaelAvatar,
    active: false, // ejemplo: hoy no está disponible (toggle en Admin)
    bio: 'Detalle fino: perfilado de cejas, barbas y acabados impecables.',
    specialties: ['Cejas', 'Barba'],
    earningsToday: 0,
    earningsWeek: 580000,
    tipsToday: 0,
    phone: '+57 313 845 1177',
  },
  {
    id: 'b5',
    name: 'Andy',
    handle: 'andy',
    role: 'Estilista Freestyle & Color',
    rating: 4.9,
    reviews: 264,
    initials: 'AN',
    color: 'from-amber-700 to-yellow-900',
    chair: 'Silla 05',
    avatar: andyAvatar,
    active: true,
    bio: 'Estilos libres, color y cortes con personalidad. El favorito de los jóvenes.',
    specialties: ['Cabello', 'Fade', 'Combo'],
    earningsToday: 140000,
    earningsWeek: 795000,
    tipsToday: 14000,
    phone: '+57 314 992 6650',
  },
]

// ------------------------------------------------------------
// Agenda (fechas: HOY + 5 días, generadas dinámicamente)
// ------------------------------------------------------------
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function buildUpcomingDates(count = 6) {
  const dates = []
  const base = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const iso = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-')
    dates.push({
      dayName: i === 0 ? 'Hoy' : DAY_NAMES[d.getDay()],
      dateStr: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
      dayNum: String(d.getDate()),
      iso,
    })
  }
  return dates
}

export const DATES = buildUpcomingDates(6)

// ------------------------------------------------------------
// Portafolio inicial (tabla: portfolio_items)
// Las fotos reales salen de public/cortes (copiadas de la carpeta Cortes/)
// y se asignan aleatoriamente sin repetirse a cada trabajo demo.
// ------------------------------------------------------------
const CUT_PHOTOS = Array.from({ length: 10 }, (_, i) => `/cortes/corte-${i + 1}.png`)

// Fisher-Yates: baraja el pool de fotos para repartirlas sin repetir
function shufflePhotos(pool) {
  const arr = [...pool]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const shuffledCutPhotos = shufflePhotos(CUT_PHOTOS)
const randomCutPhoto = (index) => shuffledCutPhotos[index % shuffledCutPhotos.length]

export const INITIAL_WORKS = [
  { id: 101, title: 'Fade medio + barba perfilada', barberId: 'b1', barberName: 'Jhon', tag: 'Combo', likes: 214, liked: false, desc: 'Degradado limpio con diseño de barba y toalla caliente.', imageBg: 'from-amber-950/40 via-stone-900 to-black', imageUrl: randomCutPhoto(0) },
  { id: 102, title: 'Corte clásico ejecutivo', barberId: 'b2', barberName: 'Rodolfo', tag: 'Clásico', likes: 96, liked: false, desc: 'Tijera sobre peine, raya lateral y acabado formal.', imageBg: 'from-stone-900 via-neutral-950 to-black', imageUrl: randomCutPhoto(1) },
  { id: 103, title: 'Low fade con textura', barberId: 'b3', barberName: 'Leonardo', tag: 'Fade', likes: 187, liked: false, desc: 'Fade bajo pulido con texturizado superior.', imageBg: 'from-amber-900/30 via-stone-900 to-black', imageUrl: randomCutPhoto(2) },
  { id: 104, title: 'Perfilado de cejas a navaja', barberId: 'b4', barberName: 'Rafael', tag: 'Cejas', likes: 73, liked: false, desc: 'Cejas limpias y simétricas con detalle a navaja.', imageBg: 'from-neutral-900 via-stone-950 to-black', imageUrl: randomCutPhoto(3) },
  { id: 105, title: 'Corte urbano + freestyle', barberId: 'b5', barberName: 'Andy', tag: 'Cabello', likes: 342, liked: false, desc: 'Corte de tendencia con línea freestyle y styling mate.', imageBg: 'from-zinc-900 via-neutral-900 to-black', imageUrl: randomCutPhoto(4) },
  { id: 106, title: 'Combo insignia New Yark', barberId: 'b1', barberName: 'Jhon', tag: 'Combo', likes: 265, liked: false, desc: 'Corte + diseño de barba completo, la experiencia de la casa.', imageBg: 'from-yellow-950/20 via-zinc-900 to-black', imageUrl: randomCutPhoto(5) },
]

// ------------------------------------------------------------
// Citas de hoy (tabla: appointments) — demo en vivo
// ------------------------------------------------------------
const TODAY = todayIso()
export const INITIAL_APPOINTMENTS = [
  { id: 'apt-1', time: '09:00 AM', client: 'Andrés Morales', phone: '+57 310 234 1120', service: 'Corte de cabello y diseño de barba', price: '$35.000', numericPrice: 35000, status: 'completed', barberId: 'b1', dateIso: TODAY },
  { id: 'apt-2', time: '10:30 AM', client: 'Diego Castro', phone: '+57 311 712 9043', service: 'Corte de cabello', price: '$25.000', numericPrice: 25000, status: 'completed', barberId: 'b1', dateIso: TODAY },
  { id: 'apt-3', time: '12:30 PM', client: 'Esteban Ruiz', phone: '+57 312 554 2219', service: 'Corte de barba', price: '$20.000', numericPrice: 20000, status: 'pending', barberId: 'b1', dateIso: TODAY },
  { id: 'apt-4', time: '03:00 PM', client: 'Martín Vergara', phone: '+57 313 120 4488', service: 'Corte de cabello', price: '$25.000', numericPrice: 25000, status: 'pending', barberId: 'b1', dateIso: TODAY },
  { id: 'apt-5', time: '05:30 PM', client: 'Camilo Pardo', phone: '+57 314 431 8765', service: 'Corte de cabello y diseño de barba', price: '$35.000', numericPrice: 35000, status: 'pending', barberId: 'b1', dateIso: TODAY },
  { id: 'apt-6', time: '07:00 PM', client: 'Felipe Sandoval', phone: '+57 315 211 4455', service: 'Depilación de cejas', price: '$5.000', numericPrice: 5000, status: 'pending', barberId: 'b1', dateIso: TODAY },
]

// -> Tabla: reviews (futura; alimentada vía WhatsApp post-servicio)
export const REVIEWS_MATEO = [
  { author: 'Cristóbal Valenzuela', rating: 5, date: 'Ayer', text: 'La mejor barbería de Cajicá. Jhon deja el fade perfecto y la atención es de otro nivel.', verified: true },
  { author: 'Rodrigo Astudillo', rating: 5, date: 'Hace 3 días', text: 'El combo cabello + barba de Barber New Yark vale cada peso. Puntualidad total con la reserva.', verified: true },
  { author: 'Ignacio Palma', rating: 5, date: 'Hace 1 semana', text: 'Barber New Yark es tradición desde 2014 y se nota. Ambiente increíble y resultado impecable.', verified: true },
]

export const PORTFOLIO_TAGS = ['Todos', 'Cabello', 'Barba', 'Cejas', 'Fade', 'Combo', 'Clásico']
export const CUT_TAGS = PORTFOLIO_TAGS.filter((t) => t !== 'Todos')

// Icono sugerido por tag de servicio (mapa usado al crear/editar servicios)
export const SERVICE_TAG_ICONS = {
  Cabello: 'scissors',
  Barba: 'spray-can',
  Cejas: 'eye',
  Combo: 'crown',
  Fade: 'sparkles',
}
