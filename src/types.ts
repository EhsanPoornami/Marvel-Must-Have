/** A volume of the series, as stored in public/data/volumi.json. */
export interface Volume {
  /** Stable key linking the collection to the catalog. Never change it once used. */
  id: string
  numero: number | null
  titolo: string
  /** Short spoiler-light introduction to the story. */
  trama: string
  personaggi: string[]
  sceneggiatura: string[]
  disegni: string[]
  /** "YYYY-MM" or "YYYY-MM-DD"; empty when unknown. */
  dataUscita: string
  /** Cover price in euro. */
  prezzo: number | null
  isbn: string
  copertinaUrl: string
  /** Optional portrait of the main character; when empty one is looked up from the characters list. */
  personaggioUrl?: string
  note: string
  daVerificare?: boolean
  /** Which fields still need checking (informational). */
  campiDaVerificare?: string[]
}

export type Status = 'posseduto' | 'mancante' | 'ordinato' | 'wishlist'
export type Condition = 'nuovo' | 'ottimo' | 'buono' | 'discreto'

/** The user's own data about a volume, stored separately from the catalog. */
export interface CollectionEntry {
  stato: Status
  condizioni?: Condition
  prezzoPagato?: number
  /** "YYYY-MM-DD" */
  dataAcquisto?: string
  notePersonali?: string
  /** Personal rating, 1–5 stars. */
  voto?: number
}

/** Collection entries keyed by volume id. Volumes without an entry count as "mancante". */
export type Collection = Record<string, CollectionEntry>

/** Changes made to the catalog from inside the app. */
export interface CatalogEdits {
  /** Added or modified volumes, keyed by id; they override the base catalog. */
  overrides: Record<string, Volume>
  /** Ids of base-catalog volumes deleted by the user. */
  deleted: string[]
}

export type ViewMode = 'griglia' | 'elenco'

export interface Settings {
  viewMode: ViewMode
}

export interface BackupFile {
  app: 'marvel-must-have'
  version: 1
  exportedAt: string
  collection: Collection
  catalogEdits: CatalogEdits
}

export const STATUS_LABELS: Record<Status, string> = {
  posseduto: 'Posseduto',
  mancante: 'Mancante',
  ordinato: 'Ordinato',
  wishlist: 'Wishlist',
}

export const STATUSES: Status[] = ['posseduto', 'mancante', 'ordinato', 'wishlist']

export const CONDITION_LABELS: Record<Condition, string> = {
  nuovo: 'Nuovo',
  ottimo: 'Ottimo',
  buono: 'Buono',
  discreto: 'Discreto',
}

export const CONDITIONS: Condition[] = ['nuovo', 'ottimo', 'buono', 'discreto']
