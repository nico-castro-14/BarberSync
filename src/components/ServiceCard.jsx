import { Clock, Check, Scissors, Sparkles, SprayCan, Crown, Flame, Paintbrush, Eye } from 'lucide-react'

// Mapa de iconos (string en mockData → componente de lucide-react)
const SERVICE_ICONS = {
  scissors: Scissors,
  sparkles: Sparkles,
  'spray-can': SprayCan,
  crown: Crown,
  flame: Flame,
  'paint-brush': Paintbrush,
  eye: Eye,
}

export default function ServiceCard({ service, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(service)}
      className={`cursor-pointer group relative p-5 rounded-2xl border transition-all duration-200 ${
        selected
          ? 'bg-[#181F2C] border-brand-gold shadow-xl shadow-amber-500/10 scale-[1.01]'
          : 'bg-brand-card/90 border-brand-border hover:border-slate-600 hover:bg-brand-cardHover'
      }`}
    >
      {service.popular && (
        <span className="absolute top-3 right-3 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/40">
          Popular
        </span>
      )}
      <div className="flex items-start justify-between">
        <div className="space-y-1 pr-3">
          <h3 className={`font-bold text-base transition-colors ${selected ? 'text-brand-gold' : 'text-white'}`}>
            {service.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {service.duration}
            </span>
            <span>•</span>
            <span className="text-brand-gold font-semibold">#{service.tag}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-white">{service.price}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">{service.desc}</p>
      <div className="mt-4 pt-3 border-t border-brand-border flex items-center justify-between text-xs font-semibold">
        <span className={selected ? 'text-brand-gold' : 'text-slate-400 group-hover:text-white'}>
          {selected ? '✓ Servicio Elegido' : 'Seleccionar este'}
        </span>
        <div
          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
            selected ? 'border-brand-gold bg-brand-gold text-black' : 'border-slate-600'
          }`}
        >
          {selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </div>
      </div>
    </div>
  )
}
