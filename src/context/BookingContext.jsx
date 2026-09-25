import { createContext, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DATES } from '../utils/mockData.js'
import { sendWhatsAppConfirmation } from '../services/whatsappService.js'
import { useToast } from './ToastContext.jsx'
import { useStore } from './StoreContext.jsx'

// Estado global del flujo de reserva (Stepper: Servicio → Barbero →
// Fecha/Hora → Datos). Evita prop-drilling entre las secciones del wizard.
// Las selecciones guardan IDs; los objetos se derivan del catálogo del store
// (que puede venir de mockData o de Supabase en modo live).
const BookingContext = createContext(null)

export function BookingProvider({ children }) {
  const navigate = useNavigate()
  const { triggerToast, triggerBottomToast } = useToast()
  const { services, barbers, addAppointment, removeAppointment } = useStore()

  // Selecciones del wizard (IDs; null = usar default del catálogo)
  const [selectedServiceId, setSelectedServiceId] = useState(null)
  const [selectedBarberId, setSelectedBarberId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(DATES[0])
  const [selectedTime, setSelectedTime] = useState('02:00 PM')
  const [clientForm, setClientForm] = useState({ name: '', phone: '' })

  // Confirmación + modal simulado de WhatsApp
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  // Objetos derivados del catálogo (con defaults coherentes con code.html)
  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? services[1] ?? services[0],
    [services, selectedServiceId],
  )
  const selectedBarber = useMemo(
    () => barbers.find((b) => b.id === selectedBarberId) ?? barbers[0],
    [barbers, selectedBarberId],
  )

  const setSelectedService = (service) => setSelectedServiceId(service?.id ?? null)
  const setSelectedBarber = (barber) => setSelectedBarberId(barber?.id ?? null)

  // Paso actual del stepper (1-4), calculado desde el estado del flujo
  const currentStep = useMemo(() => {
    if (confirmedBooking) return 4
    if (selectedService && selectedBarber && selectedDate && selectedTime) return 3
    if (selectedService && selectedBarber) return 2
    return 1
  }, [selectedService, selectedBarber, selectedDate, selectedTime, confirmedBooking])

  // Deep-link: iniciar reserva directa con un barbero concreto
  const bookWithBarber = (barber) => {
    setSelectedBarber(barber)
    navigate('/')
    triggerToast(`Reservando directamente con ${barber.name}`)
  }

  // Confirmar reserva: registra la cita (store → Supabase en modo live),
  // dispara la automatización de WhatsApp y abre el modal fallback.
  const confirmBooking = () => {
    if (!clientForm.name.trim() || !clientForm.phone.trim()) {
      triggerToast('Por favor ingresa tu nombre y celular')
      return
    }
    if (!selectedTime) {
      triggerToast('Elige un horario disponible para continuar')
      return
    }

    const appointment = {
      id: `apt-${Date.now()}`, // se reemplaza por el uuid real si Supabase persiste
      time: selectedTime,
      client: clientForm.name.trim(),
      phone: clientForm.phone.trim(),
      service: selectedService.name,
      serviceId: selectedService.id,
      price: selectedService.price,
      numericPrice: selectedService.numericPrice,
      status: 'pending',
      barberId: selectedBarber.id,
      dateIso: selectedDate.iso,
    }

    addAppointment(appointment)

    const booking = {
      ...appointment,
      dateStr: `${selectedDate.dayName} ${selectedDate.dateStr}`,
      barberName: selectedBarber.name,
      chair: selectedBarber.chair,
    }
    setConfirmedBooking(booking)
    setWhatsAppModalOpen(true)

    // Fase 5: POST al endpoint de WhatsApp (Supabase Edge Function o API
    // externa). Si no hay endpoint, el modal simulado actúa como fallback.
    sendWhatsAppConfirmation(booking)
  }

  const closeWhatsAppModal = () => setWhatsAppModalOpen(false)

  const requestReschedule = () => {
    setWhatsAppModalOpen(false)
    triggerBottomToast('Solicitud de reprogramación abierta. Elige nueva fecha en el calendario.')
    navigate('/')
  }

  const cancelConfirmedBooking = () => {
    if (confirmedBooking) removeAppointment(confirmedBooking.id)
    setWhatsAppModalOpen(false)
    triggerBottomToast('Cita cancelada con éxito sin cargos.')
  }

  const value = {
    selectedService,
    selectedBarber,
    selectedDate,
    selectedTime,
    clientForm,
    currentStep,
    whatsAppModalOpen,
    confirmedBooking,
    setSelectedService,
    setSelectedBarber,
    setSelectedDate,
    setSelectedTime,
    setClientForm,
    bookWithBarber,
    confirmBooking,
    closeWhatsAppModal,
    requestReschedule,
    cancelConfirmedBooking,
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking debe usarse dentro de <BookingProvider>')
  return ctx
}
