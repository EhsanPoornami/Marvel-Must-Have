import { formatEuro, formatReleaseDate } from '../lib/format'
import { entryOf } from '../lib/stats'
import { useStore } from '../store'
import type { Volume } from '../types'
import { Cover } from './Cover'
import { StatusBadge } from './StatusBadge'

interface Props {
  volume: Volume
  onEdit: (v: Volume) => void
}

/** Compact rating, e.g. "★ 4"; nothing when the volume isn't rated. */
function RatingBadge({ voto, className = '' }: { voto?: number; className?: string }) {
  if (!voto) return null
  return (
    <span className={`text-xs font-bold whitespace-nowrap text-caption ${className}`} title={`Il mio voto: ${voto}/5`} aria-label={`Voto ${voto} su 5`}>
      ★ {voto}
    </span>
  )
}

const ownedRing =(owned: boolean) => (owned ? 'ring-2 ring-emerald-500/70' : 'ring-1 ring-line')

/** Grid card: tap opens the details, where the volume can be added to a list. */
export function VolumeCard({ volume, onEdit }: Props) {
  const { collection } = useStore()
  const entry = entryOf(collection, volume.id)
  const owned = entry.stato === 'posseduto'

  return (
    <div className={`mmh-card group relative rounded-lg bg-panel ${ownedRing(owned)}`}>
      <button
        type="button"
        onClick={() => onEdit(volume)}
        className="block w-full cursor-pointer overflow-hidden rounded-lg text-left"
        title="Tocca per aprire il menu del volume"
      >
        <div className="mmh-cover relative overflow-hidden">
          <Cover volume={volume} className={owned ? '' : 'opacity-60 grayscale-[60%] transition duration-300 group-hover:opacity-100 group-hover:grayscale-0'} />
          {volume.trama && (
            <span className="mmh-card-plot" aria-hidden="true">
              <span className="line-clamp-[9]">{volume.trama}</span>
            </span>
          )}
        </div>
        <div className="space-y-1 p-2">
          <div className="flex items-center justify-between gap-1">
            <span className="mmh-num font-display text-sm text-marvel">{volume.numero !== null ? `#${volume.numero}` : 's.n.'}</span>
            <StatusBadge status={entry.stato} />
          </div>
          <p className="line-clamp-2 min-h-[2.5em] text-xs leading-tight font-medium text-neutral-100">{volume.titolo}</p>
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] text-neutral-500">
              {formatEuro(volume.prezzo)}
              {volume.daVerificare && <span className="text-amber-300/80" title="Alcuni dati sono da verificare"> · da verificare</span>}
            </p>
            <RatingBadge voto={entry.voto} />
          </div>
        </div>
      </button>
      {owned && (
        <span className="pointer-events-none absolute top-2 left-2 grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-sm font-bold text-black shadow">✓</span>
      )}
    </div>
  )
}

/** Compact list row with the same interactions as the card. */
export function VolumeRow({ volume, onEdit }: Props) {
  const { collection, togglePossessed } = useStore()
  const entry = entryOf(collection, volume.id)
  const owned = entry.stato === 'posseduto'

  return (
    <div className="mmh-row flex items-center gap-2 rounded-lg bg-panel p-2 ring-1 ring-line" title={volume.trama || undefined}>
      <button
        type="button"
        onClick={() => togglePossessed(volume)}
        className={`grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full text-lg font-bold ring-1 ${owned ? 'bg-emerald-500 text-black ring-emerald-400' : 'bg-panel-2 text-neutral-600 ring-line hover:text-emerald-400'}`}
        aria-label={owned ? 'Segna come mancante' : 'Segna come posseduto'}
        title={owned ? 'Segna come mancante' : 'Segna come posseduto'}
      >
        ✓
      </button>
      <button type="button" onClick={() => onEdit(volume)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left">
        <Cover volume={volume} className="mmh-tilt hidden w-10 shrink-0 rounded sm:block" />
        <span className="w-10 shrink-0 font-display text-sm text-marvel">{volume.numero ?? 's.n.'}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-neutral-100">{volume.titolo}</span>
          <span className="block truncate text-xs text-neutral-500">
            {[volume.sceneggiatura.join(', '), formatReleaseDate(volume.dataUscita)].filter(Boolean).join(' · ')}
            {volume.daVerificare && <span className="text-amber-300"> · da verificare</span>}
          </span>
        </span>
        <RatingBadge voto={entry.voto} className="shrink-0" />
        <span className="hidden w-16 shrink-0 text-right text-xs text-neutral-400 sm:block">{formatEuro(volume.prezzo)}</span>
        <StatusBadge status={entry.stato} className="shrink-0" />
      </button>
    </div>
  )
}
