import { Routes, Route, Navigate } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Toast from './components/Toast.jsx'
import WhatsAppModal from './components/WhatsAppModal.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import ClientBooking from './pages/ClientBooking.jsx'
import BarberPortfolio from './pages/BarberPortfolio.jsx'
import Login from './pages/Login.jsx'
import BarberDashboard from './pages/BarberDashboard.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AppointmentPage from './pages/AppointmentPage.jsx'
import RateBarber from './pages/RateBarber.jsx'

// Estructura separada por áreas:
//  - PÚBLICA (sin navbar): / (reserva cliente) y /barbero/:handle (portafolio)
//  - ACCESO: /login (barbero | barbería)
//  - PRIVADA: /panel (barbero) y /admin (dueño), protegidas con RequireAuth
export default function App() {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col text-slate-100 antialiased selection:bg-amber-500 selection:text-black">
      <Toast />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-10">
        <Routes>
          {/* Área pública */}
          <Route path="/" element={<ClientBooking />} />
          <Route path="/barbero/:handle" element={<BarberPortfolio />} />
          <Route path="/cita" element={<AppointmentPage />} />
          <Route path="/calificar/:handle" element={<RateBarber />} />

          {/* Acceso del equipo */}
          <Route path="/login" element={<Login />} />

          {/* Área privada */}
          <Route
            path="/panel"
            element={
              <RequireAuth role="barber">
                <BarberDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth role="admin">
                <AdminDashboard />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Overlay global: simulador de WhatsApp (fallback visual de la automatización) */}
      <WhatsAppModal />
    </div>
  )
}
