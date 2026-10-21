import { useRef, type ReactNode } from 'react'
import { buildBackup, buildCsv, downloadFile, parseBackup } from '../lib/export'
import { firebaseEnabled } from '../lib/firebase'
import { formatDate, todayIso } from '../lib/format'
import { useStore } from '../store'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl bg-panel p-4 ring-1 ring-line">
      <h2 className="font-display text-sm tracking-wide uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function BackupPage() {
  const { volumes, collection, catalogEdits, importBackup, resetAll, resetCatalogEdits, showToast, user } = useStore()
  const fileInput = useRef<HTMLInputElement>(null)
  const entries = Object.keys(collection).length
  const editedCount = Object.keys(catalogEdits.overrides).length + catalogEdits.deleted.length

  async function handleImport(file: File) {
    try {
      const backup = parseBackup(await file.text())
      const n = Object.keys(backup.collection).length
      const when = backup.exportedAt ? ` del ${formatDate(backup.exportedAt.slice(0, 10))}` : ''
      if (!confirm(`Importare il backup${when} (${n} volumi con dati)?\n\nI dati attuali della collezione e le modifiche al catalogo verranno sostituiti.`)) return
      importBackup(backup)
      showToast('Backup importato')
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="font-display text-xl uppercase">Backup e dati</h1>

      <Card title="Backup completo (JSON)">
        <p className="text-sm text-neutral-400">
          Salva la tua collezione ({entries} volumi con dati) e le modifiche fatte al catalogo ({editedCount}). Usalo per non perdere
          nulla o per spostare i dati su un altro browser o sul telefono.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => downloadFile(`marvel-must-have-backup-${todayIso()}.json`, JSON.stringify(buildBackup(collection, catalogEdits), null, 2), 'application/json')}
          >
            Esporta backup
          </button>
          <button type="button" className="btn-ghost" onClick={() => fileInput.current?.click()}>Importa backup…</button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleImport(f)
              e.target.value = ''
            }}
          />
        </div>
      </Card>

      <Card title="Esporta per Excel (CSV)">
        <p className="text-sm text-neutral-400">Un foglio con tutti i {volumes.length} volumi, il loro stato e i tuoi dati. Si apre con doppio clic in Excel.</p>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => downloadFile(`marvel-must-have-${todayIso()}.csv`, buildCsv(volumes, collection), 'text/csv;charset=utf-8')}
        >
          Esporta CSV
        </button>
      </Card>

      <Card title="Dove sono salvati i dati">
        {user ? (
          <p className="text-sm text-neutral-400">
            Sei collegato come <span className="text-neutral-200">{user.email ?? user.displayName}</span>: la collezione e le modifiche al catalogo
            sono salvate nel tuo account e sincronizzate su tutti i dispositivi in cui accedi. Il backup resta utile come copia di sicurezza.
          </p>
        ) : (
          <p className="text-sm text-neutral-400">
            Il catalogo base viene letto da <code className="text-neutral-200">public/data/volumi.json</code>. I tuoi dati (stati, acquisti, note) e i
            volumi aggiunti o modificati dall'app sono salvati in questo browser, separatamente: aggiornare il file del catalogo non cancella la
            collezione. {firebaseEnabled
              ? <>Per ritrovarli su altri dispositivi <a href="#/account" className="text-marvel hover:underline">accedi al tuo account</a>.</>
              : 'Ogni dispositivo ha i suoi dati: per spostarli usa Esporta/Importa backup.'}
          </p>
        )}
      </Card>

      <Card title="Zona pericolosa">
        <p className="text-sm text-neutral-400">
          I volumi modificati dall'app hanno la precedenza su volumi.json. “Ripristina catalogo” annulla le tue aggiunte, modifiche ed
          eliminazioni di volumi (non tocca stati e acquisti).
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-danger"
            disabled={editedCount === 0}
            onClick={() => {
              if (confirm(`Annullare le ${editedCount} modifiche al catalogo fatte dall'app e tornare a volumi.json?`)) {
                resetCatalogEdits()
                showToast('Catalogo ripristinato')
              }
            }}
          >
            Ripristina catalogo
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (confirm('Cancellare TUTTI i dati della collezione e le modifiche al catalogo? Esporta prima un backup se vuoi conservarli.')) {
                resetAll()
                showToast('Dati azzerati')
              }
            }}
          >
            Azzera tutto
          </button>
        </div>
      </Card>
    </div>
  )
}
