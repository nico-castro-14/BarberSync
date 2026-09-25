import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Link as LinkIcon,
  Copy,
  BadgeCheck,
  Calendar,
  Star,
  Scissors,
  Armchair,
  Image,
  Search,
  X,
  CheckCircle2,
} from 'lucide-react'
import PortfolioCard from '../components/PortfolioCard.jsx'
import { REVIEWS_MATEO, PORTFOLIO_TAGS } from '../utils/mockData.js'
import { useBooking } from '../hooks/useBooking.js'
import { useStore } from '../hooks/useStore.js'
import { useToast } from '../hooks/useToast.js'

// VISTA 2: PERFIL DE BARBERO & PORTAFOLIO (deep link /barbero/:handle)
export default function BarberPortfolio() {
  const { handle } = useParams()
  const { barbers, portfolioItems, toggleLike } = useStore()
  const { bookWithBarber } = useBooking()
  const { triggerToast } = useToast()

  // Barbero del perfil según el deep link (fallback: barbero destacado)
  const barber = barbers.find((b) => b.handle === handle) || barbers[0]

  const [activeTag, setActiveTag] = useState('Todos')
  const [searchCutQuery, setSearchCutQuery] = useState('')

  const filteredPortfolio = useMemo(() => {
    return portfolioItems.filter((item) => {
      const matchesTag = activeTag === 'Todos' || item.tag.toLowerCase() === activeTag.toLowerCase()
      const matchesSearch =
        !searchCutQuery.trim() ||
        item.title.toLowerCase().includes(searchCutQuery.toLowerCase()) ||
        item.tag.toLowerCase().includes(searchCutQuery.toLowerCase()) ||
        item.barberName.toLowerCase().includes(searchCutQuery.toLowerCase())
      return matchesTag && matchesSearch
    })
  }, [portfolioItems, activeTag, searchCutQuery])

  const copyDeepLink = () => {
    const url = `barbernewyark.app/barbero/${barber.handle}`
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url)
    triggerToast(`¡Link copiado!: ${url}`)
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner de enlace directo para redes sociales */}
      <div className="bg-gradient-to-r from-[#182130] via-brand-card to-[#182130] border border-brand-gold/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3 text-xs sm:text-sm">
          <span className="w-8 h-8 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
            <LinkIcon className="w-4 h-4" />
          </span>
          <div>
            <span className="font-bold text-white">Enlace Directo para Instagram &amp; TikTok Bio:</span>
            <code className="text-brand-gold font-mono ml-2 block sm:inline">
              barbernewyark.app/barbero/{barber.handle}
            </code>
          </div>
        </div>
        <button
          onClick={copyDeepLink}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-goldHover text-black text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md"
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Copiar Link para Bio</span>
        </button>
      </div>

      {/* Perfil principal del barbero */}
      <div className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar grande */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-amber-500 via-brand-gold to-yellow-600 p-1 shadow-2xl shadow-amber-500/20">
              {barber.avatar ? (
                <img
                  src={barber.avatar}
                  alt={barber.name}
                  className="w-full h-full rounded-[22px] object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-[22px] bg-[#10141C] flex items-center justify-center text-3xl font-black text-white">
                  {barber.initials}
                </div>
              )}
            </div>
            <span className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-brand-card text-black text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-black"></span> DISPONIBLE
            </span>
          </div>

          {/* Información y bio */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{barber.name}</h1>
                  <span title="Barbero Oficial Verificado" className="text-brand-gold">
                    <BadgeCheck className="w-5 h-5 fill-brand-gold text-black" />
                  </span>
                </div>
                <p className="text-sm text-brand-muted font-medium">{barber.role} • Barber New Yark, Cajicá</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => bookWithBarber(barber)}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-gold to-amber-500 hover:from-brand-goldHover hover:to-amber-600 text-black font-extrabold text-sm px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar Directo con {barber.name.split(' ')[0].replaceAll('"', '')}</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">{barber.bio}</p>

            {/* Métricas del barbero */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1 text-xs">
              <div className="flex items-center gap-1.5 bg-brand-dark px-3 py-1.5 rounded-xl border border-brand-border">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-extrabold text-white">{barber.rating}</span>
                <span className="text-slate-500">({barber.reviews} reseñas)</span>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-dark px-3 py-1.5 rounded-xl border border-brand-border">
                <Scissors className="w-4 h-4 text-brand-gold" />
                <span className="font-bold text-white">1,450+ cortes</span>
              </div>
              <div className="flex items-center gap-1.5 bg-brand-dark px-3 py-1.5 rounded-xl border border-brand-border">
                <Armchair className="w-4 h-4 text-slate-400" />
                <span className="text-slate-300">{barber.chair} • Master Chair</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PORTAFOLIO con filtrado por tags */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Image className="w-6 h-6 text-brand-gold" />
              Portafolio Visual &amp; Estilos
            </h2>
            <p className="text-xs text-brand-muted">Explora los acabados reales realizados en nuestra barbería</p>
          </div>

          {/* Buscador */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={searchCutQuery}
              onChange={(e) => setSearchCutQuery(e.target.value)}
              placeholder="Buscar corte ej: Mullet, Fade..."
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-gold pl-9"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            {searchCutQuery && (
              <button
                onClick={() => setSearchCutQuery('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-white"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chips de filtro */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {PORTFOLIO_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                activeTag.toLowerCase() === tag.toLowerCase()
                  ? 'bg-brand-gold text-black shadow-md font-extrabold scale-105'
                  : 'bg-brand-card border border-brand-border text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              <span>{tag === 'Todos' ? '✦ Todos' : `#${tag}`}</span>
            </button>
          ))}
        </div>

        {/* Cuadrícula estilo Instagram */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPortfolio.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-slate-500 space-y-2">
              <Scissors className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold">
                No se encontraron cortes con el término &quot;{searchCutQuery}&quot;
              </p>
              <button
                onClick={() => {
                  setSearchCutQuery('')
                  setActiveTag('Todos')
                }}
                className="text-xs text-brand-gold underline"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            filteredPortfolio.map((cut) => (
              <PortfolioCard
                key={cut.id}
                cut={cut}
                onToggleLike={toggleLike}
                onBook={() => bookWithBarber(barbers.find((b) => b.id === cut.barberId) || barber)}
              />
            ))
          )}
        </div>
      </div>

      {/* RESEÑAS VERIFICADAS */}
      <div className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              Reseñas Verificadas de Clientes (WhatsApp 15m post-cita)
            </h2>
            <p className="text-xs text-brand-muted">
              Calificaciones emitidas automáticamente tras finalizar el servicio en la silla
            </p>
          </div>
          <div className="flex items-center gap-2 bg-brand-dark px-3.5 py-1.5 rounded-xl border border-brand-border text-xs">
            <span className="text-slate-400">Promedio general:</span>
            <span className="text-amber-400 font-extrabold text-sm">{barber.rating} / 5.0</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REVIEWS_MATEO.map((rev) => (
            <div key={rev.author} className="bg-brand-dark border border-brand-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, idx) => (
                    <Star key={idx} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-slate-500">{rev.date}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">&quot;{rev.text}&quot;</p>
              <div className="pt-2 border-t border-brand-border/60 flex items-center justify-between text-xs">
                <span className="font-bold text-white">{rev.author}</span>
                {rev.verified && (
                  <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Cita Verificada
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
