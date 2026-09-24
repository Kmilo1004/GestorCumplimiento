export default function Header({ title, subtitle, action }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 px-4 pb-3 pt-4 backdrop-blur safe-top sm:px-6">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  )
}
