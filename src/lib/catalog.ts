import type { CatalogEdits, Volume } from '../types'

/** Loads the base catalog shipped in public/data/volumi.json. */
export async function fetchBaseCatalog(): Promise<Volume[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/volumi.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('volumi.json deve contenere un array')
  return data.map(normalizeVolume)
}

/** Fills in missing fields so hand-edited JSON entries don't break the UI. */
export function normalizeVolume(raw: Partial<Volume>): Volume {
  return {
    id: String(raw.id ?? ''),
    numero: typeof raw.numero === 'number' ? raw.numero : null,
    titolo: raw.titolo ?? '',
    trama: raw.trama ?? '',
    personaggi: raw.personaggi ?? [],
    sceneggiatura: raw.sceneggiatura ?? [],
    disegni: raw.disegni ?? [],
    dataUscita: raw.dataUscita ?? '',
    prezzo: typeof raw.prezzo === 'number' ? raw.prezzo : null,
    isbn: raw.isbn ?? '',
    copertinaUrl: raw.copertinaUrl ?? '',
    ...(raw.personaggioUrl ? { personaggioUrl: raw.personaggioUrl } : {}),
    note: raw.note ?? '',
    daVerificare: raw.daVerificare,
    campiDaVerificare: raw.campiDaVerificare,
  }
}

/** Base catalog + the user's in-app additions, edits and deletions. */
export function mergeCatalog(base: Volume[], edits: CatalogEdits): Volume[] {
  const deleted = new Set(edits.deleted)
  const baseIds = new Set(base.map((v) => v.id))
  // Overrides saved before "trama" existed have no such field: keep the catalog's one.
  const merged = base.filter((v) => !deleted.has(v.id)).map((v) => {
    const o = edits.overrides[v.id]
    return o ? { ...o, trama: o.trama ?? v.trama } : v
  })
  const added = Object.values(edits.overrides).filter((v) => !baseIds.has(v.id)).map((v) => ({ ...v, trama: v.trama ?? '' }))
  return sortByNumber([...merged, ...added])
}

/** Numbered volumes first in ascending order, unnumbered ones last by title. */
export function sortByNumber(volumes: Volume[]): Volume[] {
  return [...volumes].sort((a, b) => {
    if (a.numero === null && b.numero === null) return a.titolo.localeCompare(b.titolo, 'it')
    if (a.numero === null) return 1
    if (b.numero === null) return -1
    return a.numero - b.numero
  })
}

export function newVolumeId(): string {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/** Lowercase, accent-free text used for searching. */
export function searchText(v: Volume): string {
  return fold([v.numero !== null ? `#${v.numero}` : '', v.titolo, ...v.personaggi, ...v.sceneggiatura, ...v.disegni, v.isbn].join(' '))
}

export function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
