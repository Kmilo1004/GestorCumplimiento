import { DataProvider, useData } from './context/DataContext'
import { UIProvider, useUI } from './context/UIContext'
import { useRuta } from './hooks/useRuta'
import Header from './components/layout/Header'
import { BotonFlotante, MenuInferior, MenuLateral } from './components/layout/Navegacion'
import Dashboard from './components/dashboard/Dashboard'
import TrabajosView from './components/trabajos/TrabajosView'
import ActividadesView from './components/actividades/ActividadesView'
import BackupView from './components/backup/BackupView'
import VaultGate from './components/vault/VaultGate'
import MigracionBanner from './components/vault/MigracionBanner'

const SECCIONES = new Set(['resumen', 'trabajos', 'actividades', 'boveda'])

function ErrorBoveda() {
  const { error, refrescar, elegirBoveda } = useData()
  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p>{error}</p>
        <p className="mt-1 text-red-600">
          ¿Moviste o renombraste la carpeta de la bóveda? Vuelve a intentarlo o elige su nueva ubicación.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refrescar({ recargar: true })}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 font-medium hover:bg-red-100"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => elegirBoveda().catch((err) => console.error(err))}
            className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700"
          >
            Elegir carpeta
          </button>
        </div>
      </div>
    </div>
  )
}

// Contenido según la ruta: #/resumen, #/trabajos[/<id>[/<funcionId>]],
// #/actividades, #/boveda.
function Contenido({ partes, navegar }) {
  const { loading, error, arbol } = useData()
  const { nuevaActividad } = useUI()
  const seccion = SECCIONES.has(partes[0]) ? partes[0] : 'resumen'
  // Dentro de un trabajo, el + preselecciona la función abierta o la primera
  // de ese trabajo.
  const funcionSugerida =
    seccion === 'trabajos' && partes[1]
      ? partes[2] || arbol.find((t) => t.id === partes[1])?.funciones[0]?.id
      : undefined

  let pagina
  if (loading) {
    pagina = <div className="flex items-center justify-center py-24 text-sm text-slate-400">Cargando datos…</div>
  } else if (error) {
    pagina = <ErrorBoveda />
  } else if (seccion === 'trabajos') {
    pagina = <TrabajosView trabajoId={partes[1]} funcionId={partes[2]} navegar={navegar} />
  } else if (seccion === 'actividades') {
    pagina = <ActividadesView />
  } else if (seccion === 'boveda') {
    pagina = (
      <>
        <Header title="Bóveda" subtitle="Carpeta de datos y respaldos" />
        <BackupView />
      </>
    )
  } else {
    pagina = <Dashboard navegar={navegar} />
  }

  return (
    <div className="min-h-dvh lg:pl-64">
      <MenuLateral seccion={seccion} trabajoId={partes[1]} navegar={navegar} />
      <main className="pb-28 lg:pb-10">
        <MigracionBanner />
        {pagina}
      </main>
      {seccion !== 'boveda' && !loading && !error && (
        <BotonFlotante onClick={() => nuevaActividad(funcionSugerida)} />
      )}
      <MenuInferior seccion={seccion} navegar={navegar} />
    </div>
  )
}

function AppShell() {
  const { boveda } = useData()
  const { partes, navegar } = useRuta()

  if (boveda.estado !== 'lista') {
    return (
      <div className="min-h-dvh">
        <Header title="Cumplimiento" subtitle="Gestión de funciones y actividades" />
        <main>
          <VaultGate />
        </main>
      </div>
    )
  }

  return (
    <UIProvider onIrATrabajos={() => navegar('trabajos')}>
      <Contenido partes={partes} navegar={navegar} />
    </UIProvider>
  )
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  )
}
