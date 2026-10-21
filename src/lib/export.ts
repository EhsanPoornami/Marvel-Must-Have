import type { BackupFile, CatalogEdits, Collection, Volume } from '../types'
import { CONDITION_LABELS, STATUS_LABELS } from '../types'
import { formatDate, formatEuro, todayIso } from './format'
import { entryOf } from './stats'

export function downloadFile(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Clipboard API needs a secure context (localhost/https); fall back to execCommand on plain LAN http. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // fall through to the legacy path
  }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  const ok = document.execCommand('copy')
  ta.remove()
  return ok
}

// ---- JSON backup ----

export function buildBackup(collection: Collection, catalogEdits: CatalogEdits): BackupFile {
  return { app: 'marvel-must-have', version: 1, exportedAt: new Date().toISOString(), collection, catalogEdits }
}

export function parseBackup(text: string): BackupFile {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Il file non è un JSON valido.')
  }
  const b = data as Partial<BackupFile>
  if (b?.app !== 'marvel-must-have' || typeof b.collection !== 'object' || b.collection === null) {
    throw new Error('Il file non sembra un backup di questa app.')
  }
  return {
    app: 'marvel-must-have',
    version: 1,
    exportedAt: b.exportedAt ?? '',
    collection: b.collection,
    catalogEdits: { overrides: b.catalogEdits?.overrides ?? {}, deleted: b.catalogEdits?.deleted ?? [] },
  }
}

// ---- CSV (Excel, Italian locale: ";" separator, decimal comma, UTF-8 BOM) ----

const csvCell = (v: string | number | null | undefined): string => {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'number' ? String(v).replace('.', ',') : v
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function buildCsv(volumes: Volume[], collection: Collection): string {
  const header = [
    'Numero', 'Titolo', 'Trama', 'Personaggi', 'Sceneggiatura', 'Disegni', 'Data uscita', 'Prezzo copertina', 'ISBN',
    'Stato', 'Condizioni', 'Prezzo pagato', 'Data acquisto', 'Note personali', 'Note volume', 'Da verificare',
  ]
  const rows = volumes.map((v) => {
    const e = entryOf(collection, v.id)
    return [
      v.numero, v.titolo, v.trama, v.personaggi.join(', '), v.sceneggiatura.join(', '), v.disegni.join(', '), v.dataUscita,
      v.prezzo, v.isbn, STATUS_LABELS[e.stato], e.condizioni ? CONDITION_LABELS[e.condizioni] : '', e.prezzoPagato,
      e.dataAcquisto ? formatDate(e.dataAcquisto) : '', e.notePersonali, v.note, v.daVerificare ? 'sì' : '',
    ].map(csvCell).join(';')
  })
  return '﻿' + [header.join(';'), ...rows].join('\r\n')
}

// ---- Plain-text "missing" list for the comic shop ----

export function buildMissingText(volumes: Volume[], collection: Collection): string {
  const lines = volumes.map((v) => {
    const e = entryOf(collection, v.id)
    const mark = e.stato === 'wishlist' ? '★ ' : e.stato === 'ordinato' ? '(ordinato) ' : ''
    const num = v.numero !== null ? `#${v.numero}` : 's.n.'
    return `${mark}${num} – ${v.titolo}${v.prezzo !== null ? ` – ${formatEuro(v.prezzo)}` : ''}`
  })
  const total = volumes.reduce((sum, v) => sum + (v.prezzo ?? 0), 0)
  return [
    `Marvel Must-Have – Mi mancano (${volumes.length}) – ${formatDate(todayIso())}`,
    '',
    ...lines,
    '',
    `Totale stimato: ${formatEuro(total)}`,
    volumes.some((v) => entryOf(collection, v.id).stato === 'wishlist') ? '★ = priorità alta' : '',
  ].join('\n').trimEnd()
}
