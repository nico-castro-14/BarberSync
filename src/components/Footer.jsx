import { Link } from 'react-router-dom'
import { Scissors, Building2, LogIn, MapPin } from 'lucide-react'
import { useSession } from '../hooks/useSession.js'
import { BUSINESS_INFO, PLATFORM_CREDIT } from '../utils/mockData.js'
import logo from '../assets/brand/logo.jpg'

// Footer público de Barber New Yark: marca + dirección + accesos del equipo.
export default function Footer() {
  const { session } = useSession()

  return (
    <footer className="border-t border-brand-border bg-brand-dark mt-16 py-10 text-xs text-brand-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Marca + dirección */}
          <div className="flex items-center gap-3 text-center md:text-left">
            <img
              src={logo}
              alt={BUSINESS_INFO.name}
              className="w-10 h-10 rounded-full object-cover border border-brand-border"
            />
            <div>
              <span className="font-extrabold text-white block">{BUSINESS_INFO.name}</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <MapPin className="w-3 h-3 text-brand-gold" />
                {BUSINESS_INFO.address}
              </span>
            </div>
          </div>

          {/* Acceso del equipo */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {session ? (
              <Link
                to={session.role === 'admin' ? '/admin' : '/panel'}
                className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-goldHover text-black font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md text-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>Ir a mi panel ({session.role === 'admin' ? 'Dueño' : 'Barbero'})</span>
              </Link>
            ) : (
              <>
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  ¿Eres del equipo?
                </span>
                <Link
                  to="/login?rol=barbero"
                  className="inline-flex items-center gap-2 bg-brand-card hover:bg-brand-cardHover text-white font-bold px-4 py-2.5 rounded-xl border border-brand-border transition-all text-xs"
                >
                  <Scissors className="w-4 h-4 text-brand-gold" />
                  <span>Ingresar como Barbero</span>
                </Link>
                <Link
                  to="/login?rol=barberia"
                  className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-goldHover text-black font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md text-xs"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Ingresar como Barbería</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Línea final: horario resumido + sello B2B */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-brand-border/60 pt-5 text-slate-500 text-[11px]">
          <span>
            Lun–Sáb {BUSINESS_INFO.weekdayOpen}–{BUSINESS_INFO.weekdayClose} · Dom {BUSINESS_INFO.sundayOpen}–
            {BUSINESS_INFO.sundayClose}
          </span>
          <span className="text-[10px] text-slate-600 tracking-wide">{PLATFORM_CREDIT}</span>
        </div>
      </div>
    </footer>
  )
}
