// ============================================================================
// Supabase Edge Function: notify-whatsapp — BarberSync PRO (Fase 5)
// ----------------------------------------------------------------------------
// Recibe el POST que emite el frontend (src/services/whatsappService.js) al
// confirmar una reserva y envía el mensaje real de WhatsApp mediante la
// Meta WhatsApp Cloud API.
//
// DESPLIEGUE:
//   1. Instala la CLI:  npm i -g supabase
//   2. Login + link:    supabase login && supabase link --project-ref <ref>
//   3. Secretos:        supabase secrets set WHATSAPP_TOKEN=... \
//                          WHATSAPP_PHONE_NUMBER_ID=... \
//                          NOTIFY_WEBHOOK_SECRET=una-clave-compartida
//   4. Deploy:          supabase functions deploy notify-whatsapp
//   5. Frontend (.env): VITE_WHATSAPP_WEBHOOK_URL=https://<ref>.supabase.co/functions/v1/notify-whatsapp
//
// SIN secretos configurados la función responde { dispatched:false, mode:'simulated' }
// y el frontend mantiene su modal de WhatsApp como fallback visual.
// ============================================================================

// @ts-expect-error: módulos remotos de Deno (IDE puede marcarlos como error)
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-notify-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface BookingPayload {
  event: string
  channel: 'whatsapp'
  to: string
  template: string
  data: {
    appointmentId: string
    clientName: string
    service: string
    barberName: string
    chair: string
    date: string
    time: string
    totalPrice: string
  }
  sentAt: string
}

function normalizePhone(raw: string): string {
  // Meta Cloud API exige solo dígitos (con código de país): "56984521199"
  return raw.replace(/[^\d]/g, '')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'method_not_allowed' }, 405)
  }

  // Seguridad básica: secreto compartido opcional
  const secret = Deno.env.get('NOTIFY_WEBHOOK_SECRET')
  if (secret && req.headers.get('x-notify-secret') !== secret) {
    return json({ ok: false, error: 'unauthorized' }, 401)
  }

  let payload: BookingPayload
  try {
    payload = await req.json()
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400)
  }

  if (!payload.to || !payload.data?.appointmentId) {
    return json({ ok: false, error: 'missing to / data.appointmentId' }, 400)
  }

  const token = Deno.env.get('WHATSAPP_TOKEN')
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const templateName = Deno.env.get('WHATSAPP_TEMPLATE') || 'booking_confirmation_v1'

  if (!token || !phoneNumberId) {
    console.log('[notify-whatsapp] Sin credenciales Meta; modo simulated. Payload:', payload)
    return json({ ok: true, dispatched: false, mode: 'simulated' })
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizePhone(payload.to),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'es_CL' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: payload.data.clientName },
                  { type: 'text', text: payload.data.service },
                  { type: 'text', text: payload.data.barberName },
                  { type: 'text', text: `${payload.data.date} ${payload.data.time}` },
                  { type: 'text', text: payload.data.chair },
                  { type: 'text', text: payload.data.totalPrice },
                ],
              },
            ],
          },
        }),
      },
    )

    const metaBody = await metaRes.json()
    if (!metaRes.ok) {
      console.error('[notify-whatsapp] Meta API error:', metaBody)
      return json({ ok: false, dispatched: false, mode: 'meta', error: metaBody }, 502)
    }

    return json({ ok: true, dispatched: true, mode: 'meta', meta: metaBody })
  } catch (err) {
    console.error('[notify-whatsapp] Error de red hacia Meta:', err)
    return json({ ok: false, dispatched: false, mode: 'simulated', error: String(err) }, 502)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
