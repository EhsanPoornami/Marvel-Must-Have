import type { CatalogEdits, Collection, Settings } from '../types'

// Versioned keys: bump the suffix if the stored shape ever changes incompatibly.
const KEYS = {
  collection: 'mmh.collection.v1',
  catalogEdits: 'mmh.catalogEdits.v1',
  settings: 'mmh.settings.v1',
} as const

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error('Impossibile salvare in localStorage', err)
  }
}

export const emptyEdits = (): CatalogEdits => ({ overrides: {}, deleted: [] })
export const defaultSettings = (): Settings => ({ viewMode: 'griglia' })

export const loadCollection = () => read<Collection>(KEYS.collection, {})
export const saveCollection = (c: Collection) => write(KEYS.collection, c)

export const loadCatalogEdits = () => ({ ...emptyEdits(), ...read<Partial<CatalogEdits>>(KEYS.catalogEdits, {}) })
export const saveCatalogEdits = (e: CatalogEdits) => write(KEYS.catalogEdits, e)

export const loadSettings = () => ({ ...defaultSettings(), ...read<Partial<Settings>>(KEYS.settings, {}) })
export const saveSettings = (s: Settings) => write(KEYS.settings, s)
