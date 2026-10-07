import { useState } from 'react'
import { DataProvider, useData } from './context/DataContext'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './components/dashboard/Dashboard'
import TrabajosView from './components/trabajos/TrabajosView'
import ActividadesView from './components/actividades/ActividadesView'
import BackupView from './components/backup/BackupView'
import VaultGate from './components/vault/VaultGate'
import MigracionBanner from './components/vault/MigracionBanner'

const TITULOS = {
  dashboard: { title: 'Resumen', subtitle: 'Cumplimiento de funciones' },
  trabajos: { title: 'Trabajos', subtitle: 'Trabajo → Función → Actividad' },
  actividades: { title: 'Actividades', subtitle: 'Filtra y actualiza tus actividades' },
  backup: { title: 'Bóveda', subtitle: 'Carpeta de datos y backups' },
}

function AppShell() {
  const [tab, setTab] = useState('dashboard')
  const { loading, error, boveda, refrescar, elegirBoveda } = useData()
  const { title, subtitle } = TITULOS[tab]

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
    <div className="min-h-dvh pb-20">
      <Header title={title} subtitle={subtitle} />

      <main>
        <MigracionBanner />
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-slate-400">Cargando datos…</div>
        ) : error ? (
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
        ) : (
          <>
            {tab === 'dashboard' && <Dashboard />}
            {tab === 'trabajos' && <TrabajosView />}
            {tab === 'actividades' && <ActividadesView />}
            {tab === 'backup' && <BackupView />}
          </>
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  )
}
