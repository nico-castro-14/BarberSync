import { useEffect, useMemo, useState } from 'react'
import { X, Clock, Check, UserX, Hourglass, Scissors } from 'lucide-react'
import { useStore } from '../../hooks/useStore.js'
import { formatCLP, todayIso, to24Hour, to12Hour } from '../../utils/format.js'

// VISTA TV (opcional desde el panel admin) — horario del día en pantalla
// grande para el local: citas agendadas, barbero asignado y estado en vivo.
export default function DayScheduleTv({ open, onClose }) {
  const { appointments, barbers, businessInfo } = useStore()
  const [now, setNow] = useState(new Date())

  // Reloj vivo cada 30s
  useEffect(() => {
    if (!open) return
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [open])

  const todayAppointments = useMemo(() => {
    if (!open) return []
    const iso = todayIso()
    return appointments
      .filter((a) => a.dateIso === iso && a.status !== 'cancelled')
      .map((a) => ({ ...a, sortKey: to24Hour(a.time), barber: barbers.find((b) => b.id === a.barberId) }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }, [appointments, barbers, open])

  if (!open) return null

  const total = todayAppointments.reduce((s, a) => s + (a.numericPrice ?? 0), 0)
  const clock = to12Hour(
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
  )
  const dateLabel = now.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const statusChip = {
    pending: { label: 'En espera', cls: 'bg-amber-500/15 text-brand-gold border-brand-gold/40', Icon: Hourglass },
    completed: { label: 'Atendido', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40', Icon: Check },
    noshow: { label: 'No asistió', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/40', Icon: UserX },
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#07090D] text-slate-100 flex flex-col animate-fade-in">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-brand-border bg-brand-card/60">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-brand-gold flex items-center justify-center text-black">
            <Scissors className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{businessInfo.name}</h1>
            <p className="text-xs text-brand-muted capitalize">{dateLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-3xl font-black text-brand-gold tabular-nums leading-none">{clock}</p>
            <p className="text-[10px] text-brand-muted uppercase tracking-widest mt-1">
              {todayAppointments.length} citas · {formatCLP(total)} agendados
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-brand-border text-slate-300 hover:text-white transition-all"
            aria-label="Cerrar vista TV"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tablero de citas */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-10 py-6">
        {todayAppointments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
            <Scissors className="w-12 h-12 text-slate-600" />
            <p className="text-lg font-bold text-slate-400">Sin citas agendadas para hoy</p>
            <p className="text-sm text-slate-600">Las reservas aparecerán aquí en tiempo real</p>
          </div>
        ) : (
          <ul className="space-y-3 max-w-5xl mx-auto">
            {todayAppointments.map((apt) => {
              const chip = statusChip[apt.status] ?? statusChip.pending
              return (
                <li
                  key={apt.id}
                  className={`flex items-center gap-4 sm:gap-6 rounded-2xl border px-5 py-4 transition-colors ${
                    apt.status === 'completed'
                      ? 'border-emerald-500/25 bg-emerald-500/[0.04]'
                      : apt.status === 'noshow'
                        ? 'border-rose-500/20 bg-rose-500/[0.03] opacity-60'
                        : 'border-brand-border bg-brand-card'
                  }`}
                >
                  {/* Hora */}
                  <div className="text-center min-w-[86px]">
                    <Clock className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                    <span className="text-xl font-black text-white tabular-nums">{apt.time}</span>
                  </div>

                  {/* Cliente + servicio */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-white text-lg truncate">{apt.client}</h3>
                    <p className="text-sm text-brand-gold font-semibold truncate">{apt.service}</p>
                  </div>

                  {/* Barbero asignado */}
                  {apt.barber && (
                    <div className="hidden sm:flex items-center gap-2.5 bg-white/5 border border-brand-border rounded-xl px-3.5 py-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full bg-gradient-to-tr ${apt.barber.color}`}
                        aria-hidden="true"
                      ></span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white leading-tight">{apt.barber.name}</p>
                        <p className="text-[10px] text-brand-muted">{apt.barber.chair}</p>
                      </div>
                    </div>
                  )}

                  {/* Estado */}
                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${chip.cls}`}
                  >
                    <chip.Icon className="w-3.5 h-3.5" />
                    {chip.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Pie: horarios del local */}
      <div className="px-6 sm:px-10 py-3 border-t border-brand-border bg-brand-card/40 text-center text-[11px] text-slate-500">
        Lun–Sáb {businessInfo.weekdayOpen}–{businessInfo.weekdayClose} · Dom {businessInfo.sundayOpen}–
        {businessInfo.sundayClose} · {businessInfo.address}
      </div>
    </div>
  )
}
