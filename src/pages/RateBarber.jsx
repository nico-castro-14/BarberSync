import { useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Star, BadgeCheck, Send, ArrowLeft } from 'lucide-react'
import { useStore } from '../hooks/useStore.js'
import { useToast } from '../hooks/useToast.js'
import { BUSINESS_INFO } from '../utils/mockData.js'

const STORAGE_KEY = 'barbersync_reviews_v1'

// PÁGINA PÚBLICA /calificar/:handle — llega desde el mensaje wa.me que
// el barbero envía 2h después de la cita. Guarda la reseña verificada
// (localStorage en demo; lista para migrar a tabla `reviews` en Supabase).
export default function RateBarber() {
  const { handle } = useParams()
  const [params] = useSearchParams()
  const clientName = params.get('cliente') ?? ''
  const { barbers } = useStore()
  const { triggerToast } = useToast()

  const barber = barbers.find((b) => b.handle === handle)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (rating === 0) {
      triggerToast('Selecciona de 1 a 5 estrellas')
      return
    }
    const review = {
      barberHandle: handle,
      author: clientName || 'Cliente',
      rating,
      text: comment.trim(),
      date: new Date().toISOString(),
      verified: true,
    }
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...prev, review]))
    } catch {
      /* localStorage lleno/bloqueado: la reseña vive solo en memoria */
    }
    setSubmitted(true)
  }

  if (!barber) {
    return (
      <div className="max-w-md mx-auto py-10 text-center space-y-4">
        <p className="text-slate-400">No encontramos a este barbero.</p>
        <Link to="/" className="text-brand-gold font-bold text-sm underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-6 animate-fade-in">
      <div className="bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-2xl">
        {/* Cabecera del barbero */}
        <div className="bg-gradient-to-b from-amber-500/15 to-transparent p-6 text-center border-b border-brand-border">
          <div
            className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr ${barber.color} overflow-hidden shadow-xl border border-white/10`}
          >
            {barber.avatar ? (
              <img src={barber.avatar} alt={barber.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-black text-white text-xl">
                {barber.initials}
              </div>
            )}
          </div>
          <h1 className="text-xl font-black text-white mt-3">
            ¿Cómo quedó tu corte con {barber.name.split(' ')[0]}?
          </h1>
          <p className="text-xs text-brand-muted mt-1 flex items-center justify-center gap-1">
            <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
            Reseña verificada • {BUSINESS_INFO.name}
            {clientName ? ` • ${clientName}` : ''}
          </p>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="flex justify-center gap-1.5 text-amber-400">
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} className="w-7 h-7 fill-amber-400" />
              ))}
            </div>
            <h2 className="text-lg font-black text-white">¡Gracias{clientName ? `, ${clientName.split(' ')[0]}` : ''}!</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tu calificación de {rating}/5 ya quedó registrada y ayuda a {barber.name.split(' ')[0]} a seguir
              creciendo en el ranking del equipo.
            </p>
            <Link
              to={`/barbero/${barber.handle}`}
              className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-goldHover text-black font-black text-xs px-5 py-3 rounded-xl transition-all"
            >
              Ver el portafolio de {barber.name.split(' ')[0]}
            </Link>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Estrellas */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  onMouseEnter={() => setHovered(value)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-125"
                  aria-label={`${value} estrellas`}
                >
                  <Star
                    className={`w-9 h-9 transition-colors ${
                      (hovered || rating) >= value ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Cuenta tu experiencia (opcional): puntualidad, acabado, trato..."
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold resize-none"
            />

            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 via-brand-gold to-amber-600 text-black font-black text-sm py-3.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              Enviar calificación
            </button>

            <Link
              to="/"
              className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Volver a reservas
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
