import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Users,
  Crown,
  Check,
  Trash2,
  Pencil,
  Plus,
  Star,
  Settings,
  LogOut,
  Scissors,
  Power,
  FileSpreadsheet,
  MonitorPlay,
  Gift,
} from 'lucide-react'
import ServiceFormModal from '../components/admin/ServiceFormModal.jsx'
import DayScheduleTv from '../components/admin/DayScheduleTv.jsx'
import { useStore } from '../hooks/useStore.js'
import { useToast } from '../hooks/useToast.js'
import { useSession } from '../hooks/useSession.js'
import { formatCLP, todayIso } from '../utils/format.js'

const ADMIN_TABS = [
  { id: 'servicios', label: 'Gestión de Servicios' },
  { id: 'equipo', label: 'Gestión de Equipo' },
  { id: 'config', label: 'Configuración del Local' },
]

// VISTA 4: PANEL DUEÑO / ADMIN — Barber New Yark
// Tres sub-vistas con estado local + acciones del store (listas para Supabase):
//   1. Gestión de Servicios (CRUD con modal)
//   2. Gestión de Equipo (toggle Activo/Inactivo del día)
//   3. Configuración del Local (horarios y datos de la sede)
export default function AdminDashboard() {
  const navigate = useNavigate()
  const {
    services,
    barbers,
    appointments,
    businessInfo,
    setBusinessInfo,
    saveService,
    deleteService,
    toggleBarberActive,
  } = useStore()
  const { triggerToast } = useToast()
  const { session, logout } = useSession()

  const [activeTab, setActiveTab] = useState('servicios')
  const [tvViewOpen, setTvViewOpen] = useState(false)

  // --- KPIs en vivo (se recalculan con cada cita que entra o se completa) ----
  const TODAY_ISO = todayIso()
  const todayAppointments = appointments.filter((a) => a.dateIso === TODAY_ISO && a.status !== 'cancelled')
  const todayBookedValue = todayAppointments.reduce((acc, a) => acc + (a.numericPrice ?? 0), 0)
  const topBarber = [...barbers].sort((a, b) => (b.earningsToday ?? 0) - (a.earningsToday ?? 0))[0]

  // --- Estado local: modal de servicios -------------------------------------
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // --- Estado local: formulario de configuración ----------------------------
  const [configForm, setConfigForm] = useState({ ...businessInfo })

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  // =================== Handlers preparados para la API ======================
  // Todos operan optimista vía store; en modo live persisten en Supabase.

  const handleAddService = () => {
    setEditingService(null)
    setServiceModalOpen(true)
  }

  const handleEditService = (service) => {
    setEditingService(service)
    setServiceModalOpen(true)
  }

  // handleUpdateService / handleCreateService unificados
  const handleSaveService = (serviceData) => {
    saveService(serviceData)
  }

  const handleDeleteService = (id) => {
    deleteService(id)
    setConfirmDeleteId(null)
  }

  const handleToggleBarber = (barber) => {
    toggleBarberActive(barber.id, !(barber.active !== false))
    triggerToast(
      !(barber.active !== false)
        ? `${barber.name} quedó ACTIVO para reservas de hoy`
        : `${barber.name} quedó INACTIVO (no recibe reservas hoy)`,
    )
  }

  const handleSaveBusinessConfig = (e) => {
    e.preventDefault()
    setBusinessInfo({ ...configForm })
    triggerToast('Configuración del local guardada correctamente')
  }

  // --- Cierre de caja diario: exporta CSV (se abre directo en Excel) ---------
  // Columnas con ";" para que Excel es-CO las separe sin configuración extra.
  const handleExportDailyClose = () => {
    const todays = appointments.filter((a) => a.dateIso === TODAY_ISO && a.status !== 'cancelled')
    const money = (n) => String(n ?? 0)
    const sep = ';'
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

    const header = [
      'Barbero',
      'Silla',
      'Citas completadas',
      'Citas pendientes',
      'Inasistencias',
      'Ingreso completado $',
      'Valor agendado $',
      'Propinas $',
    ].join(sep)

    const rows = barbers.map((b) => {
      const mine = todays.filter((a) => a.barberId === b.id)
      const completed = mine.filter((a) => a.status === 'completed')
      const pending = mine.filter((a) => a.status === 'pending')
      const noshow = mine.filter((a) => a.status === 'noshow')
      return [
        esc(b.name),
        esc(b.chair),
        completed.length,
        pending.length,
        noshow.length,
        money(completed.reduce((s, a) => s + (a.numericPrice ?? 0), 0)),
        money(mine.reduce((s, a) => s + (a.numericPrice ?? 0), 0)),
        money(b.tipsToday ?? 0),
      ].join(sep)
    })

    const totalCompleted = todays.filter((a) => a.status === 'completed').reduce((s, a) => s + (a.numericPrice ?? 0), 0)
    const totalBooked = todays.reduce((s, a) => s + (a.numericPrice ?? 0), 0)
    const totalRow = [
      esc('TOTAL'),
      '',
      todays.filter((a) => a.status === 'completed').length,
      todays.filter((a) => a.status === 'pending').length,
      todays.filter((a) => a.status === 'noshow').length,
      money(totalCompleted),
      money(totalBooked),
      money(barbers.reduce((s, b) => s + (b.tipsToday ?? 0), 0)),
    ].join(sep)

    const csv = [
      `CIERRE DE CAJA — ${businessInfo.name}`,
      `Fecha${sep}${TODAY_ISO}`,
      `Generado${sep}${new Date().toLocaleTimeString('es-CO')}`,
      '',
      header,
      ...rows,
      totalRow,
    ].join('\r\n')

    // BOM explícito (﻿) para que Excel respete tildes y eñe
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cierre-caja-${TODAY_ISO}.csv`
    a.click()
    URL.revokeObjectURL(url)
    triggerToast('Cierre de caja descargado (ábrelo con Excel)')
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header del dueño */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Barber New Yark • Cajicá
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Dashboard de Administración</h1>
          <p className="text-xs sm:text-sm text-brand-muted">
            {session?.email ? `Sesión: ${session.email} • ` : ''}Métricas del negocio, servicios, equipo y horarios
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setTvViewOpen(true)}
            title="Pantalla grande con la agenda del día"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-brand-border transition-all"
          >
            <MonitorPlay className="w-4 h-4 text-brand-gold" />
            <span>Vista TV</span>
          </button>
          <button
            onClick={handleExportDailyClose}
            title="Descargar cierre del día (Excel)"
            className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-emerald-500/30 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Cierre de Caja</span>
          </button>
          <button
            onClick={handleLogout}
            title={session ? `Cerrar sesión de ${session.email}` : 'Cerrar sesión'}
            className="inline-flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-rose-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {/* MÉTRICAS CLAVE DEL NEGOCIO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Ingresos del Día</span>
          <h3 className="text-3xl font-black text-brand-gold mt-1">
            ${barbers.reduce((acc, b) => acc + (b.earningsToday ?? 0), 0).toLocaleString('es-CO')}
          </h3>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-2">
            <TrendingUp className="w-3.5 h-3.5" /> Consolidado de las 5 sillas
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Equipo Activo Hoy</span>
          <h3 className="text-3xl font-black text-white mt-1">
            {barbers.filter((b) => b.active !== false).length} / {barbers.length}
          </h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
            <Users className="w-3.5 h-3.5" /> Barberos recibiendo reservas
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border rounded-2xl p-5 relative">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider">Barbero Estrella</span>
          <h3 className="text-xl font-black text-white mt-1">{topBarber?.name ?? '—'}</h3>
          <p className="text-xs text-brand-gold flex items-center gap-1 mt-2">
            <Crown className="w-3.5 h-3.5 text-brand-gold" /> Líder de ingresos hoy • {topBarber?.rating ?? ''} rating
          </p>
        </div>

        <div className="bg-brand-card border-2 border-brand-gold/40 rounded-2xl p-5 relative shadow-[0_0_30px_rgba(217,179,70,0.08)]">
          <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">Agenda de Hoy</span>
          <h3 className="text-3xl font-black text-emerald-400 mt-1">{formatCLP(todayBookedValue)}</h3>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-2">
            <Check className="w-3.5 h-3.5" /> {todayAppointments.length} citas reservadas — ingreso protegido por
            confirmación automática
          </p>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-2xl p-1.5 w-full sm:w-auto">
        {ADMIN_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-gold text-black shadow-md font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =============================================================== */}
      {/* TAB 1: GESTIÓN DE SERVICIOS                                     */}
      {/* =============================================================== */}
      {activeTab === 'servicios' && (
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-brand-gold" />
                Catálogo de Servicios ({services.length})
              </h2>
              <p className="text-xs text-brand-muted">
                Los cambios actualizan al instante el flujo de reserva del cliente
              </p>
            </div>
            <button
              onClick={handleAddService}
              className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-goldHover text-black font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Añadir Servicio</span>
            </button>
          </div>

          <div className="divide-y divide-brand-border">
            {services.map((svc) => (
              <div key={svc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-white">{svc.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      #{svc.tag}
                    </span>
                    {svc.popular && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/40">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-muted mt-1 line-clamp-1">{svc.desc}</p>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 text-xs shrink-0">
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] uppercase">Precio</span>
                    <span className="font-black text-white">{svc.price}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] uppercase">Duración</span>
                    <span className="font-bold text-slate-300">{svc.duration}</span>
                  </div>

                  <button
                    onClick={() => handleEditService(svc)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-brand-border text-slate-300 hover:text-white transition-all"
                    title="Editar servicio"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  {confirmDeleteId === svc.id ? (
                    <button
                      onClick={() => handleDeleteService(svc.id)}
                      className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-black font-black text-[11px] transition-all"
                    >
                      ¿Eliminar? Confirmar
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(svc.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-all"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* TAB 2: GESTIÓN DE EQUIPO (toggle activo/inactivo)               */}
      {/* =============================================================== */}
      {activeTab === 'equipo' && (
        <div className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-gold" />
              Equipo de Barberos ({barbers.length})
            </h2>
            <p className="text-xs text-brand-muted">
              El switch Activo/Inactivo controla quién recibe reservas en el día
            </p>
          </div>

          <div className="divide-y divide-brand-border">
            {barbers.map((barber) => {
              const isActive = barber.active !== false
              return (
                <div key={barber.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${barber.color} overflow-hidden shrink-0 shadow-md`}
                    >
                      {barber.avatar ? (
                        <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-white text-sm">
                          {barber.initials}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-white truncate">{barber.name}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                          {barber.chair}
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted truncate">{barber.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className="font-bold text-amber-400 text-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" /> {barber.rating}
                    </span>

                    {/* Switch Activo/Inactivo */}
                    <button
                      role="switch"
                      aria-checked={isActive}
                      onClick={() => handleToggleBarber(barber)}
                      className={`relative w-12 h-6.5 h-7 rounded-full transition-colors duration-200 border ${
                        isActive
                          ? 'bg-emerald-500/80 border-emerald-400'
                          : 'bg-white/10 border-brand-border'
                      }`}
                      title={isActive ? 'Activo hoy' : 'Inactivo hoy'}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                          isActive ? 'left-[26px]' : 'left-1'
                        }`}
                      ></span>
                    </button>
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider w-16 ${
                        isActive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      <Power className="w-3 h-3 inline mr-1" />
                      {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =============================================================== */}
      {/* TAB 3: CONFIGURACIÓN DEL LOCAL                                  */}
      {/* =============================================================== */}
      {activeTab === 'config' && (
        <form
          onSubmit={handleSaveBusinessConfig}
          className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 space-y-6"
        >
          <div className="flex items-center justify-between border-b border-brand-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-gold" />
                Configuración de la Barbería
              </h2>
              <p className="text-xs text-brand-muted">
                Estos horarios alimentan en vivo la grilla de reservas del cliente
              </p>
            </div>
            <button
              type="submit"
              className="bg-brand-gold hover:bg-brand-goldHover text-black font-extrabold text-xs px-4 py-2 rounded-xl shadow-md"
            >
              Guardar Cambios
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-2">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">Nombre del Negocio</label>
              <input
                type="text"
                value={configForm.name}
                onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:border-brand-gold focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">Dirección</label>
              <input
                type="text"
                value={configForm.address}
                onChange={(e) => setConfigForm({ ...configForm, address: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:border-brand-gold focus:outline-none"
              />
            </div>

            {/* Horarios Lunes a Sábado */}
            <div className="space-y-2">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Lunes a Sábado — Apertura
              </label>
              <input
                type="time"
                value={configForm.weekdayOpen}
                onChange={(e) => setConfigForm({ ...configForm, weekdayOpen: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:border-brand-gold focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">
                Lunes a Sábado — Cierre
              </label>
              <input
                type="time"
                value={configForm.weekdayClose}
                onChange={(e) => setConfigForm({ ...configForm, weekdayClose: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:border-brand-gold focus:outline-none"
              />
            </div>

            {/* Horarios Domingo */}
            <div className="space-y-2">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">Domingo — Apertura</label>
              <input
                type="time"
                value={configForm.sundayOpen}
                onChange={(e) => setConfigForm({ ...configForm, sundayOpen: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:border-brand-gold focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">Domingo — Cierre</label>
              <input
                type="time"
                value={configForm.sundayClose}
                onChange={(e) => setConfigForm({ ...configForm, sundayClose: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:border-brand-gold focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="font-bold text-slate-300 uppercase tracking-wider block">Política de Cancelación</label>
              <input
                type="text"
                value={configForm.cancellationPolicy}
                onChange={(e) => setConfigForm({ ...configForm, cancellationPolicy: e.target.value })}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:border-brand-gold focus:outline-none"
              />
            </div>

            {/* Fase 2: programa de fidelidad opcional (tarjeta de sellos) */}
            <div className="md:col-span-2 flex items-center justify-between gap-4 bg-brand-dark border border-brand-border rounded-2xl px-5 py-4">
              <div className="flex items-start gap-3">
                <Gift className="w-5 h-5 text-brand-gold mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white text-sm">Tarjeta de Fidelidad (sellos digitales)</p>
                  <p className="text-[11px] text-brand-muted mt-0.5">
                    Cada cita completada suma 1 sello al número del cliente (se guarda con su nombre y celular). Al
                    llegar a {configForm.loyaltyGoal ?? 6} sellos tiene beneficio de la casa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(configForm.loyaltyEnabled)}
                onClick={() => {
                  const enabled = !configForm.loyaltyEnabled
                  setConfigForm({ ...configForm, loyaltyEnabled: enabled })
                  setBusinessInfo({ ...businessInfo, loyaltyEnabled: enabled })
                  triggerToast(enabled ? 'Tarjeta de fidelidad ACTIVADA' : 'Tarjeta de fidelidad desactivada')
                }}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 border shrink-0 ${
                  configForm.loyaltyEnabled ? 'bg-emerald-500/80 border-emerald-400' : 'bg-white/10 border-brand-border'
                }`}
                title={configForm.loyaltyEnabled ? 'Activa' : 'Inactiva'}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${
                    configForm.loyaltyEnabled ? 'left-[26px]' : 'left-1'
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </form>
      )}

      <ServiceFormModal
        open={serviceModalOpen}
        onClose={() => setServiceModalOpen(false)}
        initialService={editingService}
        onSave={handleSaveService}
      />

      {/* Vista TV del día (pantalla grande para el local) */}
      <DayScheduleTv open={tvViewOpen} onClose={() => setTvViewOpen(false)} />
    </div>
  )
}
