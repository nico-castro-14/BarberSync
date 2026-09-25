import { useEffect, useState } from 'react'
import { X, Plus, Pencil } from 'lucide-react'
import { CUT_TAGS } from '../../utils/mockData.js'

// Modal de creación/edición de servicios (Admin → Gestión de Servicios).
// Emite el payload normalizado que StoreContext.saveService persiste
// (Supabase services table en modo live, optimista en modo demo).
export default function ServiceFormModal({ open, onClose, initialService, onSave }) {
  const isEdit = Boolean(initialService?.id)

  const [name, setName] = useState('')
  const [numericPrice, setNumericPrice] = useState('')
  const [durationMin, setDurationMin] = useState(45)
  const [tag, setTag] = useState('Cabello')
  const [desc, setDesc] = useState('')
  const [popular, setPopular] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(initialService?.name ?? '')
    setNumericPrice(initialService?.numericPrice ?? '')
    setDurationMin(initialService?.durationMin ?? 45)
    setTag(initialService?.tag ?? 'Cabello')
    setDesc(initialService?.desc ?? '')
    setPopular(Boolean(initialService?.popular))
  }, [open, initialService])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !numericPrice) return
    // Conexión Supabase: saveService mapea a { price, duration (interval), tag, is_popular }
    onSave({
      id: initialService?.id,
      name: name.trim(),
      numericPrice: Number(numericPrice),
      durationMin: Number(durationMin),
      tag,
      desc: desc.trim(),
      popular,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
              {isEdit ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
            <h3 className="text-lg font-black text-white">{isEdit ? 'Editar Servicio' : 'Añadir Servicio'}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nombre del servicio <span className="text-brand-gold">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Corte de cabello"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Precio (COP) <span className="text-brand-gold">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="500"
                value={numericPrice}
                onChange={(e) => setNumericPrice(e.target.value)}
                placeholder="25000"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Duración (min) <span className="text-brand-gold">*</span>
              </label>
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-gold"
              >
                {[15, 30, 45, 60, 75, 90].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Categoría</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand-gold"
            >
              {CUT_TAGS.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Descripción (opcional)
            </label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Detalles visibles para el cliente en la reserva"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold resize-none"
            />
          </div>

          <label className="flex items-center justify-between bg-brand-dark border border-brand-border rounded-xl px-4 py-3 cursor-pointer">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Marcar como popular</span>
            <input
              type="checkbox"
              checked={popular}
              onChange={(e) => setPopular(e.target.checked)}
              className="w-4 h-4 rounded border-brand-border text-brand-gold focus:ring-brand-gold bg-brand-dark"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl border border-brand-border text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-gold hover:bg-brand-goldHover text-black font-black py-3 rounded-xl text-xs shadow-md"
            >
              {isEdit ? 'Guardar Cambios' : 'Añadir Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
