import { useEffect, useRef, useState } from 'react'
import { Upload, X, ImagePlus } from 'lucide-react'
import { CUT_TAGS } from '../utils/mockData.js'
import { buildPortfolioImagePath } from '../services/storageService.js'
import { useStore } from '../hooks/useStore.js'

// Modal para publicar un nuevo corte en el portafolio del barbero.
// Recibe un archivo de imagen real (<input type="file">), genera el nombre
// único para Supabase Storage (bucket portfolio_images) y publica.
export default function UploadCutModal({ open, onClose, barber }) {
  const { publishCut } = useStore()
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [targetPath, setTargetPath] = useState(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [tag, setTag] = useState('Fade')

  // Libera el objectURL al cerrar / desmontar
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  if (!open) return null

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setTargetPath(null)
    setTitle('')
    setDesc('')
    setTag('Fade')
  }

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith('image/')) return

    if (preview) URL.revokeObjectURL(preview)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    // Nombre único preparado para Supabase Storage: <barberId>/<timestamp>-<rand>.<ext>
    setTargetPath(buildPortfolioImagePath(barber.id, selected))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    publishCut({ title: title.trim(), desc: desc.trim(), tag, barber, file })
    resetForm()
    onClose()
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-gold/15 text-brand-gold flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black text-white">Publicar en Portafolio</h3>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de imagen real (drag & drop + clic) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const dropped = e.dataTransfer.files?.[0]
              if (dropped) handleFileChange({ target: { files: [dropped] } })
            }}
            className="border-2 border-dashed border-brand-border hover:border-brand-gold/50 rounded-2xl p-4 text-center space-y-2 bg-brand-dark cursor-pointer transition-colors"
          >
            {preview ? (
              <>
                <img src={preview} alt="Vista previa" className="mx-auto h-32 w-auto rounded-xl object-cover" />
                <p className="text-[11px] text-slate-500">Clic para cambiar la foto</p>
                {targetPath && (
                  <p className="text-[10px] text-slate-600 font-mono break-all">storage: {targetPath}</p>
                )}
              </>
            ) : (
              <>
                <ImagePlus className="w-8 h-8 mx-auto text-brand-gold" />
                <p className="text-xs font-bold text-white">Arrastra la foto del corte o haz clic para explorar</p>
                <p className="text-[11px] text-slate-500">JPG / PNG / WebP • se sube al bucket portfolio_images</p>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Nombre del Estilo / Corte <span className="text-brand-gold">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Fade medio con barba perfilada"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Categoría / Tag Principal <span className="text-brand-gold">*</span>
            </label>
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
              Técnica o Acabado (Opcional)
            </label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej: Navaja libre en contornos, toalla caliente y aceite de cedro."
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-3 rounded-xl border border-brand-border text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-gold hover:bg-brand-goldHover text-black font-black py-3 rounded-xl text-xs shadow-md"
            >
              Publicar en Portafolio
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
