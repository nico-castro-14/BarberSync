import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  BarChart3,
  Users,
  Sparkles,
  TrendingUp,
  Calendar,
  Clock,
  Phone,
  Check,
  UserX,
  Upload,
  Eye,
  Heart,
  LogOut,
  Star,
} from 'lucide-react'
import UploadCutModal from '../components/UploadCutModal.jsx'
import { useStore } from '../hooks/useStore.js'
import { useSession } from '../hooks/useSession.js'
import { waDigits, buildWaLink, buildReviewUrl, buildReviewMessage, appointmentDateTime } from '../utils/whatsapp.js'

// VISTA 3: PANEL BARBERO — ganancias, citas en vivo y gestión de portafolio
export default function BarberDashboard() {
  const navigate = useNavigate()
  const { appointments, barbers, updateAppointmentStatus } = useStore()
  const { session, logout } = useSession()
  const [showUploadCutModal, setShowUploadCutModal] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // Sesión simulada: barbero autenticado (se reemplazará por Supabase Auth)
  const barber = barbers[0]

  if (!barber) return null

  const barberAppointments = useMemo(
    () => appointments.filter((a) => a.barberId === barber.id),
    [appointments, barber.id],
  )
  const completedAppointments = barberAppointments.filter((a) => a.status === 'completed')
  const pendingCount = barberAppointments.filter((a) => a.status === 'pending').length
  // Ganancia del día = base del turno + citas marcadas como completadas en vivo
  const completedEarned = useMemo(
    () => completedAppointments.reduce((acc, a) => acc + a.numericPrice, 0),
    [completedAppointments],
  )

  // Fase 2: 2 horas después de la hora de la cita se habilita "Pedir reseña".
  // Genera un wa.me hacia el NÚMERO DEL CLIENTE con link personalizado para
  // calificar a ESTE barbero (/calificar/:handle).
  const reviewLinkFor = (apt) => {
    if (apt.status === 'noshow') return null
    const dt = appointmentDateTime(apt.dateIso, apt.time)
    if (!dt || dt.getTime() + 2 * 60 * 60 * 1000 > Date.now()) return null
    const reviewUrl = buildReviewUrl(barber, apt.client)
    return buildWaLink(waDigits(apt.phone), buildReviewMessage(apt, barber, reviewUrl))
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Cabecera del panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-gold">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping"></span>
            <span>Estación {barber.chair} • Turno Tarde</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Panel de Control: {barber.name.split('"')[0].trim()}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            Control de ingresos, clientes en espera y actualización de portafolio
          </p>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploadCutModal(true)}
            className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-goldHover text-black font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>Subir Nuevo Corte</span>
          </button>
          <button
            onClick={() => navigate(`/barbero/${barber.handle}`)}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-brand-border transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>Ver Vista Pública</span>
          </button>
          <button
            onClick={handleLogout}
            title={session ? `Cerrar sesión de ${session.email}` : 'Cerrar sesión'}
            className="inline-flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-rose-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* TARJETAS DE GANANCIAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ganancias hoy */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Ganancias Hoy</span>
              <h3 className="text-3xl font-black text-brand-gold mt-1">
                ${(barber.earningsToday + completedEarned).toLocaleString('es-CL')}
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <TrendingUp className="w-3.5 h-3.5" /> +18% sobre la media
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Esta semana */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Esta Semana</span>
              <h3 className="text-3xl font-black text-white mt-1">${barber.earningsWeek.toLocaleString('es-CL')}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                <Calendar className="w-3.5 h-3.5" /> 14 citas atendidas
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Citas pendientes */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Citas Pendientes</span>
              <h3 className="text-3xl font-black text-white mt-1">{pendingCount}</h3>
              <p className="text-xs text-amber-400 flex items-center gap-1 mt-2">
                <Clock className="w-3.5 h-3.5" /> Próxima cita en 20 min
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Propinas */}
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Propinas Hoy</span>
              <h3 className="text-3xl font-black text-emerald-400 mt-1">
                ${barber.tipsToday.toLocaleString('es-CL')}
              </h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
                <Heart className="w-3.5 h-3.5 fill-emerald-400" /> 100% para el barbero
              </p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* TIMELINE DE CITAS DE HOY */}
      <div className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-gold" />
              Agenda de Hoy en {barber.chair} (Cronograma en Vivo)
            </h2>
            <p className="text-xs text-brand-muted">
              Marca completado tras atender para disparar la encuesta automática de WhatsApp
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-brand-dark px-3 py-1.5 rounded-xl border border-brand-border">
            Filtrando citas para: <strong className="text-white">{barber.name.split('"')[0].trim()}</strong>
          </div>
        </div>

        <div className="space-y-3">
          {barberAppointments.map((apt) => (
            <div
              key={apt.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                apt.status === 'completed'
                  ? 'bg-[#0E151E]/60 border-emerald-500/30 opacity-80'
                  : apt.status === 'noshow'
                    ? 'bg-[#180E10]/60 border-rose-500/30 opacity-60'
                    : 'bg-[#0E121A] border-brand-border hover:border-slate-600'
              }`}
            >
              {/* Hora y datos del cliente */}
              <div className="flex items-start sm:items-center gap-4">
                <div
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center min-w-[80px] ${
                    apt.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : apt.status === 'noshow'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20'
                  }`}
                >
                  <Clock className="w-4 h-4 mb-0.5" />
                  <span className="text-xs font-black">{apt.time}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{apt.client}</h3>
                    {apt.status === 'completed' && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✓ Completado
                      </span>
                    )}
                    {apt.status === 'noshow' && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        Inasistencia
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-gold font-semibold mt-0.5">{apt.service}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" /> {apt.phone}
                    </span>
                    <span>•</span>
                    <span className="text-white font-extrabold">{apt.price}</span>
                  </div>
                </div>
              </div>

              {/* Botones interactivos */}
              <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-brand-border">
                {reviewLinkFor(apt) && (
                  <a
                    href={reviewLinkFor(apt)}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir WhatsApp del cliente con el link de calificación"
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-brand-gold border border-brand-gold/40 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all"
                  >
                    <Star className="w-4 h-4 fill-brand-gold" />
                    <span>Pedir reseña</span>
                  </a>
                )}
                {apt.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Marcar Completado</span>
                    </button>

                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'noshow')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all"
                    >
                      <UserX className="w-4 h-4" />
                      <span>No asistió</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => updateAppointmentStatus(apt.id, 'pending')}
                    className="text-xs text-slate-400 hover:text-white underline px-3 py-1.5"
                  >
                    Reabrir estado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <UploadCutModal open={showUploadCutModal} onClose={() => setShowUploadCutModal(false)} barber={barber} />
    </div>
  )
}
