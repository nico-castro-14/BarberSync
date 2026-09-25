import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  Image,
  Clock,
  ShieldCheck,
  User,
  MessageCircle,
  CalendarCheck,
  ArrowRight,
  MapPin,
} from 'lucide-react'
import Stepper from '../components/Stepper.jsx'
import ServiceCard from '../components/ServiceCard.jsx'
import BarberCard from '../components/BarberCard.jsx'
import { DATES, BUSINESS_INFO } from '../utils/mockData.js'
import { generateTimeSlots } from '../utils/schedule.js'
import { useBooking } from '../hooks/useBooking.js'
import { useStore } from '../hooks/useStore.js'
import logo from '../assets/brand/logo.jpg'

// VISTA 1: CLIENTE — Reserva ultra-simple con stepper y confirmación WhatsApp
export default function ClientBooking() {
  const navigate = useNavigate()
  const {
    selectedService,
    selectedBarber,
    selectedDate,
    selectedTime,
    clientForm,
    currentStep,
    setSelectedService,
    setSelectedBarber,
    setSelectedDate,
    setSelectedTime,
    setClientForm,
    confirmBooking,
  } = useBooking()
  const { services, barbers, appointments, businessInfo, loyaltyStampsFor } = useStore()

  const portfolioLink = `/barbero/${barbers[0]?.handle ?? 'jhon'}`

  // ---- Calendario dinámico -------------------------------------------------
  // Horarios estructurados del negocio (editables desde /admin → Configuración)
  const businessHours = useMemo(
    () => ({
      weekly: { open: businessInfo.weekdayOpen, close: businessInfo.weekdayClose },
      sunday: { open: businessInfo.sundayOpen, close: businessInfo.sundayClose },
    }),
    [businessInfo],
  )

  const selectedDayOfWeek = new Date(`${selectedDate.iso}T00:00:00`).getDay()

  // Regla estricta: los slots se generan por día; el último siempre termina
  // antes del cierre (Dom 19:00 · Lun-Sáb 20:00) y bloquea la agenda ocupada.
  const timeSlots = useMemo(
    () =>
      generateTimeSlots(selectedDate.iso, selectedDayOfWeek, businessHours, appointments, {
        intervalMin: 30,
        durationMin: selectedService.durationMin ?? 45,
        barberId: selectedBarber.id,
      }),
    [selectedDate.iso, selectedDayOfWeek, businessHours, appointments, selectedService, selectedBarber.id],
  )

  // Si la hora seleccionada deja de estar disponible, saltar al primer slot libre
  useEffect(() => {
    const stillAvailable = timeSlots.some((s) => s.time === selectedTime && s.available)
    if (!stillAvailable) {
      const firstAvailable = timeSlots.find((s) => s.available)
      setSelectedTime(firstAvailable ? firstAvailable.time : null)
    }
  }, [timeSlots, selectedTime, setSelectedTime])

  const handleSubmit = (e) => {
    e.preventDefault()
    confirmBooking()
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Marca compacta (sin navbar: la home del cliente va directa a reservar) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt={BUSINESS_INFO.name}
            className="w-11 h-11 rounded-full object-cover border border-brand-border shadow-lg shadow-amber-500/10"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">Barber New Yark</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-brand-gold/15 border border-brand-gold/40 text-brand-gold">
                Desde 2014
              </span>
            </div>
            <p className="text-xs text-brand-muted hidden sm:block">{BUSINESS_INFO.address}</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-300 px-3.5 py-2 rounded-xl bg-brand-card border border-brand-border">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Cajicá • {barbers.filter((b) => b.active !== false).length} Sillas Activas</span>
        </div>
      </div>

      {/* Hero minimalista directo */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-card via-[#161C28] to-brand-card border border-brand-border p-6 sm:p-10 shadow-2xl">
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-2xl relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs font-extrabold uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5" /> Fricción Cero • Sin Registro Previo
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Tu estilo impecable, <span className="gold-gradient-text">sin filas ni esperas.</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-normal">
            Selecciona tu servicio, tu barbero favorito y confirma tu hora en segundos con recordatorio automatizado a
            tu WhatsApp.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate(portfolioLink)}
              className="inline-flex items-center gap-2 text-xs font-bold text-brand-gold hover:text-amber-400 underline underline-offset-4"
            >
              <Image className="w-3.5 h-3.5" />
              Ver portafolio de cortes con fotos reales antes de reservar
            </button>
            <a
              href={BUSINESS_INFO.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/5 hover:bg-white/10 border border-brand-border px-3.5 py-2 rounded-xl transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-gold" />
              Cómo llegar — {BUSINESS_INFO.address}
            </a>
          </div>
        </div>
      </div>

      {/* Formulario de reserva con stepper visual */}
      <form onSubmit={handleSubmit} className="space-y-12">
        <Stepper currentStep={currentStep} />

        {/* PASO 1: SELECCIONA TU SERVICIO */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-gold text-black font-black text-sm flex items-center justify-center shadow-md">
                1
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">Selecciona tu Servicio</h2>
                <p className="text-xs text-brand-muted">Tarifas claras sin cargos ocultos</p>
              </div>
            </div>
            <span className="text-xs text-brand-muted hidden sm:inline-block">
              Pago directo en el local (Efectivo / Tarjeta)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                selected={selectedService.id === svc.id}
                onSelect={setSelectedService}
              />
            ))}
          </div>
        </section>

        {/* PASO 2: ELIGE A TU PROFESIONAL */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-gold text-black font-black text-sm flex items-center justify-center shadow-md">
                2
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">Elige a tu Profesional</h2>
                <p className="text-xs text-brand-muted">Todos los barberos cuentan con certificación y experiencia</p>
              </div>
            </div>
            <span
              className="text-xs text-brand-gold cursor-pointer hover:underline"
              onClick={() => navigate(portfolioLink)}
            >
              Ver fotos y reseñas de cada uno →
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {barbers.map((barber) => (
              <BarberCard
                key={barber.id}
                barber={barber}
                selected={selectedBarber.id === barber.id}
                onSelect={setSelectedBarber}
              />
            ))}
          </div>
        </section>

        {/* PASO 3: FECHA Y HORARIO DISPONIBLE */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-gold text-black font-black text-sm flex items-center justify-center shadow-md">
                3
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">Fecha y Horario Disponible</h2>
                <p className="text-xs text-brand-muted">
                  Agenda en vivo para {selectedBarber.name.split(' ')[0]} ({selectedBarber.chair})
                </p>
              </div>
            </div>
          </div>

          {/* Selector de días */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {DATES.map((d) => {
              const isSelectedDate = selectedDate.iso === d.iso
              return (
                <button
                  type="button"
                  key={d.iso}
                  onClick={() => setSelectedDate(d)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center py-3.5 px-5 rounded-2xl border min-w-[95px] transition-all duration-200 ${
                    isSelectedDate
                      ? 'bg-brand-gold text-black border-brand-gold font-bold shadow-lg shadow-amber-500/15'
                      : 'bg-brand-card border-brand-border text-slate-300 hover:border-slate-500 hover:bg-brand-cardHover'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">{d.dayName}</span>
                  <span className="text-xl font-black">{d.dayNum}</span>
                </button>
              )
            })}
          </div>

          {/* Grid de horas */}
          <div className="bg-brand-card/80 border border-brand-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-gold" /> Horarios disponibles para {selectedDate.dayName}{' '}
                {selectedDate.dateStr}
              </span>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-gold"></span> Seleccionado
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span> Agotado
                </span>
              </div>
            </div>

            {timeSlots.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">
                No quedan horarios disponibles para este día. Prueba con otra fecha.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {timeSlots.map((slot) => {
                  const isTimeSelected = selectedTime === slot.time
                  if (!slot.available) {
                    return (
                      <div
                        key={slot.start}
                        className="py-3 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-slate-600 text-center text-xs font-medium cursor-not-allowed line-through flex items-center justify-center gap-1"
                      >
                        {slot.time}
                      </div>
                    )
                  }
                  return (
                    <button
                      type="button"
                      key={slot.start}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-3 px-3 rounded-xl text-center text-xs font-bold transition-all duration-200 border ${
                        isTimeSelected
                          ? 'bg-brand-gold text-black border-brand-gold shadow-md font-extrabold scale-105'
                          : 'bg-[#0E121A] text-slate-200 border-brand-border hover:border-brand-gold/60 hover:bg-white/5'
                      }`}
                    >
                      {slot.time}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* PASO 4: DATOS DEL CLIENTE + CTA */}
        <section className="bg-gradient-to-b from-brand-card via-[#10141C] to-brand-dark border border-brand-border rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" /> Confirmación Instantánea • Sin pagos por adelantado
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Confirma tus Datos</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Solo requerimos tu nombre y número de WhatsApp para mandarte el comprobante y recordatorio con botón de
                reprogramación.
              </p>
            </div>

            {/* Ticket resumen */}
            <div className="bg-brand-dark p-4 rounded-2xl border border-brand-border space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-400 border-b border-brand-border/60 pb-2">
                <span>Servicio seleccionado:</span>
                <span className="font-bold text-white">
                  {selectedService.name} ({selectedService.duration})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 border-b border-brand-border/60 pb-2">
                <span>Barbero asignado:</span>
                <span className="font-bold text-brand-gold">
                  {selectedBarber.name} ({selectedBarber.chair})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 border-b border-brand-border/60 pb-2">
                <span>Fecha &amp; Horario:</span>
                <span className="font-bold text-white">
                  {selectedDate.dayName} {selectedDate.dateStr} a las {selectedTime ?? '—'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-white">Total a pagar en el local:</span>
                <span className="text-lg font-black text-brand-gold">{selectedService.price}</span>
              </div>
            </div>

            {/* Los 2 campos únicos */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  1. Nombre Completo <span className="text-brand-gold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    placeholder="Ej: Matías Correa"
                    className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold transition-colors pl-11"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  2. Número de WhatsApp <span className="text-brand-gold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                    placeholder="Ej: +56 9 8452 1199"
                    className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold transition-colors pl-11"
                  />
                  <MessageCircle className="w-4 h-4 text-emerald-400 absolute left-4 top-4" />
                </div>
              </div>
            </div>

            {/* Fidelidad (solo si la barbería la activó desde el admin) */}
            {businessInfo.loyaltyEnabled &&
              (() => {
                const entry = loyaltyStampsFor(clientForm.phone)
                const goal = businessInfo.loyaltyGoal ?? 6
                const stamps = entry?.stamps ?? 0
                return (
                  <div className="flex items-center gap-3 bg-brand-gold/10 border border-brand-gold/30 rounded-xl px-4 py-3 text-left">
                    <span className="text-xl">🎁</span>
                    <div className="text-xs">
                      <p className="font-black text-brand-gold uppercase tracking-wider">Tarjeta de sellos activa</p>
                      <p className="text-slate-300">
                        Este corte suma 1 sello a tu número.{' '}
                        {stamps > 0 ? (
                          <>
                            Llevas <strong className="text-white">{stamps} de {goal}</strong> — al llegar a {goal}{' '}
                            tienes beneficio de la casa.
                          </>
                        ) : (
                          <>Completa {goal} cortes y gana el beneficio de la casa.</>
                        )}
                      </p>
                    </div>
                  </div>
                )
              })()}

            {/* CTA Confirmar */}
            <button
              type="submit"
              className="w-full group bg-gradient-to-r from-amber-400 via-brand-gold to-amber-600 hover:from-brand-gold hover:to-amber-500 text-black font-black text-base py-4 rounded-xl shadow-xl shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-[0.99]"
            >
              <CalendarCheck className="w-5 h-5" />
              <span>Confirmar Cita &amp; Recibir WhatsApp</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="text-[11px] text-center text-slate-500">
              Te llegará la notificación al instante con opción de reprogramar con 1 clic. No cobramos penalización.
            </p>
          </div>
        </section>
      </form>
    </div>
  )
}
