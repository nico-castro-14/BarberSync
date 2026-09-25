// ============================================================
// Servicio de Automatización WhatsApp — BarberSync PRO (Fase 5)
//
// Dispara un POST al endpoint configurado en VITE_WHATSAPP_WEBHOOK_URL,
// que puede ser una Supabase Edge Function (p. ej. /functions/v1/notify-whatsapp)
// o una API externa (Twilio, Meta Cloud API, proveedor local).
//
// Si el endpoint NO está configurado o la llamada falla, la app conserva
// el modal simulado de WhatsApp como fallback visual (sin romper el flujo).
// ============================================================

/**
 * Envía la confirmación de reserva al proveedor de WhatsApp.
 * @param {object} booking Datos de la cita confirmada.
 * @returns {Promise<{dispatched: boolean, mode: 'webhook'|'simulated', error?: string}>}
 */
export async function sendWhatsAppConfirmation(booking) {
  const endpoint = import.meta.env.VITE_WHATSAPP_WEBHOOK_URL

  const payload = {
    event: 'booking.confirmation',
    channel: 'whatsapp',
    to: booking.phone,
    template: 'booking_confirmation_v1',
    data: {
      appointmentId: booking.id,
      clientName: booking.client,
      service: booking.service,
      barberName: booking.barberName,
      chair: booking.chair,
      date: booking.dateStr,
      time: booking.time,
      totalPrice: booking.price,
      actions: ['reschedule', 'cancel', 'view_maps'],
    },
    sentAt: new Date().toISOString(),
  }

  if (!endpoint) {
    console.info(
      '[whatsapp] VITE_WHATSAPP_WEBHOOK_URL no configurada. ' +
        'Se mantiene el modal simulado de WhatsApp (fallback visual). Payload:',
      payload,
    )
    return { dispatched: false, mode: 'simulated' }
  }

  try {
    // Si la Edge Function define NOTIFY_WEBHOOK_SECRET, se envía como header.
    const headers = { 'Content-Type': 'application/json' }
    const secret = import.meta.env.VITE_WHATSAPP_WEBHOOK_SECRET
    if (secret) headers['x-notify-secret'] = secret

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${response.statusText}`)
    }
    return { dispatched: true, mode: 'webhook' }
  } catch (error) {
    // Fallback: el modal simulado ya se mostró al usuario; solo registramos el fallo.
    console.warn('[whatsapp] Falló el POST de confirmación. Fallback visual activo.', error)
    return { dispatched: false, mode: 'simulated', error: error.message }
  }
}
