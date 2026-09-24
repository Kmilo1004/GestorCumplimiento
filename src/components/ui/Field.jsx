export function Field({ label, children, required }) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  )
}

const baseInput =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100'

export function TextInput(props) {
  return <input {...props} className={`${baseInput} ${props.className || ''}`} />
}

export function TextArea(props) {
  return <textarea {...props} className={`${baseInput} resize-none ${props.className || ''}`} />
}

export function Select(props) {
  return <select {...props} className={`${baseInput} ${props.className || ''}`} />
}
