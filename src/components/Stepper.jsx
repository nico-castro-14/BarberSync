// Barra de progreso del flujo de reserva:
// 1. Servicio → 2. Barbero → 3. Fecha & Hora → 4. Listo
export default function Stepper({ currentStep = 1 }) {
  const steps = ['Servicio', 'Barbero', 'Fecha & Hora', 'Listo']

  return (
    <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-3 bg-brand-card rounded-2xl border border-brand-border">
      {steps.map((label, idx) => {
        const step = idx + 1
        const isDone = step < currentStep
        const isCurrent = step === currentStep
        const isLast = step === steps.length

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div
              className={`flex items-center gap-2 text-xs font-bold ${
                isCurrent || isDone ? 'text-brand-gold' : 'text-slate-500'
              } ${isLast && isCurrent ? 'text-emerald-400' : ''}`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-extrabold ${
                  isLast
                    ? isCurrent
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-brand-card border border-brand-border text-slate-500'
                    : isDone || isCurrent
                      ? 'bg-brand-gold text-black'
                      : 'bg-brand-card border border-brand-border text-slate-500'
                }`}
              >
                {isLast ? '✓' : isDone ? '✓' : step}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {step < steps.length && (
              <div className={`flex-1 h-0.5 mx-2 ${isDone ? 'bg-brand-gold/60' : 'bg-brand-border'}`}></div>
            )}
          </div>
        )
      })}
    </div>
  )
}
