function colorPorProgreso(valor) {
  if (valor >= 100) return 'bg-estado-completada'
  if (valor >= 50) return 'bg-estado-progreso'
  if (valor > 0) return 'bg-amber-400'
  return 'bg-slate-300'
}

export default function ProgressBar({ value = 0, size = 'md', showLabel = true }) {
  const clamped = Math.max(0, Math.min(100, value))
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5'

  return (
    <div className="flex w-full items-center gap-2">
      <div className={`w-full overflow-hidden rounded-full bg-slate-100 ${height}`}>
        <div
          className={`${height} rounded-full transition-all duration-300 ${colorPorProgreso(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-slate-500">
          {clamped}%
        </span>
      )}
    </div>
  )
}
