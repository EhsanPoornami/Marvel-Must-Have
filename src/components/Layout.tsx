import type { ReactNode } from 'react'
import { firebaseEnabled } from '../lib/firebase'
import { useStore } from '../store'

export type Route = 'dashboard' | 'catalogo' | 'mancanti' | 'backup' | 'account'

const NAV: { route: Route; label: string; icon: ReactNode }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" /> },
  { route: 'catalogo', label: 'Collezione', icon: <path d="M4 3h7v8H4V3Zm9 0h7v8h-7V3ZM4 13h7v8H4v-8Zm9 0h7v8h-7v-8Z" /> },
  { route: 'mancanti', label: 'Mi mancano', icon: <path d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h10v2H4v-2Z" /> },
  { route: 'backup', label: 'Backup', icon: <path d="M12 3 7 8h3v6h4V8h3l-5-5ZM5 17v2h14v-2H5Z" /> },
]

export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { toast, dismissToast, user, sync } = useStore()
  const accountLabel = user ? (user.displayName || user.email || 'Account') : 'Accedi'
  const pending = sync?.pending || sync?.fromCache

  return (
    <div className="min-h-dvh pb-20 sm:pb-8">
      <header className="sticky top-0 z-30 border-b-2 border-marvel bg-ink/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <a href="#/dashboard" className="mmh-logo flex items-center gap-2">
            <span className="mmh-logo-box rounded-sm bg-marvel px-1.5 py-0.5 font-display text-lg leading-none tracking-tight text-white">MARVEL</span>
            <span className="mmh-logo-sub font-display text-sm tracking-wide text-neutral-200 uppercase">Must-Have</span>
          </a>
          <nav className="ml-auto hidden gap-1 sm:flex">
            {NAV.map((n) => (
              <a
                key={n.route}
                href={`#/${n.route}`}
                className={`mmh-nav rounded-md px-3 py-1.5 text-sm font-semibold ${route === n.route ? 'bg-marvel text-white' : 'text-neutral-300 hover:text-white'}`}
              >
                {n.label}
              </a>
            ))}
          </nav>
          {firebaseEnabled && (
            <a
              href="#/account"
              title={user ? `${accountLabel}${pending ? ' – sincronizzazione in attesa' : ' – sincronizzato'}` : 'Accedi per sincronizzare i dati'}
              className={`relative ml-auto flex shrink-0 items-center gap-2 rounded-full sm:ml-0 ${route === 'account' ? 'ring-2 ring-marvel' : ''}`}
            >
              {user ? (
                <>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-marvel text-sm font-bold">{accountLabel[0].toUpperCase()}</span>
                  )}
                  <span className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-ink ${pending ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                </>
              ) : (
                <span className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-neutral-200 hover:border-marvel">Accedi</span>
              )}
            </a>
          )}
        </div>
      </header>

      <main key={route} className="mmh-page mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>

      {/* Bottom tab bar on phones */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {NAV.map((n) => (
          <a key={n.route} href={`#/${n.route}`} className={`mmh-tab flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${route === n.route ? 'text-marvel' : 'text-neutral-400'}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">{n.icon}</svg>
            {n.label}
          </a>
        ))}
      </nav>

      {toast && (
        <div key={toast.id} className="fixed inset-x-3 bottom-20 z-40 mx-auto flex max-w-md items-center gap-3 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-900 shadow-xl sm:bottom-6" role="status">
          <span className="flex-1">{toast.message}</span>
          {toast.undo && (
            <button type="button" className="cursor-pointer font-bold text-marvel" onClick={() => { toast.undo?.(); dismissToast() }}>
              Annulla
            </button>
          )}
        </div>
      )}
    </div>
  )
}
