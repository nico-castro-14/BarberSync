import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastContext = createContext(null)

const TOAST_DURATION = 3200

export function ToastProvider({ children }) {
  // Toast principal (superior derecha) — feedback general de la app
  const [toast, setToast] = useState(null)
  // Toast secundario (inferior centrado) — acciones del flujo de WhatsApp
  const [bottomToast, setBottomToast] = useState(null)

  const topTimer = useRef(null)
  const bottomTimer = useRef(null)

  const triggerToast = useCallback((msg) => setToast(msg), [])
  const triggerBottomToast = useCallback((msg) => setBottomToast(msg), [])
  const dismissToast = useCallback(() => setToast(null), [])
  const dismissBottomToast = useCallback(() => setBottomToast(null), [])

  useEffect(() => {
    if (!toast) return undefined
    clearTimeout(topTimer.current)
    topTimer.current = setTimeout(() => setToast(null), TOAST_DURATION)
    return () => clearTimeout(topTimer.current)
  }, [toast])

  useEffect(() => {
    if (!bottomToast) return undefined
    clearTimeout(bottomTimer.current)
    bottomTimer.current = setTimeout(() => setBottomToast(null), TOAST_DURATION * 2)
    return () => clearTimeout(bottomTimer.current)
  }, [bottomToast])

  const value = {
    toast,
    bottomToast,
    triggerToast,
    triggerBottomToast,
    dismissToast,
    dismissBottomToast,
  }

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
