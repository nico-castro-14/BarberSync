import { Star, Check, Ban } from 'lucide-react'

// Tarjeta seleccionable de barbero (Paso 2 del flujo de reserva).
// Soporta foto real (avatar) y estado inactivo (toggle del admin).
export default function BarberCard({ barber, selected, onSelect }) {
  const inactive = barber.active === false

  return (
    <div
      onClick={() => !inactive && onSelect(barber)}
      className={`relative p-5 rounded-2xl border transition-all duration-200 text-center flex flex-col items-center justify-between ${
        inactive
          ? 'bg-brand-card/50 border-brand-border opacity-50 cursor-not-allowed'
          : `cursor-pointer ${
              selected
                ? 'bg-[#181F2C] border-brand-gold shadow-xl shadow-amber-500/10 scale-[1.01]'
                : 'bg-brand-card/90 border-brand-border hover:border-slate-600 hover:bg-brand-cardHover'
            }`
      }`}
    >
      <div className="w-full flex flex-col items-center">
        {/* Avatar con foto real o iniciales */}
        <div className="relative mb-3">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${barber.color} p-0.5 shadow-lg overflow-hidden`}>
            {barber.avatar ? (
              <img src={barber.avatar} alt={barber.name} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <div className="w-full h-full rounded-2xl bg-brand-card flex items-center justify-center font-black text-xl text-white">
                {barber.initials}
              </div>
            )}
          </div>
          {!inactive && selected && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-gold text-black flex items-center justify-center shadow-md">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </div>

        <h3 className="font-bold text-white text-base leading-tight">{barber.name}</h3>
        <p className="text-xs text-brand-muted mt-1">{barber.role}</p>

        {/* Rating &amp; Silla */}
        <div className="flex items-center gap-2 mt-2 bg-brand-dark px-3 py-1 rounded-full border border-brand-border text-xs">
          <span className="flex items-center gap-1 font-bold text-amber-400">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            {barber.rating}
          </span>
          <span className="text-slate-500">({barber.reviews})</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400 font-semibold">{barber.chair}</span>
        </div>

        {/* Especialidades */}
        <div className="flex flex-wrap gap-1 justify-center mt-3">
          {barber.specialties.map((spec) => (
            <span
              key={spec}
              className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/5 font-medium"
            >
              #{spec}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-brand-border w-full flex items-center justify-between text-xs">
        {inactive ? (
          <span className="font-semibold text-rose-400 flex items-center gap-1">
            <Ban className="w-3.5 h-3.5" /> No disponible hoy
          </span>
        ) : (
          <span className={`font-semibold ${selected ? 'text-brand-gold' : 'text-slate-400'}`}>
            {selected ? '✓ Seleccionado' : 'Elegir'}
          </span>
        )}
        <span className="text-[11px] text-slate-500">@{barber.handle}</span>
      </div>
    </div>
  )
}
