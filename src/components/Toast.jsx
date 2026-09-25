import { X, Check } from 'lucide-react'
import { useToast } from '../hooks/useToast.js'

// Sistema de notificaciones toast (2 variantes):
//  - Superior derecha: feedback general de la app.
//  - Inferior centrado: acciones del flujo de WhatsApp.
export default function Toast() {
  const { toast, bottomToast, dismissToast, dismissBottomToast } = useToast()

  return (
    <>
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-brand-card border border-brand-gold/60 text-white px-5 py-3.5 rounded-2xl shadow-2xl transition-all duration-300 gold-border-glow">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping"></div>
          <p className="text-sm font-semibold">{toast}</p>
          <button onClick={dismissToast} className="text-slate-400 hover:text-white ml-2" aria-label="Cerrar notificación">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {bottomToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#141B26] border border-brand-gold text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold">
          <Check className="w-4 h-4 text-brand-gold" />
          <span>{bottomToast}</span>
          <button onClick={dismissBottomToast} className="ml-2 text-slate-400 hover:text-white" aria-label="Cerrar notificación">
            ✕
          </button>
        </div>
      )}
    </>
  )
}
