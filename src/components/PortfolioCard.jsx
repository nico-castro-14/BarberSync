import { Scissors, Heart, ChevronRight } from 'lucide-react'

export default function PortfolioCard({ cut, onToggleLike, onBook }) {
  return (
    <div className="group relative rounded-3xl overflow-hidden bg-brand-card border border-brand-border aspect-square flex flex-col justify-end p-5 transition-all duration-300 hover:border-brand-gold/60 shadow-xl">
      {/* Fotografía real (Supabase Storage) o placeholder gradiente */}
      {cut.imageUrl ? (
        <img
          src={cut.imageUrl}
          alt={cut.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${cut.imageBg} flex items-center justify-center p-6 text-center`}
        >
          <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-slate-400 group-hover:scale-110 group-hover:text-brand-gold transition-all duration-300">
            <Scissors className="w-8 h-8 stroke-[1.5] mb-1" />
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 group-hover:text-white">
              PRO CUT
            </span>
          </div>
        </div>
      )}

      {/* Badge de tag superior */}
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-black/70 backdrop-blur-md border border-white/10 text-brand-gold px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
          #{cut.tag}
        </span>
      </div>

      {/* Botón de like superior derecho */}
      <button
        onClick={() => onToggleLike(cut.id)}
        className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-110 transition-transform"
        aria-label="Me gusta"
      >
        <Heart className={`w-4 h-4 ${cut.liked ? 'fill-rose-500 text-rose-500' : 'text-slate-300'}`} />
      </button>

      {/* Overlay de datos */}
      <div className="relative z-10 bg-brand-dark/85 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm text-white">{cut.title}</h3>
            <p className="text-[11px] text-brand-muted">Por {cut.barberName}</p>
          </div>
          <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
            <Heart className="w-3 h-3 fill-rose-400" /> {cut.likes}
          </span>
        </div>

        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{cut.desc}</p>

        <div className="pt-2 border-t border-brand-border flex items-center justify-between">
          <span className="text-[11px] text-brand-gold font-bold">Barber New Yark • Cajicá</span>
          <button
            onClick={onBook}
            className="text-xs font-bold text-white hover:text-brand-gold transition-colors flex items-center gap-1"
          >
            <span>Pedir este corte</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
