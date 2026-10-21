import { useMemo, useState, type ReactNode } from 'react'
import { StatusBadge } from '../components/StatusBadge'
import { VolumeCard, VolumeRow } from '../components/VolumeItem'
import { fold, searchText } from '../lib/catalog'
import { entryOf } from '../lib/stats'
import { useStore } from '../store'
import { STATUSES, type Status, type Volume } from '../types'

type SearchIn = 'tutto' | 'titolo' | 'personaggio' | 'autore'
type Sort = 'numero' | 'numero-desc' | 'titolo' | 'prezzo'
type StatusFilter = Status | 'tutti' | 'verificare'

function haystack(v: Volume, where: SearchIn): string {
  switch (where) {
    case 'titolo': return fold(v.titolo)
    case 'personaggio': return fold(v.personaggi.join(' '))
    case 'autore': return fold([...v.sceneggiatura, ...v.disegni].join(' '))
    default: return searchText(v)
  }
}

export function CatalogPage({ onOpen, onNew }: { onOpen: (v: Volume) => void; onNew: () => void }) {
  const { volumes, collection, settings, updateSettings } = useStore()
  const [query, setQuery] = useState('')
  const [searchIn, setSearchIn] = useState<SearchIn>('tutto')
  const [status, setStatus] = useState<StatusFilter>('tutti')
  const [sort, setSort] = useState<Sort>('numero')

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { tutti: volumes.length, posseduto: 0, mancante: 0, ordinato: 0, wishlist: 0, verificare: 0 }
    for (const v of volumes) {
      c[entryOf(collection, v.id).stato]++
      if (v.daVerificare) c.verificare++
    }
    return c
  }, [volumes, collection])

  const filtered = useMemo(() => {
    const terms = fold(query).split(/\s+/).filter(Boolean)
    const list = volumes.filter((v) => {
      if (status === 'verificare' ? !v.daVerificare : status !== 'tutti' && entryOf(collection, v.id).stato !== status) return false
      const h = haystack(v, searchIn)
      return terms.every((t) => h.includes(t))
    })
    if (sort === 'numero-desc') list.reverse()
    else if (sort === 'titolo') list.sort((a, b) => a.titolo.localeCompare(b.titolo, 'it'))
    else if (sort === 'prezzo') list.sort((a, b) => (a.prezzo ?? Infinity) - (b.prezzo ?? Infinity))
    return list
  }, [volumes, collection, query, searchIn, status, sort])

  const chips: { key: StatusFilter; label: ReactNode }[] = [
    { key: 'tutti', label: 'Tutti' },
    ...STATUSES.map((s) => ({ key: s as StatusFilter, label: <StatusBadge status={s} className="!bg-transparent !p-0 !ring-0" /> })),
    { key: 'verificare', label: <span className="text-amber-300">Da verificare</span> },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto font-display text-xl uppercase">La mia collezione</h1>
        <div className="flex rounded-md ring-1 ring-line" role="group" aria-label="Vista">
          {(['griglia', 'elenco'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => updateSettings({ viewMode: m })}
              className={`cursor-pointer px-3 py-1.5 text-sm font-semibold first:rounded-l-md last:rounded-r-md ${settings.viewMode === m ? 'bg-marvel text-white' : 'text-neutral-300'}`}
            >
              {m === 'griglia' ? 'Griglia' : 'Elenco'}
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary" onClick={onNew}>+ Nuovo volume</button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="search"
            className="field pl-9"
            placeholder="Cerca titolo, personaggio, autore, #numero…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-neutral-500" fill="currentColor" aria-hidden="true">
            <path d="M8.5 2a6.5 6.5 0 0 1 5.2 10.4l4 4-1.4 1.4-4-4A6.5 6.5 0 1 1 8.5 2Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
          </svg>
        </div>
        <div className="flex gap-2">
          <select className="field sm:w-40" value={searchIn} onChange={(e) => setSearchIn(e.target.value as SearchIn)} aria-label="Cerca in">
            <option value="tutto">In tutti i campi</option>
            <option value="titolo">Solo titolo</option>
            <option value="personaggio">Solo personaggio</option>
            <option value="autore">Solo autore</option>
          </select>
          <select className="field sm:w-40" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordina">
            <option value="numero">Numero ↑</option>
            <option value="numero-desc">Numero ↓</option>
            <option value="titolo">Titolo A–Z</option>
            <option value="prezzo">Prezzo ↑</option>
          </select>
        </div>
      </div>

      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setStatus(c.key)}
            className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${status === c.key ? 'bg-panel-2 text-white ring-marvel' : 'text-neutral-300 ring-line'}`}
          >
            {c.label}
            <span className="text-neutral-500">{counts[c.key]}</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-neutral-500">
        {filtered.length} volumi · tocca un volume per segnarlo come posseduto, la matita per dettagli e modifiche
      </p>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">Nessun volume corrisponde alla ricerca.</p>
      ) : settings.viewMode === 'griglia' ? (
        <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((v) => <VolumeCard key={v.id} volume={v} onEdit={onOpen} />)}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((v) => <VolumeRow key={v.id} volume={v} onEdit={onOpen} />)}
        </div>
      )}
    </div>
  )
}
