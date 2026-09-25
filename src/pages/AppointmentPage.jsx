import { useSearchParams, Link } from 'react-router-dom'
import { BadgeCheck, Calendar, Clock, User, Scissors, MapPin, Armchair, ArrowRight } from 'lucide-react'
import { BUSINESS_INFO } from '../utils/mockData.js'

// PÁGINA PÚBLICA /cita — link único y compartible de cada reserva.
// Reconstruye el ticket desde los parámetros del URL (no requiere backend).
export default function AppointmentPage() {
  const [params] = useSearchParams()
  const cliente = params.get('cliente') ?? 'Cliente'
  const servicio = params.get('servicio') ?? 'Servicio'
  const barbero = params.get('barbero') ?? 'Barbero'
  const silla = params.get('silla') ?? ''
  const fecha = params.get('fecha') ?? ''
  const hora = params.get('hora') ?? ''
  const precio = params.get('precio') ?? ''

  return (
    <div className="max-w-lg mx-auto py-6 animate-fade-in">
      <div className="bg-brand-card border border-brand-gold/40 rounded-3xl overflow-hidden shadow-2xl">
        {/* Franja superior estilo ticket */}
        <div className="bg-gradient-to-r from-amber-500/20 via-brand-gold/10 to-transparent px-6 py-5 border-b border-dashed border-brand-border">
          <div className="flex items-center gap-2 text-brand-gold text-xs font-black uppercase tracking-widest">
            <BadgeCheck className="w-4 h-4" />
            Cita Confirmada • {BUSINESS_INFO.name}
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Comprobante de Reserva</h1>
          <p className="text-[11px] text-brand-muted mt-0.5">Presenta este link al llegar al local</p>
        </div>

        {/* Datos de la cita */}
        <div className="p-6 space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <span className="text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-gold" /> Cliente
            </span>
            <span className="font-bold text-white">{cliente}</span>
          </div>
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <span className="text-slate-400 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-brand-gold" /> Servicio
            </span>
            <span className="font-bold text-white">{servicio}</span>
          </div>
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <span className="text-slate-400 flex items-center gap-2">
              <Armchair className="w-4 h-4 text-brand-gold" /> Barbero
            </span>
            <span className="font-bold text-brand-gold">
              {barbero}
              {silla ? ` • ${silla}` : ''}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <span className="text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-gold" /> Fecha
            </span>
            <span className="font-bold text-white">{fecha}</span>
          </div>
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <span className="text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-gold" /> Hora
            </span>
            <span className="font-black text-brand-gold">{hora}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-white">Total en el local</span>
            <span className="text-xl font-black text-emerald-400">{precio}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="px-6 pb-6 space-y-3">
          <a
            href={BUSINESS_INFO.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-brand-border text-white font-bold text-xs py-3 rounded-xl transition-all"
          >
            <MapPin className="w-4 h-4 text-red-400" />
            Cómo llegar — {BUSINESS_INFO.address}
          </a>
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-goldHover text-black font-black text-xs py-3 rounded-xl transition-all"
          >
            Reservar otra cita
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[10px] text-center text-slate-500">
            {BUSINESS_INFO.cancellationPolicy} • Confirmado por BarberSync
          </p>
        </div>
      </div>
    </div>
  )
}
