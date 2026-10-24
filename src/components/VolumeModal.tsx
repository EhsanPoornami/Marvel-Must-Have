import { useEffect, useState, type ReactNode } from 'react'
import { newVolumeId } from '../lib/catalog'
import { formatEuro, formatReleaseDate, parseEuro, todayIso } from '../lib/format'
import { entryOf } from '../lib/stats'
import { useStore } from '../store'
import { CONDITION_LABELS, CONDITIONS, STATUS_LABELS, STATUSES, type Condition, type Status, type Volume } from '../types'
import { Cover } from './Cover'
import { portraitOf, type Portrait } from '../lib/characters'
import { STATUS_STYLES } from '../lib/statusStyles'

interface Props {
  /** null = create a new volume */
  volume: Volume | null
  onClose: () => void
}

const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

const BURSTS = ['POW!', 'BAM!', 'PRESO!', 'WHAM!', 'KRAK!', 'ZAP!']

/** Comic-panel portrait of the volume's main character; hides itself if the image fails. */
function CharacterPanel({ portrait, className = '' }: { portrait: Portrait; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null)
  if (failed === portrait.url) return null
  return (
    <figure className={`mmh-hero ${className}`} onClick={(e) => e.stopPropagation()}>
      <img
        key={portrait.url}
        src={portrait.url}
        alt={portrait.name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(portrait.url)}
        className="h-full w-full object-cover object-top"
      />
      <figcaption className="mmh-hero-name">{portrait.name}</figcaption>
    </figure>
  )
}

/** Five clickable stars; clicking the current rating again clears it. */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Voto" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} stell${n === 1 ? 'a' : 'e'}`}
          title={value === n ? 'Togli il voto' : `${n}/5`}
          onClick={() => onChange(value === n ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          className={`mmh-star cursor-pointer text-3xl leading-none ${n <= shown ? 'text-caption' : 'text-neutral-600'}`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-sm text-neutral-400">{value ? `${value}/5` : 'Nessun voto'}</span>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function VolumeModal({ volume, onClose }: Props) {
  const { collection, volumes, baseIds, setEntry, saveVolume, deleteVolume, showToast } = useStore()
  const isNew = volume === null
  const entry = volume ? entryOf(collection, volume.id) : { stato: 'mancante' as Status }

  // Collection fields
  const [stato, setStato] = useState<Status>(entry.stato)
  const [condizioni, setCondizioni] = useState<Condition | ''>(entry.condizioni ?? '')
  const [prezzoPagato, setPrezzoPagato] = useState(entry.prezzoPagato?.toString().replace('.', ',') ?? '')
  const [dataAcquisto, setDataAcquisto] = useState(entry.dataAcquisto ?? '')
  const [notePersonali, setNotePersonali] = useState(entry.notePersonali ?? '')
  const [voto, setVoto] = useState(entry.voto ?? 0)

  // Catalog fields
  const [editingCatalog, setEditingCatalog] = useState(isNew)
  const [numero, setNumero] = useState(volume?.numero?.toString() ?? '')
  const [titolo, setTitolo] = useState(volume?.titolo ?? '')
  const [trama, setTrama] = useState(volume?.trama ?? '')
  const [personaggi, setPersonaggi] = useState(volume?.personaggi.join(', ') ?? '')
  const [sceneggiatura, setSceneggiatura] = useState(volume?.sceneggiatura.join(', ') ?? '')
  const [disegni, setDisegni] = useState(volume?.disegni.join(', ') ?? '')
  const [dataUscita, setDataUscita] = useState(volume?.dataUscita ?? '')
  const [prezzo, setPrezzo] = useState(volume?.prezzo?.toString().replace('.', ',') ?? '')
  const [isbn, setIsbn] = useState(volume?.isbn ?? '')
  const [copertinaUrl, setCopertinaUrl] = useState(volume?.copertinaUrl ?? '')
  const [personaggioUrl, setPersonaggioUrl] = useState(volume?.personaggioUrl ?? '')
  const [note, setNote] = useState(volume?.note ?? '')
  const [daVerificare, setDaVerificare] = useState(volume?.daVerificare ?? false)
  const [error, setError] = useState('')
  // Comic sound effect shown for a moment when the volume is marked as owned.
  const [burst, setBurst] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const numeroValue = numero.trim() === '' ? null : Number(numero)
  const duplicate = numeroValue !== null && volumes.find((v) => v.numero === numeroValue && v.id !== volume?.id)

  function handleSave() {
    if (!titolo.trim()) return setError('Il titolo è obbligatorio.')
    if (numeroValue !== null && (!Number.isInteger(numeroValue) || numeroValue < 0)) return setError('Il numero deve essere un intero.')
    if (dataUscita && !/^\d{4}-\d{2}(-\d{2})?$/.test(dataUscita)) return setError('Data di uscita: usa il formato AAAA-MM o AAAA-MM-GG.')

    const id = volume?.id ?? newVolumeId()
    if (editingCatalog) {
      const updated: Volume = {
        id,
        numero: numeroValue,
        titolo: titolo.trim(),
        trama: trama.trim(),
        personaggi: splitList(personaggi),
        sceneggiatura: splitList(sceneggiatura),
        disegni: splitList(disegni),
        dataUscita: dataUscita.trim(),
        prezzo: parseEuro(prezzo) ?? null,
        isbn: isbn.trim(),
        copertinaUrl: copertinaUrl.trim(),
        ...(personaggioUrl.trim() ? { personaggioUrl: personaggioUrl.trim() } : {}),
        note: note.trim(),
        ...(daVerificare ? { daVerificare: true, campiDaVerificare: volume?.campiDaVerificare } : {}),
      }
      saveVolume(updated)
    }
    setEntry(id, {
      stato,
      condizioni: condizioni || undefined,
      prezzoPagato: parseEuro(prezzoPagato),
      dataAcquisto: dataAcquisto || undefined,
      notePersonali: notePersonali.trim() || undefined,
      voto: voto || undefined,
    })
    showToast(isNew ? 'Volume aggiunto' : 'Modifiche salvate')
    onClose()
  }

  function handleDelete() {
    if (!volume) return
    const msg = baseIds.has(volume.id)
      ? `Eliminare "${volume.titolo}" dal catalogo? Verranno cancellati anche i tuoi dati su questo volume.\n\n(Il volume resta in volumi.json: potrai ripristinarlo azzerando le modifiche al catalogo dalla pagina Backup.)`
      : `Eliminare "${volume.titolo}"? Verranno cancellati anche i tuoi dati su questo volume.`
    if (!confirm(msg)) return
    deleteVolume(volume.id)
    showToast('Volume eliminato')
    onClose()
  }

  const preview: Volume = { ...(volume ?? ({} as Volume)), numero: numeroValue, titolo, copertinaUrl, personaggi: [], sceneggiatura: [], disegni: [] }
  const portrait = portraitOf({
    ...preview,
    personaggi: editingCatalog ? splitList(personaggi) : volume?.personaggi ?? [],
    personaggioUrl: editingCatalog ? personaggioUrl.trim() : volume?.personaggioUrl,
  })

  return (
    <div className="mmh-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/75 sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex w-full max-w-2xl items-center justify-center gap-6 md:max-w-[62rem]">
      {portrait && <CharacterPanel portrait={portrait} className="hidden md:block" />}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? 'Nuovo volume' : volume.titolo}
        className="mmh-dialog flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-panel ring-1 ring-line sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mmh-halftone relative flex items-start gap-3 border-b-2 border-marvel p-4">
          <div className="relative shrink-0">
            <Cover volume={preview} className="mmh-tilt w-16 rounded" />
            {burst && (
              <span className="mmh-burst" aria-hidden="true" onAnimationEnd={() => setBurst(null)}>{burst}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm text-marvel">{isNew ? 'Nuovo volume' : volume.numero !== null ? `Marvel Must-Have #${volume.numero}` : 'Marvel Must-Have (senza numero)'}</p>
            <h2 className="text-lg leading-tight font-bold">{titolo || 'Senza titolo'}</h2>
            {!isNew && (
              <p className="mt-1 text-xs text-neutral-400">
                {volume.sceneggiatura.length > 0 && <>Testi: {volume.sceneggiatura.join(', ')}<br /></>}
                {volume.disegni.length > 0 && <>Disegni: {volume.disegni.join(', ')}<br /></>}
                Prezzo di copertina: {formatEuro(volume.prezzo)}
              </p>
            )}
          </div>
          {portrait && <CharacterPanel portrait={portrait} className="mmh-hero-mini md:hidden" />}
          <button type="button" onClick={onClose} className="cursor-pointer rounded-full p-1 text-2xl leading-none text-neutral-400 hover:text-white" aria-label="Chiudi">×</button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {!isNew && !editingCatalog && volume.trama && (
            <section className="mmh-caption">
              <h3 className="mmh-caption-title">La storia</h3>
              <p className="text-sm leading-relaxed">{volume.trama}</p>
            </section>
          )}

          <section className="space-y-3">
            <h3 className="font-display text-sm tracking-wide text-neutral-300 uppercase">La mia copia</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    if (s === 'posseduto' && stato !== 'posseduto') setBurst(BURSTS[Math.floor(Math.random() * BURSTS.length)])
                    setStato(s)
                    if (s === 'posseduto' && !dataAcquisto) setDataAcquisto(todayIso())
                  }}
                  className={`cursor-pointer rounded-md px-2 py-2 text-sm font-semibold ring-1 ring-inset ${stato === s ? STATUS_STYLES[s] + ' ring-2' : 'bg-panel-2 text-neutral-400 ring-line'}`}
                >
                  {s === 'wishlist' ? '★ Wishlist' : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <div>
              <span className="label">Il mio voto</span>
              <StarRating value={voto} onChange={setVoto} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Condizioni">
                <select className="field" value={condizioni} onChange={(e) => setCondizioni(e.target.value as Condition | '')}>
                  <option value="">—</option>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{CONDITION_LABELS[c]}</option>)}
                </select>
              </Field>
              <Field label="Prezzo pagato (€)">
                <input className="field" inputMode="decimal" value={prezzoPagato} onChange={(e) => setPrezzoPagato(e.target.value)} placeholder={volume?.prezzo?.toString().replace('.', ',') ?? ''} />
              </Field>
              <Field label="Data acquisto" className="col-span-2 sm:col-span-1">
                <input className="field" type="date" value={dataAcquisto} onChange={(e) => setDataAcquisto(e.target.value)} />
              </Field>
            </div>
            <Field label="Note personali">
              <textarea className="field" rows={2} value={notePersonali} onChange={(e) => setNotePersonali(e.target.value)} />
            </Field>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm tracking-wide text-neutral-300 uppercase">Dati del volume</h3>
              {!editingCatalog && (
                <button type="button" className="btn-ghost text-xs" onClick={() => setEditingCatalog(true)}>Modifica dati</button>
              )}
            </div>

            {!editingCatalog && volume ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-neutral-500">Personaggi</dt><dd>{volume.personaggi.join(', ') || '—'}</dd>
                <dt className="text-neutral-500">Uscita</dt><dd>{formatReleaseDate(volume.dataUscita)}</dd>
                <dt className="text-neutral-500">ISBN</dt><dd>{volume.isbn || '—'}</dd>
                {volume.note && <><dt className="text-neutral-500">Note</dt><dd>{volume.note}</dd></>}
                {volume.daVerificare && (
                  <><dt className="text-amber-300">Da verificare</dt><dd className="text-amber-200">{volume.campiDaVerificare?.join(', ') || 'sì'}</dd></>
                )}
              </dl>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Numero">
                  <input className="field" inputMode="numeric" value={numero} onChange={(e) => setNumero(e.target.value)} />
                </Field>
                <Field label="Titolo *" className="col-span-2 sm:col-span-3">
                  <input className="field" value={titolo} onChange={(e) => setTitolo(e.target.value)} />
                </Field>
                {duplicate && (
                  <p className="col-span-full -mt-1 text-xs text-amber-300">Attenzione: il numero {numeroValue} è già usato da "{duplicate.titolo}".</p>
                )}
                <Field label="Trama (introduzione alla storia)" className="col-span-full">
                  <textarea className="field" rows={4} value={trama} onChange={(e) => setTrama(e.target.value)} />
                </Field>
                <Field label="Personaggi (separati da virgola)" className="col-span-full">
                  <input className="field" value={personaggi} onChange={(e) => setPersonaggi(e.target.value)} />
                </Field>
                <Field label="Sceneggiatura" className="col-span-2">
                  <input className="field" value={sceneggiatura} onChange={(e) => setSceneggiatura(e.target.value)} />
                </Field>
                <Field label="Disegni" className="col-span-2">
                  <input className="field" value={disegni} onChange={(e) => setDisegni(e.target.value)} />
                </Field>
                <Field label="Uscita (AAAA-MM)">
                  <input className="field" value={dataUscita} onChange={(e) => setDataUscita(e.target.value)} placeholder="2026-11" />
                </Field>
                <Field label="Prezzo (€)">
                  <input className="field" inputMode="decimal" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} />
                </Field>
                <Field label="ISBN" className="col-span-2">
                  <input className="field" value={isbn} onChange={(e) => setIsbn(e.target.value)} />
                </Field>
                <Field label="URL copertina" className="col-span-full">
                  <input className="field" type="url" value={copertinaUrl} onChange={(e) => setCopertinaUrl(e.target.value)} placeholder="https://…" />
                </Field>
                <Field label="URL immagine personaggio (vuoto = automatica)" className="col-span-full">
                  <input className="field" type="url" value={personaggioUrl} onChange={(e) => setPersonaggioUrl(e.target.value)} placeholder="https://…" />
                </Field>
                <Field label="Note sul volume" className="col-span-full">
                  <textarea className="field" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
                <label className="col-span-full flex items-center gap-2 text-sm text-neutral-300">
                  <input type="checkbox" checked={daVerificare} onChange={(e) => setDaVerificare(e.target.checked)} className="h-4 w-4 accent-marvel" />
                  Dati da verificare
                </label>
              </div>
            )}
          </section>
          {error && <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
        </div>

        <footer className="flex items-center gap-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!isNew && <button type="button" className="btn-danger" onClick={handleDelete}>Elimina</button>}
          <div className="flex-1" />
          <button type="button" className="btn-ghost" onClick={onClose}>Annulla</button>
          <button type="button" className="btn-primary" onClick={handleSave}>Salva</button>
        </footer>
      </div>
      </div>
    </div>
  )
}
