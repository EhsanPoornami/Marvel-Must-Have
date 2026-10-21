import type { Status } from '../types'

/** Tailwind classes for the colored status badges and buttons. */
export const STATUS_STYLES: Record<Status, string> = {
  posseduto: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/40',
  mancante: 'bg-neutral-500/15 text-neutral-300 ring-neutral-500/40',
  ordinato: 'bg-sky-500/15 text-sky-300 ring-sky-500/40',
  wishlist: 'bg-amber-500/15 text-amber-300 ring-amber-500/40',
}
