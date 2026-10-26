import { useEffect, useState } from 'react'
import { Layout, type Route } from './components/Layout'
import { VolumeModal } from './components/VolumeModal'
import { AccountPage } from './pages/AccountPage'
import { BackupPage } from './pages/BackupPage'
import { CatalogPage } from './pages/CatalogPage'
import { ContactsPage } from './pages/ContactsPage'
import { DashboardPage } from './pages/DashboardPage'
import { MissingPage } from './pages/MissingPage'
import { useStore } from './store'
import type { Volume } from './types'

const ROUTES: Route[] = ['dashboard', 'catalogo', 'mancanti', 'backup', 'contatti', 'account']

function readRoute(): Route {
  const r = window.location.hash.replace(/^#\/?/, '') as Route
  return ROUTES.includes(r) ? r : 'dashboard'
}

/** Which volume the details modal shows: a Volume, 'new' for creation, or nothing. */
export type ModalTarget = Volume | 'new' | null

export default function App() {
  const { status, loadError } = useStore()
  const [route, setRoute] = useState<Route>(readRoute)
  const [modal, setModal] = useState<ModalTarget>(null)

  useEffect(() => {
    const onHash = () => { setRoute(readRoute()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const openVolume = (v: Volume) => setModal(v)

  let content
  if (status === 'loading') {
    content = <p className="py-20 text-center text-neutral-400">Caricamento…</p>
  } else if (status === 'error') {
    content = (
      <div className="mx-auto max-w-lg rounded-lg bg-red-950/60 p-4 text-red-100 ring-1 ring-red-900">
        <p className="font-bold">Impossibile caricare public/data/volumi.json</p>
        <p className="mt-1 text-sm">{loadError}</p>
        <p className="mt-2 text-sm">Controlla che il file esista e sia un JSON valido (ad es. nessuna virgola in più).</p>
      </div>
    )
  } else {
    content = {
      dashboard: <DashboardPage onOpen={openVolume} />,
      catalogo: <CatalogPage onOpen={openVolume} onNew={() => setModal('new')} />,
      mancanti: <MissingPage onOpen={openVolume} />,
      backup: <BackupPage />,
      contatti: <ContactsPage />,
      account: <AccountPage />,
    }[route]
  }

  return (
    <Layout route={route}>
      {content}
      {modal && <VolumeModal key={modal === 'new' ? 'new' : modal.id} volume={modal === 'new' ? null : modal} onClose={() => setModal(null)} />}
    </Layout>
  )
}
