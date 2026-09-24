const ICONS = {
  dashboard: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12.75 12 4.5l8.25 8.25M4.5 10.5V19.5a.75.75 0 0 0 .75.75H9.75v-6h4.5v6h4.5a.75.75 0 0 0 .75-.75V10.5" />
  ),
  trabajos: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5h16.5M3.75 12h16.5M3.75 16.5h16.5" />
  ),
  actividades: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  ),
  backup: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  ),
}

const TABS = [
  { id: 'dashboard', label: 'Resumen' },
  { id: 'trabajos', label: 'Trabajos' },
  { id: 'actividades', label: 'Actividades' },
  { id: 'backup', label: 'Backup' },
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-2xl justify-around">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isActive ? 2.2 : 1.8} className="h-5 w-5">
                {ICONS[tab.id]}
              </svg>
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export { TABS }
