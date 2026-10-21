import {
  arrayRemove, arrayUnion, deleteField, doc, FieldPath, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc,
  type DocumentReference,
} from 'firebase/firestore'
import type { CatalogEdits, Collection, CollectionEntry, Volume } from '../types'
import { db } from './firebase'

/**
 * One document per user: users/{uid} = { collection, catalogEdits, updatedAt }.
 * Single-volume changes update only that volume's field, so edits made on two devices
 * to different volumes never overwrite each other.
 */
export interface CloudData {
  collection: Collection
  catalogEdits: CatalogEdits
}

export interface SyncState {
  /** Local writes not yet confirmed by the server (e.g. while offline). */
  pending: boolean
  /** Data currently served from the offline cache. */
  fromCache: boolean
}

const userDoc = (uid: string): DocumentReference => doc(db!, 'users', uid)
const touch = () => ({ updatedAt: serverTimestamp() })

function parse(data: Record<string, unknown> | undefined): CloudData {
  const edits = (data?.catalogEdits ?? {}) as Partial<CatalogEdits>
  return {
    collection: (data?.collection ?? {}) as Collection,
    catalogEdits: { overrides: edits.overrides ?? {}, deleted: edits.deleted ?? [] },
  }
}

export async function loadCloud(uid: string): Promise<{ exists: boolean; data: CloudData }> {
  const snap = await getDoc(userDoc(uid))
  return { exists: snap.exists(), data: parse(snap.data()) }
}

export function watchCloud(uid: string, onData: (d: CloudData, s: SyncState) => void, onError: (e: Error) => void) {
  return onSnapshot(
    userDoc(uid),
    { includeMetadataChanges: true },
    (snap) => onData(parse(snap.data()), { pending: snap.metadata.hasPendingWrites, fromCache: snap.metadata.fromCache }),
    onError,
  )
}

export const cloudReplaceAll = (uid: string, data: CloudData) => setDoc(userDoc(uid), { ...data, ...touch() })

export const cloudSetEntry = (uid: string, id: string, entry: CollectionEntry | null) =>
  updateDoc(userDoc(uid), new FieldPath('collection', id), entry ?? deleteField(), 'updatedAt', serverTimestamp())

export const cloudSaveVolume = (uid: string, volume: Volume) =>
  updateDoc(
    userDoc(uid),
    new FieldPath('catalogEdits', 'overrides', volume.id), volume,
    new FieldPath('catalogEdits', 'deleted'), arrayRemove(volume.id),
    'updatedAt', serverTimestamp(),
  )

export const cloudDeleteVolume = (uid: string, id: string, isBase: boolean) =>
  updateDoc(
    userDoc(uid),
    new FieldPath('catalogEdits', 'overrides', id), deleteField(),
    new FieldPath('catalogEdits', 'deleted'), isBase ? arrayUnion(id) : arrayRemove(id),
    new FieldPath('collection', id), deleteField(),
    'updatedAt', serverTimestamp(),
  )

export const cloudResetCatalogEdits = (uid: string) =>
  updateDoc(userDoc(uid), 'catalogEdits', { overrides: {}, deleted: [] }, 'updatedAt', serverTimestamp())

/** Adds local data the cloud doesn't have yet; on conflicts the cloud copy wins. */
export function mergeIntoCloud(cloud: CloudData, local: CloudData): CloudData {
  return {
    collection: { ...local.collection, ...cloud.collection },
    catalogEdits: {
      overrides: { ...local.catalogEdits.overrides, ...cloud.catalogEdits.overrides },
      deleted: [...new Set([...cloud.catalogEdits.deleted, ...local.catalogEdits.deleted])],
    },
  }
}

export const hasData = (d: CloudData) =>
  Object.keys(d.collection).length > 0 || Object.keys(d.catalogEdits.overrides).length > 0 || d.catalogEdits.deleted.length > 0
