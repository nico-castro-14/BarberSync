import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  INITIAL_APPOINTMENTS,
  INITIAL_WORKS,
  BUSINESS_INFO,
  SERVICES,
  BARBERS_DATA,
  SERVICE_TAG_ICONS,
} from '../utils/mockData.js'
import { isSupabaseConfigured } from '../services/supabaseClient.js'
import {
  fetchCatalog,
  insertAppointment,
  insertPortfolioItemWithImage,
  updateAppointment,
  deleteAppointment,
  updatePortfolioLikes,
  insertService,
  updateServiceById,
  deleteServiceById,
  setBarberActive,
} from '../services/dataService.js'
import { uploadPortfolioImage } from '../services/storageService.js'
import { formatCLP, isUuid } from '../utils/format.js'
import { useToast } from './ToastContext.jsx'

// Store global de datos compartidos (catálogo, citas, portafolio, config).
// Hidrata desde Supabase cuando hay credenciales (modo live) y conserva
// mockData como fallback (modo demo). Todas las escrituras son optimistas.
const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const { triggerToast } = useToast()

  // Catálogo (servicios/barberos) — se reemplaza por datos reales si Supabase responde
  const [services, setServices] = useState(SERVICES)
  const [barbers, setBarbers] = useState(BARBERS_DATA)
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS)
  const [portfolioItems, setPortfolioItems] = useState(INITIAL_WORKS)
  const [businessInfo, setBusinessInfo] = useState(BUSINESS_INFO)

  const [dataSource, setDataSource] = useState(isSupabaseConfigured ? 'loading' : 'mock')

  // --- Fidelidad (tarjeta de sellos, opcional) -------------------------------
  // Clave: teléfono del cliente (solo dígitos) → { name, stamps }.
  // Persiste en localStorage en modo demo; lista para migrar a tabla propia.
  const [loyalty, setLoyalty] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('barbersync_loyalty_v1') ?? '{}')
    } catch {
      return {}
    }
  })

  const persistLoyalty = (next) => {
    setLoyalty(next)
    try {
      localStorage.setItem('barbersync_loyalty_v1', JSON.stringify(next))
    } catch {
      /* almacenamiento no disponible */
    }
  }

  // Suma un sello al cliente (se llama al marcar la cita como completada)
  const registerStamp = (name, phone) => {
    const key = String(phone || '').replace(/\D/g, '')
    if (!key) return null
    const prev = loyalty[key] ?? { name: name?.trim() || 'Cliente', stamps: 0 }
    const entry = { name: name?.trim() || prev.name, stamps: prev.stamps + 1 }
    persistLoyalty({ ...loyalty, [key]: entry })
    return entry
  }

  const loyaltyStampsFor = (phone) => {
    const key = String(phone || '').replace(/\D/g, '')
    return key ? (loyalty[key] ?? null) : null
  }

  // Carga inicial del catálogo (solo una vez)
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    fetchCatalog()
      .then((catalog) => {
        if (cancelled || !catalog) return
        if (catalog.services.length) setServices(catalog.services)
        if (catalog.barbers.length) setBarbers(catalog.barbers)
        // Coherente con servicios/barberos: si la BD aún no tiene trabajos
        // publicados, conservar las fotos demo del portafolio.
        if (catalog.portfolioItems.length) setPortfolioItems(catalog.portfolioItems)
        setAppointments(catalog.appointments)
        setDataSource('supabase')
      })
      .catch((err) => {
        console.warn('[data] Falló fetchCatalog; modo demo.', err)
        if (!cancelled) setDataSource('mock')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const isLive = dataSource === 'supabase'

  // --- Helpers -------------------------------------------------------------
  const barberNameOf = useMemo(() => {
    const map = new Map(barbers.map((b) => [b.id, b.name]))
    return (id) => map.get(id) ?? 'Barbero'
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barbers])

  // --- Appointments --------------------------------------------------------
  const addAppointment = (appointment) => {
    setAppointments((prev) => [appointment, ...prev])

    // Persistencia real solo en modo live (ids uuid provienen del catálogo DB)
    if (isLive && isUuid(appointment.barberId) && isUuid(appointment.serviceId)) {
      insertAppointment({
        barberId: appointment.barberId,
        serviceId: appointment.serviceId,
        dateIso: appointment.dateIso,
        time12: appointment.time,
        totalPrice: appointment.numericPrice,
        clientName: appointment.client,
        clientPhone: appointment.phone,
      })
        .then((row) => {
          // Reemplaza el id temporal (apt-…) por el id real de la fila
          if (row?.id) {
            setAppointments((prev) => prev.map((a) => (a.id === appointment.id ? { ...a, id: row.id } : a)))
          }
        })
        .catch((err) => console.warn('[data] No se pudo persistir la cita en Supabase:', err.message))
    }
  }

  const removeAppointment = (id) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id))
    if (isLive && isUuid(id)) {
      deleteAppointment(id).catch((err) => console.warn('[data] deleteAppointment:', err.message))
    }
  }

  const updateAppointmentStatus = (id, newStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
    if (newStatus === 'completed') {
      triggerToast('Cita completada e ingreso sumado')
      // Fidelidad (opcional): cada cita completada suma un sello al cliente
      if (businessInfo.loyaltyEnabled) {
        const apt = appointments.find((a) => a.id === id)
        const entry = apt ? registerStamp(apt.client, apt.phone) : null
        if (entry) {
          triggerToast(`🎁 Sello agregado a ${entry.name}: ${entry.stamps}/${businessInfo.loyaltyGoal ?? 6}`)
        }
      }
    }
    if (newStatus === 'noshow') triggerToast('Cita registrada como inasistencia')
    if (isLive && isUuid(id)) {
      updateAppointment(id, { status: newStatus }).catch((err) =>
        console.warn('[data] updateAppointment:', err.message),
      )
    }
  }

  // --- Portfolio ------------------------------------------------------------
  const toggleLike = (id) => {
    setPortfolioItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 }
          : item,
      ),
    )
    if (isLive && isUuid(id)) {
      const item = portfolioItems.find((i) => i.id === id)
      if (item) {
        const likes = item.liked ? item.likes - 1 : item.likes + 1
        updatePortfolioLikes(id, likes).catch((err) => console.warn('[data] updatePortfolioLikes:', err.message))
      }
    }
  }

  // Publica un corte en el portafolio. Si se adjunta `file` (input type=file),
  // se sube a Supabase Storage (bucket portfolio_images) en modo live y se
  // reemplaza la URL local por la URL pública.
  const publishCut = ({ title, desc, tag, barber, file = null }) => {
    const newCut = {
      id: `cut-${Date.now()}`,
      title,
      barberId: barber.id,
      barberName: barber.name.split('"')[0].trim().split(' ').slice(0, 2).join(' '),
      tag,
      likes: 1,
      liked: true,
      desc: desc || 'Nuevo trabajo realizado en Barber New Yark.',
      // Vista previa inmediata (modo demo o mientras sube a Storage)
      imageUrl: file ? URL.createObjectURL(file) : null,
      imageBg: 'from-amber-900/40 via-stone-900 to-black',
    }
    setPortfolioItems((prev) => [newCut, ...prev])

    if (isLive && isUuid(barber.id)) {
      const persist = async () => {
        let publicUrl = null
        if (file) {
          const uploaded = await uploadPortfolioImage(barber.id, file)
          publicUrl = uploaded.publicUrl
          setPortfolioItems((prev) => prev.map((i) => (i.id === newCut.id ? { ...i, imageUrl: publicUrl } : i)))
        }
        const row = await insertPortfolioItemWithImage({
          barberId: barber.id,
          title: newCut.title,
          tag,
          description: newCut.desc,
          likes: 1,
          imageUrl: publicUrl,
        })
        if (row?.id) setPortfolioItems((prev) => prev.map((i) => (i.id === newCut.id ? { ...i, id: row.id } : i)))
      }
      persist()
        .then(() => triggerToast('¡Nuevo corte publicado exitosamente en tu portafolio!'))
        .catch((err) => {
          console.warn('[data] publishCut:', err.message)
          triggerToast('El corte quedó guardado localmente (revisa la conexión)')
        })
    } else {
      triggerToast('¡Nuevo corte publicado exitosamente en tu portafolio!')
    }
    return newCut
  }

  // --- CRUD Servicios (Admin) ------------------------------------------------
  // Normaliza el shape de UI y persiste en Supabase cuando hay backend activo.
  const normalizeService = (data, id) => ({
    id: id ?? `svc-${Date.now()}`,
    name: data.name,
    price: formatCLP(data.numericPrice),
    numericPrice: Number(data.numericPrice),
    duration: `${data.durationMin} min`,
    durationMin: Number(data.durationMin),
    desc: data.desc || '',
    icon: SERVICE_TAG_ICONS[data.tag] ?? 'scissors',
    popular: Boolean(data.popular),
    tag: data.tag || 'Cabello',
  })

  const saveService = (serviceData) => {
    const isEdit = Boolean(serviceData.id)
    const service = normalizeService(serviceData, isEdit ? serviceData.id : null)

    setServices((prev) => (isEdit ? prev.map((s) => (s.id === service.id ? service : s)) : [...prev, service]))

    if (isLive) {
      const op = isEdit
        ? updateServiceById(service.id, service)
        : insertService(service).then((row) => {
            if (row?.id) setServices((prev) => prev.map((s) => (s.id === service.id ? { ...s, id: row.id } : s)))
          })
      op.catch((err) => {
        console.warn('[data] saveService:', err.message)
        triggerToast('Cambio aplicado solo localmente (sin conexión a Supabase)')
      })
    }
    triggerToast(isEdit ? 'Servicio actualizado' : 'Servicio añadido al catálogo')
    return service
  }

  const deleteService = (id) => {
    setServices((prev) => prev.filter((s) => s.id !== id))
    if (isLive && isUuid(id)) {
      deleteServiceById(id).catch((err) => console.warn('[data] deleteService:', err.message))
    }
    triggerToast('Servicio eliminado del catálogo')
  }

  // --- Equipo (Admin): activar / desactivar ----------------------------------
  const toggleBarberActive = (id, active) => {
    setBarbers((prev) => prev.map((b) => (b.id === id ? { ...b, active } : b)))
    if (isLive && isUuid(id)) {
      setBarberActive(id, active).catch((err) => console.warn('[data] setBarberActive:', err.message))
    }
  }

  const value = {
    // catálogo
    services,
    barbers,
    appointments,
    portfolioItems,
    businessInfo,
    loyalty, // fidelidad: { [telefonoDigitos]: { name, stamps } }
    dataSource, // 'mock' | 'loading' | 'supabase'
    isLive,
    barberNameOf,
    loyaltyStampsFor,
    // acciones
    setBusinessInfo,
    addAppointment,
    removeAppointment,
    updateAppointmentStatus,
    toggleLike,
    publishCut,
    saveService,
    deleteService,
    toggleBarberActive,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de <StoreProvider>')
  return ctx
}
