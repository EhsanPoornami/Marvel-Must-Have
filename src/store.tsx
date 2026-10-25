import { onAuthStateChanged, type User } from 'firebase/auth'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { fetchBaseCatalog, mergeCatalog } from './lib/catalog'
import {
  cloudDeleteVolume, cloudReplaceAll, cloudResetCatalogEdits, cloudSaveVolume, cloudSetEntry, hasData, loadCloud,
  mergeIntoCloud, watchCloud, type CloudData, type SyncState,
} from './lib/cloud'
import { auth, firebaseEnabled } from './lib/firebase'
import { todayIso } from './lib/format'
import { entryOf } from './lib/stats'
import {
  defaultSettings, emptyEdits, loadCatalogEdits, loadCollection, loadSettings,
  saveCatalogEdits, saveCollection, saveSettings,
} from './lib/storage'
import type { BackupFile, CatalogEdits, Collection, CollectionEntry, Settings, Volume } from './types'

export interface Toast {
  id: number
  message: string
  undo?: () => void
}

interface Store {
  status: 'loading' | 'ready' | 'error'
  loadError: string
  volumes: Volume[]
  baseIds: Set<string>
  collection: Collection
  catalogEdits: CatalogEdits
  settings: Settings
  toast: Toast | null
  /** Signed-in user, or null in local-only (guest) mode. */
  user: User | null
  sync: SyncState | null
  showToast: (message: string, undo?: () => void) => void
  dismissToast: () => void
  setEntry: (id: string, entry: CollectionEntry | null) => void
  togglePossessed: (volume: Volume) => void
  saveVolume: (volume: Volume) => void
  deleteVolume: (id: string) => void
  importBackup: (backup: BackupFile) => void
  resetAll: () => void
  resetCatalogEdits: () => void
  updateSettings: (patch: Partial<Settings>) => void
}

const StoreContext = createContext<Store | null>(null)

/** A plain "mancante" with no details is the default state: it isn't stored. */
const isEmptyEntry = (e: CollectionEntry) =>
  e.stato === 'mancante' && !e.condizioni && e.prezzoPagato === undefined && !e.dataAcquisto && !e.notePersonali && !e.voto

const migratedKey = (uid: string) => `mmh.migrated.${uid}`

/**
 * On the first sign-in from a device, offers to move the data stored locally (guest mode)
 * into the account; makes sure the user's cloud document exists.
 */
async function prepareCloud(uid: string, local: CloudData): Promise<void> {
  const { exists, data: cloud } = await loadCloud(uid)
  let alreadyAsked = false
  try { alreadyAsked = localStorage.getItem(migratedKey(uid)) === '1' } catch { /* ignore */ }

  if (!alreadyAsked && hasData(local)) {
    const n = Object.keys(local.collection).length
    if (!hasData(cloud)) {
      if (confirm(`Su questo dispositivo ci sono dati salvati senza account (${n} volumi). Vuoi caricarli nel tuo account?`)) {
        await cloudReplaceAll(uid, local)
      } else if (!exists) {
        await cloudReplaceAll(uid, { collection: {}, catalogEdits: emptyEdits() })
      }
    } else if (confirm(`Il tuo account ha già una collezione. Vuoi aggiungerci i dati salvati su questo dispositivo (${n} volumi)?\n\nPer i volumi presenti in entrambi resta la versione dell'account.`)) {
      await cloudReplaceAll(uid, mergeIntoCloud(cloud, local))
    }
  } else if (!exists) {
    await cloudReplaceAll(uid, { collection: {}, catalogEdits: emptyEdits() })
  }
  try { localStorage.setItem(migratedKey(uid), '1') } catch { /* ignore */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [catalogStatus, setCatalogStatus] = useState<Store['status']>('loading')
  const [loadError, setLoadError] = useState('')
  const [base, setBase] = useState<Volume[]>([])
  // Guest-mode data, kept in localStorage.
  const [localCollection, setLocalCollection] = useState<Collection>(loadCollection)
  const [localEdits, setLocalEdits] = useState<CatalogEdits>(loadCatalogEdits)
  // Signed-in data, mirrored from Firestore.
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(!firebaseEnabled)
  const [cloud, setCloud] = useState<CloudData | null>(null)
  const [sync, setSync] = useState<SyncState | null>(null)
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = useCallback((message: string, undo?: () => void) => {
    setToast({ id: Date.now(), message, undo })
  }, [])

  useEffect(() => {
    fetchBaseCatalog()
      .then((v) => { setBase(v); setCatalogStatus('ready') })
      .catch((err: unknown) => { setLoadError(String(err)); setCatalogStatus('error') })
  }, [])

  useEffect(() => saveCollection(localCollection), [localCollection])
  useEffect(() => saveCatalogEdits(localEdits), [localEdits])
  useEffect(() => saveSettings(settings), [settings])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  // Auth state + live subscription to the user's cloud document.
  useEffect(() => {
    if (!auth) return
    let unwatch: (() => void) | null = null
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      unwatch?.()
      unwatch = null
      setCloud(null)
      setSync(null)
      setUser(u)
      if (!u) { setAuthReady(true); return }
      try {
        await prepareCloud(u.uid, { collection: loadCollection(), catalogEdits: loadCatalogEdits() })
      } catch (err) {
        console.error(err)
        showToast('Impossibile preparare i dati online: controlla la connessione.')
      }
      unwatch = watchCloud(
        u.uid,
        (data, state) => { setCloud(data); setSync(state); setAuthReady(true) },
        (err) => {
          console.error(err)
          showToast(`Errore di sincronizzazione: ${err.message}`)
          setCloud((c) => c ?? { collection: {}, catalogEdits: emptyEdits() })
          setAuthReady(true)
        },
      )
    })
    return () => { unwatch?.(); unsubscribe() }
  }, [showToast])

  const collection = useMemo(() => (user ? (cloud?.collection ?? {}) : localCollection), [user, cloud, localCollection])
  const catalogEdits = useMemo(() => (user ? (cloud?.catalogEdits ?? emptyEdits()) : localEdits), [user, cloud, localEdits])
  const volumes = useMemo(() => mergeCatalog(base, catalogEdits), [base, catalogEdits])
  const baseIds = useMemo(() => new Set(base.map((v) => v.id)), [base])
  // Wait for the first cloud snapshot, so a signed-in user never sees an empty collection flash by.
  const waiting = !authReady || (user !== null && cloud === null)
  const status: Store['status'] = catalogStatus === 'ready' && waiting ? 'loading' : catalogStatus

  const uid = user?.uid
  const reportCloudError = useCallback((err: unknown) => {
    console.error(err)
    showToast(`Salvataggio online non riuscito: ${err instanceof Error ? err.message : String(err)}`)
  }, [showToast])

  const setEntry = useCallback((id: string, entry: CollectionEntry | null) => {
    const value = entry && !isEmptyEntry(entry) ? entry : null
    if (uid) {
      cloudSetEntry(uid, id, value).catch(reportCloudError)
      return
    }
    setLocalCollection((c) => {
      const next = { ...c }
      if (value) next[id] = value
      else delete next[id]
      return next
    })
  }, [uid, reportCloudError])

  const togglePossessed = useCallback((volume: Volume) => {
    const prev = collection[volume.id] ?? null
    const current = entryOf(collection, volume.id)
    const label = volume.numero !== null ? `#${volume.numero}` : volume.titolo
    if (current.stato === 'posseduto') {
      setEntry(volume.id, { ...current, stato: 'mancante' })
      showToast(`${label} segnato come mancante`, () => setEntry(volume.id, prev))
    } else {
      setEntry(volume.id, { ...current, stato: 'posseduto', dataAcquisto: current.dataAcquisto ?? todayIso() })
      showToast(`${label} aggiunto alla collezione`, () => setEntry(volume.id, prev))
    }
  }, [collection, setEntry, showToast])

  const saveVolume = useCallback((volume: Volume) => {
    if (uid) {
      cloudSaveVolume(uid, volume).catch(reportCloudError)
      return
    }
    setLocalEdits((e) => ({
      overrides: { ...e.overrides, [volume.id]: volume },
      deleted: e.deleted.filter((id) => id !== volume.id),
    }))
  }, [uid, reportCloudError])

  const deleteVolume = useCallback((id: string) => {
    if (uid) {
      cloudDeleteVolume(uid, id, baseIds.has(id)).catch(reportCloudError)
      return
    }
    setLocalEdits((e) => {
      const overrides = { ...e.overrides }
      delete overrides[id]
      return { overrides, deleted: baseIds.has(id) ? [...new Set([...e.deleted, id])] : e.deleted }
    })
    setEntry(id, null)
  }, [uid, baseIds, setEntry, reportCloudError])

  const replaceAll = useCallback((data: CloudData) => {
    if (uid) {
      cloudReplaceAll(uid, data).catch(reportCloudError)
      return
    }
    setLocalCollection(data.collection)
    setLocalEdits(data.catalogEdits)
  }, [uid, reportCloudError])

  const importBackup = useCallback((backup: BackupFile) => {
    replaceAll({ collection: backup.collection, catalogEdits: backup.catalogEdits })
  }, [replaceAll])

  const resetAll = useCallback(() => {
    replaceAll({ collection: {}, catalogEdits: emptyEdits() })
    setSettings(defaultSettings())
  }, [replaceAll])

  const resetCatalogEdits = useCallback(() => {
    if (uid) cloudResetCatalogEdits(uid).catch(reportCloudError)
    else setLocalEdits(emptyEdits())
  }, [uid, reportCloudError])

  const updateSettings = useCallback((patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })), [])

  const value: Store = {
    status, loadError, volumes, baseIds, collection, catalogEdits, settings, toast, user, sync,
    showToast, dismissToast: () => setToast(null), setEntry, togglePossessed, saveVolume, deleteVolume,
    importBackup, resetAll, resetCatalogEdits, updateSettings,
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- the hook belongs with its provider
export function useStore(): Store {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
