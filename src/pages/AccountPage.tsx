import { useState, type FormEvent } from 'react'
import { authErrorMessage, resetPassword, signInWithEmail, signInWithGoogle, signOut, signUpWithEmail } from '../lib/authActions'
import { firebaseEnabled } from '../lib/firebase'
import { useStore } from '../store'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function SyncBadge() {
  const { sync } = useStore()
  if (!sync) return null
  const [dot, text] = sync.pending
    ? ['bg-amber-400', 'Modifiche in attesa di connessione: verranno inviate appena torni online']
    : sync.fromCache
      ? ['bg-amber-400', 'Offline: stai vedendo i dati salvati su questo dispositivo']
      : ['bg-emerald-400', 'Sincronizzato']
  return (
    <p className="flex items-center gap-2 text-sm text-neutral-300">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      {text}
    </p>
  )
}

export function AccountPage() {
  const { user, showToast } = useStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(action: () => Promise<unknown>, success?: string) {
    setBusy(true)
    setError('')
    try {
      await action()
      if (success) showToast(success)
    } catch (err) {
      setError(authErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void run(() => (mode === 'login' ? signInWithEmail(email, password) : signUpWithEmail(email, password)), mode === 'login' ? 'Accesso effettuato' : 'Account creato')
  }

  if (!firebaseEnabled) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-xl bg-panel p-5 ring-1 ring-line">
        <h1 className="font-display text-xl uppercase">Account</h1>
        <p className="text-sm text-neutral-400">
          La sincronizzazione online non è ancora configurata: i dati restano salvati solo su questo dispositivo. Per attivarla segui la
          sezione “Account e sincronizzazione” del README.
        </p>
      </div>
    )
  }

  if (user) {
    const name = user.displayName || user.email || 'Utente'
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-display text-xl uppercase">Account</h1>
        <section className="space-y-4 rounded-xl bg-panel p-5 ring-1 ring-line">
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-12 w-12 rounded-full" />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-full bg-marvel font-display text-xl">{name[0].toUpperCase()}</span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{name}</p>
              {user.email && user.displayName && <p className="truncate text-sm text-neutral-400">{user.email}</p>}
            </div>
          </div>
          <SyncBadge />
          <p className="text-sm text-neutral-400">
            La tua collezione è salvata nel tuo account: accedi con lo stesso account da telefono e computer e vedrai sempre gli stessi dati.
          </p>
          <button type="button" className="btn-ghost w-full" onClick={() => void run(signOut, 'Disconnesso')} disabled={busy}>
            Esci
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="font-display text-xl uppercase">{mode === 'login' ? 'Accedi' : 'Crea un account'}</h1>
      <section className="space-y-4 rounded-xl bg-panel p-5 ring-1 ring-line">
        <p className="text-sm text-neutral-400">
          Accedi per salvare la collezione online e ritrovarla aggiornata su tutti i tuoi dispositivi. Senza accesso i dati restano solo
          su questo dispositivo.
        </p>
        <button
          type="button"
          className="btn w-full bg-white text-neutral-900 hover:bg-neutral-200"
          onClick={() => void run(signInWithGoogle)}
          disabled={busy}
        >
          <GoogleIcon /> Continua con Google
        </button>

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <span className="h-px flex-1 bg-line" /> oppure con email <span className="h-px flex-1 bg-line" />
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="label">Email</span>
            <input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              className="field"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && <p className="rounded-md bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {mode === 'login' ? 'Accedi' : 'Crea account'}
          </button>
        </form>

        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <button type="button" className="cursor-pointer text-marvel hover:underline" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}>
            {mode === 'login' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
          {mode === 'login' && (
            <button
              type="button"
              className="cursor-pointer text-neutral-400 hover:underline"
              onClick={() => {
                if (!email.trim()) return setError('Scrivi la tua email qui sopra, poi premi di nuovo "Password dimenticata".')
                void run(() => resetPassword(email), 'Ti abbiamo inviato un’email per reimpostare la password')
              }}
            >
              Password dimenticata?
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
