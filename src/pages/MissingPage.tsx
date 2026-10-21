import { useMemo, useState } from 'react'
import { StatusBadge } from '../components/StatusBadge'
import { buildMissingText, copyText, downloadFile } from '../lib/export'
import { formatEuro, formatReleaseDate, todayIso } from '../lib/format'
import { entryOf, PRIORITY } from '../lib/stats'
import { useStore } from '../store'
import type { Volume } from '../types'

type Sort = 'numero' | 'prezzo' | 'priorita'

export function MissingPage({ onOpen }: { onOpen: (v: Volume) => void }) {
  const { volumes, collection, togglePossessed, showToast } = useStore()
  const [sort, setSort] = useState<Sort>('priorita')
  const [includeOrdered, setIncludeOrdered] = useState(false)

  const list = useMemo(() => {
    const byNumber = (a: Volume, b: Volume) => (a.numero ?? Infinity) - (b.numero ?? Infinity)
    const items = volumes.filter((v) => {
      const st = entryOf(collection, v.id).stato
      return st === 'mancante' || st === 'wishlist' || (includeOrdered && st === 'ordinato')
    })
    if (sort === 'numero') return items.sort(byNumber)
    if (sort === 'prezzo') return items.sort((a, b) => (a.prezzo ?? Infinity) - (b.prezzo ?? Infinity) || byNumber(a, b))
    return items.sort((a, b) => PRIORITY[entryOf(collection, a.id).stato] - PRIORITY[entryOf(collection, b.id).stato] || byNumber(a, b))
  }, [volumes, collection, sort, includeOrdered])

  const total = list.reduce((sum, v) => sum + (v.prezzo ?? 0), 0)
  const orderedCount = volumes.filter((v) => entryOf(collection, v.id).stato === 'ordinato').length

  async function handleCopy() {
    const ok = await copyText(buildMissingText(list, collection))
    showToast(ok ? 'Lista copiata negli appunti' : 'Copia non riuscita: usa “Scarica .txt”')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="font-display text-xl uppercase">Mi mancano</h1>
          <p className="text-sm text-neutral-400">
            {list.length} volumi · totale stimato <span className="font-semibold text-white">{formatEuro(total)}</span>
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={handleCopy} disabled={!list.length}>Copia lista</button>
        <button
          type="button"
          className="btn-ghost"
          disabled={!list.length}
          onClick={() => downloadFile(`mi-mancano-${todayIso()}.txt`, buildMissingText(list, collection), 'text/plain;charset=utf-8')}
        >
          Scarica .txt
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-md ring-1 ring-line" role="group" aria-label="Ordina per">
          {([['priorita', 'Priorità'], ['numero', 'Numero'], ['prezzo', 'Prezzo']] as const).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              className={`cursor-pointer px-3 py-1.5 text-sm font-semibold first:rounded-l-md last:rounded-r-md ${sort === k ? 'bg-marvel text-white' : 'text-neutral-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {orderedCount > 0 && (
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" className="h-4 w-4 accent-marvel" checked={includeOrdered} onChange={(e) => setIncludeOrdered(e.target.checked)} />
            Includi ordinati ({orderedCount})
          </label>
        )}
      </div>

      {list.length === 0 ? (
        <p className="py-16 text-center text-lg text-neutral-300">🎉 Non ti manca nulla: collana completa!</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl bg-panel ring-1 ring-line">
          {list.map((v) => {
            const st = entryOf(collection, v.id).stato
            return (
              <li key={v.id} className="mmh-row flex items-center gap-3 px-3 py-2.5" title={v.trama || undefined}>
                <span className="w-10 shrink-0 font-display text-sm text-marvel">{v.numero ?? 's.n.'}</span>
                <button type="button" onClick={() => onOpen(v)} className="min-w-0 flex-1 cursor-pointer text-left">
                  <span className="block truncate text-sm font-medium">{v.titolo}</span>
                  <span className="block text-xs text-neutral-500">
                    {formatReleaseDate(v.dataUscita)} · {formatEuro(v.prezzo)}
                  </span>
                </button>
                {st !== 'mancante' && <StatusBadge status={st} className="shrink-0" />}
                <button
                  type="button"
                  onClick={() => togglePossessed(v)}
                  className="shrink-0 cursor-pointer rounded-md bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30"
                  title="Segna come posseduto"
                >
                  ✓ Preso
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
