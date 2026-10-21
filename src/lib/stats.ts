import type { Collection, CollectionEntry, Status, Volume } from '../types'

export const entryOf = (c: Collection, id: string): CollectionEntry => c[id] ?? { stato: 'mancante' }

export interface Stats {
  total: number
  byStatus: Record<Status, number>
  owned: number
  notOwned: number
  completion: number
  spent: number
  ownedWithoutPricePaid: number
  costToComplete: number
  notOwnedWithoutPrice: number
}

export function computeStats(volumes: Volume[], collection: Collection): Stats {
  const byStatus: Record<Status, number> = { posseduto: 0, mancante: 0, ordinato: 0, wishlist: 0 }
  let spent = 0
  let ownedWithoutPricePaid = 0
  let costToComplete = 0
  let notOwnedWithoutPrice = 0

  for (const v of volumes) {
    const e = entryOf(collection, v.id)
    byStatus[e.stato]++
    if (e.stato === 'posseduto') {
      if (e.prezzoPagato !== undefined) spent += e.prezzoPagato
      else ownedWithoutPricePaid++
    } else if (v.prezzo !== null) {
      costToComplete += v.prezzo
    } else {
      notOwnedWithoutPrice++
    }
  }

  const total = volumes.length
  const owned = byStatus.posseduto
  return {
    total,
    byStatus,
    owned,
    notOwned: total - owned,
    completion: total ? owned / total : 0,
    spent,
    ownedWithoutPricePaid,
    costToComplete,
    notOwnedWithoutPrice,
  }
}

/** Lower value = higher priority in the "Mi mancano" list. */
export const PRIORITY: Record<Status, number> = { wishlist: 0, mancante: 1, ordinato: 2, posseduto: 3 }
