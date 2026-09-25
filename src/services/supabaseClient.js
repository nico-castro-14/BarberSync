// ============================================================
// Cliente de Supabase — BarberSync PRO
// Inicialización estándar con variables de entorno de Vite.
// Si las variables no están definidas, la app arranca igualmente
// usando mockData (modo demo) y muestra una advertencia en consola.
// ============================================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no definidas. ' +
      'La aplicación funciona en modo demo (mockData). Copia .env.example a .env para conectar el backend.',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
)
