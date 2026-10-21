import type { Volume } from '../types'

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

export const formatEuro = (n: number | null | undefined) => (n === null || n === undefined ? '—' : euro.format(n))

/** "2020-07" -> "lug 2020", "2020-07-16" -> "16 lug 2020". */
export function formatReleaseDate(s: string): string {
  const m = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/)
  if (!m) return s || '—'
  const month = MONTHS[Number(m[2]) - 1] ?? m[2]
  return m[3] ? `${Number(m[3])} ${month} ${m[1]}` : `${month} ${m[1]}`
}

/** "2026-10-21" -> "21/10/2026". */
export function formatDate(s: string | undefined): string {
  const m = s?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s || '—'
}

export const volumeLabel = (v: Volume) => (v.numero !== null ? `#${v.numero} ${v.titolo}` : v.titolo)

export function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Parses "15", "15,50" or "15.50"; empty or invalid input gives undefined. */
export function parseEuro(s: string): number | undefined {
  const n = Number(s.trim().replace(',', '.'))
  return s.trim() === '' || Number.isNaN(n) ? undefined : n
}
