import { useMemo, type ReactNode } from 'react'
import { Cover } from '../components/Cover'
import { STATUS_STYLES } from '../lib/statusStyles'
import { formatDate, formatEuro } from '../lib/format'
import { computeStats, entryOf } from '../lib/stats'
import { useStore } from '../store'
import { STATUS_LABELS, STATUSES, type Volume } from '../types'

function StatCard({ label, value, hint, accent = false }: { label: string; value: ReactNode; hint?: ReactNode; accent?: boolean }) {
  return (
    <div className={`mmh-stat mmh-halftone rounded-xl p-4 ring-1 ${accent ? 'bg-marvel/10 ring-marvel/50' : 'bg-panel ring-line'}`}>
      <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase">{label}</p>
      <p className="mmh-stat-value mt-1 font-display text-2xl text-white sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </div>
  )
}

function Shelf({ title, volumes, onOpen, empty, href }: { title: string; volumes: Volume[]; onOpen: (v: Volume) => void; empty: string; href: string }) {
  return (
    <section className="rounded-xl bg-panel p-4 ring-1 ring-line">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm tracking-wide uppercase">{title}</h2>
        <a href={href} className="text-xs font-semibold text-marvel hover:underline">Vedi tutti</a>
      </div>
      {volumes.length === 0 ? (
        <p className="text-sm text-neutral-500">{empty}</p>
      ) : (
        <div className="-mx-2 flex gap-3 overflow-x-auto px-2 pt-3 pb-2">
          {volumes.map((v) => (
            <button key={v.id} type="button" onClick={() => onOpen(v)} className="mmh-shelf-item w-20 shrink-0 cursor-pointer text-left" title={v.trama || undefined}>
              <Cover volume={v} className="rounded ring-1 ring-line" />
              <p className="mt-1 truncate text-[11px] text-neutral-300">{v.numero !== null ? `#${v.numero} ` : ''}{v.titolo}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export function DashboardPage({ onOpen }: { onOpen: (v: Volume) => void }) {
  const { volumes, collection } = useStore()
  const s = useMemo(() => computeStats(volumes, collection), [volumes, collection])
  const pct = Math.round(s.completion * 1000) / 10

  const wishlist = volumes.filter((v) => entryOf(collection, v.id).stato === 'wishlist').slice(0, 12)
  const recent = volumes
    .filter((v) => entryOf(collection, v.id).stato === 'posseduto' && entryOf(collection, v.id).dataAcquisto)
    .sort((a, b) => (entryOf(collection, b.id).dataAcquisto ?? '').localeCompare(entryOf(collection, a.id).dataAcquisto ?? ''))
    .slice(0, 12)
  const latest = volumes.filter((v) => v.numero !== null).slice(-6).reverse()
  const latestMissing = latest.filter((v) => entryOf(collection, v.id).stato !== 'posseduto')

  return (
    <div className="space-y-5">
      <section className="mmh-hero mmh-halftone rounded-2xl bg-gradient-to-br from-marvel/25 via-panel to-panel p-5 ring-1 ring-marvel/40">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold tracking-wide text-neutral-300 uppercase">Completamento collana</p>
            <p className="font-display text-5xl text-white">{pct.toLocaleString('it-IT')}%</p>
          </div>
          <p className="text-sm text-neutral-300">
            <span className="font-bold text-white">{s.owned}</span> su {s.total} volumi
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/60" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="mmh-progress h-full rounded-full bg-gradient-to-r from-marvel-dark to-marvel transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {STATUSES.map((st) => (
            <span key={st} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[st]}`}>
              {STATUS_LABELS[st]}: {s.byStatus[st]}
            </span>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Posseduti" value={s.owned} />
        <StatCard label="Mancanti" value={s.notOwned} hint={s.byStatus.ordinato ? `di cui ${s.byStatus.ordinato} ordinati` : undefined} />
        <StatCard
          label="Spesa totale"
          value={formatEuro(s.spent)}
          hint={s.ownedWithoutPricePaid ? `${s.ownedWithoutPricePaid} posseduti senza prezzo pagato` : undefined}
        />
        <StatCard
          accent
          label="Per completare"
          value={formatEuro(s.costToComplete)}
          hint={s.notOwnedWithoutPrice ? `stima; ${s.notOwnedWithoutPrice} mancanti senza prezzo` : 'stima sui prezzi di copertina'}
        />
      </div>

      <Shelf title="★ Wishlist" volumes={wishlist} onOpen={onOpen} href="#/mancanti" empty="Nessun volume in wishlist. Aprine uno e scegli “Wishlist” per dargli priorità alta." />
      <Shelf title="Ultime uscite che ti mancano" volumes={latestMissing} onOpen={onOpen} href="#/mancanti" empty="Hai tutte le ultime uscite!" />
      <Shelf
        title="Ultimi acquisti"
        volumes={recent}
        onOpen={onOpen}
        href="#/catalogo"
        empty="Ancora nessun acquisto registrato: vai in Collezione e tocca i volumi che possiedi."
      />
      {recent.length > 0 && (
        <p className="text-xs text-neutral-500">Ultimo acquisto: {formatDate(entryOf(collection, recent[0].id).dataAcquisto)}</p>
      )}
    </div>
  )
}
