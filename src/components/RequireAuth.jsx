import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../hooks/useSession.js'

// Guardia de rutas para zonas privadas del equipo.
//  - role="barber" → acepta barber y admin (el dueño puede ver el panel).
//  - role="admin"  → solo admin.
// Sin sesión redirige a /login preseleccionando el rol correspondiente.
export default function RequireAuth({ role, children }) {
  const { session } = useSession()
  const location = useLocation()

  if (!session) {
    const rolParam = role === 'admin' ? 'barberia' : 'barbero'
    return <Navigate to={`/login?rol=${rolParam}`} replace state={{ from: location.pathname }} />
  }

  const allowed = role === 'admin' ? ['admin'] : ['barber', 'admin']
  if (!allowed.includes(session.role)) {
    // Sesión válida pero con otro rol: lo mandamos a su propio panel.
    return <Navigate to={session.role === 'admin' ? '/admin' : '/panel'} replace />
  }

  return children
}
