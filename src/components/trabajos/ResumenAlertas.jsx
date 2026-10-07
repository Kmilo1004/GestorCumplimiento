// Línea corta con lo que requiere atención: "1 vencida · 2 esta semana" o "Al día".
export default function ResumenAlertas({ conteo, className = '' }) {
  const partes = []
  if (conteo.vencidas) partes.push({ texto: `${conteo.vencidas} vencida${conteo.vencidas > 1 ? 's' : ''}`, color: 'text-red-600' })
  if (conteo.hoy) partes.push({ texto: `${conteo.hoy} para hoy`, color: 'text-amber-600' })
  if (conteo.semana) partes.push({ texto: `${conteo.semana} esta semana`, color: 'text-slate-600' })

  if (!partes.length) {
    return (
      <p className={`text-xs font-medium ${conteo.abiertas ? 'text-slate-400' : 'text-green-600'} ${className}`}>
        {conteo.abiertas ? 'Sin vencimientos cercanos' : 'Al día'}
      </p>
    )
  }

  return (
    <p className={`text-xs font-medium ${className}`}>
      {partes.map((p, i) => (
        <span key={p.texto}>
          {i > 0 && <span className="text-slate-300"> · </span>}
          <span className={p.color}>{p.texto}</span>
        </span>
      ))}
    </p>
  )
}
