import { useState } from 'react'
import {
  Scissors,
  BadgeCheck,
  X,
  Calendar,
  XCircle,
  MapPin,
  CheckCheck,
  Sparkles,
  Star,
  MessageCircle,
  Link2,
  Copy,
  Check,
} from 'lucide-react'
import { useBooking } from '../hooks/useBooking.js'
import { BUSINESS_INFO } from '../utils/mockData.js'
import {
  BARBERSHOP_WA_NUMBER,
  buildWaLink,
  buildAppointmentUrl,
  buildConfirmMessage,
} from '../utils/whatsapp.js'

// Modal post-reserva: comprobante simulado + acción REAL de confirmación
// vía wa.me (el cliente envía el mensaje prellenado a la barbería).
export default function WhatsAppModal() {
  const { whatsAppModalOpen, confirmedBooking, closeWhatsAppModal, requestReschedule, cancelConfirmedBooking } =
    useBooking()
  const [linkCopied, setLinkCopied] = useState(false)

  if (!whatsAppModalOpen || !confirmedBooking) return null

  // Link único de la cita + mensaje prellenado hacia el WhatsApp de la barbería
  const appointmentUrl = buildAppointmentUrl(confirmedBooking)
  const waConfirmLink = buildWaLink(BARBERSHOP_WA_NUMBER, buildConfirmMessage(confirmedBooking, appointmentUrl))

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appointmentUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      window.prompt('Copia el link de tu cita:', appointmentUrl)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111B21] border border-emerald-500/40 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
        {/* Header verde de WhatsApp */}
        <div className="bg-[#202C33] px-5 py-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-white">{BUSINESS_INFO.name}</h3>
                <BadgeCheck className="w-4 h-4 fill-emerald-500 text-black" />
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Cuenta Oficial • En línea
              </p>
            </div>
          </div>
          <button
            onClick={closeWhatsAppModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del chat */}
        <div className="p-5 space-y-4 whatsapp-bg text-xs">
          {/* Mensaje de confirmación automatizado */}
          <div className="bg-[#202C33] border border-white/5 rounded-2xl rounded-tl-none p-4 text-slate-200 space-y-3 shadow-md max-w-[95%]">
            <p className="leading-relaxed">
              ¡Hola <strong className="text-white">{confirmedBooking.client}</strong>! ✂️ Tu cita para{' '}
              <strong className="text-amber-400">{confirmedBooking.service}</strong> con{' '}
              <strong className="text-white">{confirmedBooking.barberName}</strong> está{' '}
              <strong className="text-emerald-400 font-black">CONFIRMADA</strong>.
            </p>

            <div className="bg-[#111B21]/90 rounded-xl p-3 space-y-1.5 border border-white/5">
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha:</span>
                <span className="font-bold text-white">{confirmedBooking.dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hora:</span>
                <span className="font-bold text-brand-gold">{confirmedBooking.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estación:</span>
                <span className="font-bold text-white">{confirmedBooking.chair}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total en local:</span>
                <span className="font-bold text-emerald-400">{confirmedBooking.price}</span>
              </div>
            </div>

            {/* Botones interactivos de WhatsApp */}
            <div className="pt-2 space-y-2">
              <button
                onClick={requestReschedule}
                className="w-full bg-[#111B21] hover:bg-[#2A3942] text-amber-400 font-bold py-2.5 px-3 rounded-xl border border-white/10 text-center flex items-center justify-center gap-2 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Reprogramar Cita</span>
              </button>

              <button
                onClick={cancelConfirmedBooking}
                className="w-full bg-[#111B21] hover:bg-rose-950/40 text-rose-400 font-semibold py-2 px-3 rounded-xl border border-white/10 text-center flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelar Cita</span>
              </button>

              <a
                href={BUSINESS_INFO.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-[#111B21] hover:bg-[#2A3942] text-slate-300 font-medium py-2 px-3 rounded-xl border border-white/10 text-center flex items-center justify-center gap-2 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Ver en Google Maps ({BUSINESS_INFO.address.split(',')[0]})</span>
              </a>
            </div>

            <div className="text-[10px] text-right text-slate-400 flex items-center justify-end gap-1 pt-1">
              <span>12:00</span>
              <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>

          {/* Simulación del sistema de calificación post-servicio */}
          <div className="bg-[#182229] border border-amber-500/20 rounded-2xl p-3.5 space-y-2 text-slate-300">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Calificación Post-Servicio</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              2 horas después de tu cita, tu barbero podrá enviarte un mensaje de WhatsApp con un link para calificar de
              1 a 5 estrellas y dejar tu reseña verificada.
            </p>
            <div className="flex justify-center gap-2 py-1 text-amber-400">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
          </div>
        </div>

        {/* Footer del modal: confirmación REAL vía wa.me (sin API) */}
        <div className="bg-[#202C33] p-4 space-y-3">
          {/* Link único de la cita */}
          <div className="flex items-center gap-2 bg-[#111B21] border border-white/10 rounded-xl px-3 py-2">
            <Link2 className="w-4 h-4 text-brand-gold shrink-0" />
            <span className="text-[11px] text-slate-400 truncate flex-1">{appointmentUrl}</span>
            <button
              onClick={handleCopyLink}
              className={`shrink-0 flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all ${
                linkCopied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-300 hover:text-white'
              }`}
            >
              {linkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {linkCopied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <a
            href={waConfirmLink}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <MessageCircle className="w-5 h-5 fill-black/20" />
            Confirmar cita en WhatsApp
          </a>
          <p className="text-[10px] text-center text-slate-400">
            Se abre tu WhatsApp con el mensaje listo — solo dale <strong>enviar</strong>
          </p>

          <button
            onClick={closeWhatsAppModal}
            className="w-full bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-2.5 rounded-xl transition-all text-xs"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  )
}
