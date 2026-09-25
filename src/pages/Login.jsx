import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Scissors, Building2, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react'
import { useSession } from '../hooks/useSession.js'
import { useToast } from '../hooks/useToast.js'
import { isSupabaseConfigured } from '../services/supabaseClient.js'
import { BUSINESS_INFO } from '../utils/mockData.js'
import logo from '../assets/brand/logo.jpg'

const ROLES = {
  barbero: {
    key: 'barber',
    title: 'Soy Barbero',
    desc: 'Panel de citas, ingresos y portafolio',
    icon: Scissors,
    target: '/panel',
  },
  barberia: {
    key: 'admin',
    title: 'Soy la Barbería',
    desc: 'Métricas del negocio y gestión del equipo',
    icon: Building2,
    target: '/admin',
  },
}

// Acceso privado del equipo. En modo demo acepta cualquier credencial;
// con Supabase configurado valida contra supabase.auth.
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { session, login } = useSession()
  const { triggerToast } = useToast()

  const initialRol = searchParams.get('rol') === 'barberia' ? 'barberia' : 'barbero'
  const [rol, setRol] = useState(initialRol)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRol(searchParams.get('rol') === 'barberia' ? 'barberia' : 'barbero')
  }, [searchParams])

  // Si ya hay sesión, ir directo al panel correspondiente
  useEffect(() => {
    if (session) {
      navigate(session.role === 'admin' ? '/admin' : '/panel', { replace: true })
    }
  }, [session, navigate])

  const role = ROLES[rol]

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSupabaseConfigured && (!email.trim() || !password)) {
      triggerToast('Ingresa tu correo y contraseña')
      return
    }
    setLoading(true)
    try {
      const result = await login({ role: role.key, email, password })
      if (!result.ok) {
        triggerToast(result.error || 'No se pudo iniciar sesión')
        return
      }
      triggerToast(`Bienvenido — acceso ${role.title.replace('Soy ', '').toLowerCase()}`)
      const from = location.state?.from
      const allowedFrom = role.key === 'admin' ? ['/admin', '/panel'] : ['/panel']
      navigate(from && allowedFrom.includes(from) ? from : role.target, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-md space-y-6">
        {/* Marca */}
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={logo}
            alt={BUSINESS_INFO.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-brand-border shadow-lg shadow-amber-500/10"
          />
          <div>
            <h1 className="text-2xl font-black text-white">{BUSINESS_INFO.name}</h1>
            <p className="text-xs text-brand-muted mt-1">Acceso exclusivo para el equipo de la barbería</p>
          </div>
        </div>

        {/* Selector de rol */}
        <div className="grid grid-cols-2 gap-3">
          {Object.values(ROLES).map((r) => {
            const Icon = r.icon
            const isActive = (r.key === 'barber' && rol === 'barbero') || (r.key === 'admin' && rol === 'barberia')
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRol(r.key === 'barber' ? 'barbero' : 'barberia')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-[#181F2C] border-brand-gold shadow-xl shadow-amber-500/10'
                    : 'bg-brand-card/90 border-brand-border hover:border-slate-600 hover:bg-brand-cardHover'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${isActive ? 'text-brand-gold' : 'text-slate-400'}`} />
                <p className={`text-sm font-extrabold ${isActive ? 'text-brand-gold' : 'text-white'}`}>{r.title}</p>
                <p className="text-[11px] text-brand-muted mt-0.5 leading-snug">{r.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="bg-brand-card border border-brand-border rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl"
        >
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Correo del equipo
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={rol === 'barbero' ? 'mateo@barbersync.app' : 'dueno@barbersync.app'}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold transition-colors pl-11"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-gold transition-colors pl-11"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-4 top-4" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-400 via-brand-gold to-amber-600 hover:from-brand-gold hover:to-amber-500 text-black font-black text-sm py-4 rounded-xl shadow-xl shadow-amber-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verificando acceso…</span>
              </>
            ) : (
              <span>Entrar — {role.title}</span>
            )}
          </button>

          {!isSupabaseConfigured && (
            <p className="text-[11px] text-center text-slate-500">
              Modo demo sin Supabase: cualquier correo y contraseña te dejan entrar.
            </p>
          )}
        </form>

        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-brand-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a la página de reservas
          </Link>
        </div>
      </div>
    </div>
  )
}
