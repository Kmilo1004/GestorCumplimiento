import { useState } from 'react'
import { DataProvider, useData } from './context/DataContext'
import Header from './components/layout/Header'
import BottomNav from './components/layout/BottomNav'
import Dashboard from './components/dashboard/Dashboard'
import TrabajosView from './components/trabajos/TrabajosView'
import ActividadesView from './components/actividades/ActividadesView'
import BackupView from './components/backup/BackupView'

const TITULOS = {
  dashboard: { title: 'Resumen', subtitle: 'Cumplimiento de funciones' },
  trabajos: { title: 'Trabajos', subtitle: 'Trabajo → Función → Actividad' },
  actividades: { title: 'Actividades', subtitle: 'Filtra y actualiza tus actividades' },
  backup: { title: 'Backup', subtitle: 'Exporta e importa tus datos' },
}

function AppShell() {
  const [tab, setTab] = useState('dashboard')
  const { loading, error } = useData()
  const { title, subtitle } = TITULOS[tab]

  return (
    <div className="min-h-dvh pb-20">
      <Header title={title} subtitle={subtitle} />

      <main>
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-slate-400">Cargando datos…</div>
        ) : error ? (
          <div className="mx-auto max-w-2xl px-4 py-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
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
