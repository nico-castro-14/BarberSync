import { createContext, useCallback, useContext, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabaseClient.js'

// Sesión del equipo (barbero / dueño).
//  - Con credenciales de Supabase: usa supabase.auth.signInWithPassword real.
//  - Sin credenciales: modo demo (cualquier correo + contraseña funciona).
// La sesión persiste en localStorage para sobrevivir recargas.
const SessionContext = createContext(null)

const STORAGE_KEY = 'barbersync.session'

function readStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function SessionProvider({ children }) {
  const [session, setSession] = useState(readStoredSession) // { role: 'barber'|'admin', email, name } | null

  /**
   * @param {{role: 'barber'|'admin', email: string, password: string}} creds
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  const login = useCallback(async ({ role, email, password }) => {
    const normalizedEmail = (email || '').trim()

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (error) {
        return { ok: false, error: 'Credenciales inválidas o usuario no registrado.' }
      }
      const next = {
        role,
        email: data.user?.email ?? normalizedEmail,
        name: data.user?.user_metadata?.name ?? normalizedEmail.split('@')[0],
      }
      setSession(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return { ok: true }
    }

    // Modo demo (sin backend): acceso abierto
    const next = {
      role,
      email: normalizedEmail || `demo-${role}@barbersync.app`,
      name: normalizedEmail ? normalizedEmail.split('@')[0] : role === 'admin' ? 'Dueño Demo' : 'Barbero Demo',
    }
    setSession(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {})
    }
    setSession(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = { session, login, logout, isAuthenticated: Boolean(session) }
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>')
  return ctx
}
