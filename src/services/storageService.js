// ============================================================
// Supabase Storage — Barber New Yark
// Subida de fotos del portafolio al bucket `portfolio_images`.
// (El bucket y sus políticas se crean en supabase/schema.sql)
// ============================================================
import { supabase, isSupabaseConfigured } from './supabaseClient.js'

export const PORTFOLIO_BUCKET = 'portfolio_images'

/**
 * Genera un nombre de archivo único y seguro para el bucket.
 * Formato: <barberId>/<YYYYMMDD-HHmmss>-<random>.<ext>
 * Ejemplo: b1/20260922-143015-x7k2q9.jpg
 */
export function buildPortfolioImagePath(barberId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const now = new Date()
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('')
  const rand = Math.random().toString(36).slice(2, 8)
  return `${barberId}/${stamp}-${rand}.${ext || 'jpg'}`
}

/**
 * Sube la imagen al bucket y retorna su URL pública.
 * @returns {Promise<{ path: string, publicUrl: string }>}
 */
export async function uploadPortfolioImage(barberId, file) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase no configurado (modo demo)')
  }
  const path = buildPortfolioImagePath(barberId, file)
  const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || 'image/jpeg',
  })
  if (error) throw error

  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}
