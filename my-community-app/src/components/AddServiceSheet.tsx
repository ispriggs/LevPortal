import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'

const PRIMARY = '#243d20'

const SERVICE_OPTIONS = [
  'Electrician',
  'Plumber',
  'Handyman',
  'Gardener',
  'Taxi',
  'Car Hire',
  'House Cleaning',
  'Pool Maintenance',
  'Doctor',
  'Property Manager',
]

export type FormData = {
  name: string
  service: string
  location: string
  phone: string
}

const EMPTY: FormData = { name: '', service: '', location: '', phone: '' }

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: FormData) => void
}

function ServiceDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setExpanded((x) => !x)}
        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm bg-white text-left flex items-center justify-between outline-none focus:border-green-700"
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || 'Select a serviceâ€¦'}
        </span>
        <ChevronDown
          size={16}
          className="text-gray-400 transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Inline options list */}
      {expanded && (
        <div className="mt-1 border border-gray-200 rounded-lg bg-white overflow-hidden shadow-sm">
          {SERVICE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); setExpanded(false) }}
              className="w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-0 active:bg-gray-50"
              style={value === s ? { backgroundColor: '#f0f7f0', color: PRIMARY, fontWeight: 600 } : { color: '#374151' }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AddServiceSheet({ open, onClose, onSave }: Props) {
  const [form, setForm] = useState<FormData>(EMPTY)

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    if (!form.name || !form.service || !form.phone) return
    onSave(form)
    setForm(EMPTY)
    onClose()
  }

  function handleClose() {
    setForm(EMPTY)
    onClose()
  }

  const isValid = form.name.trim() && form.service && form.phone.trim()

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md md:max-w-3xl lg:max-w-5xl mx-auto shadow-2xl flex flex-col transition-transform duration-300 sheet-safe-bottom"
        style={{ maxHeight: 'calc(85vh - var(--keyboard-h, 0px))', minHeight: '40vh', transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add Service</h2>
          <button onClick={handleClose} className="p-1 text-gray-400" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Milton"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 bg-white outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Service *</label>
            <ServiceDropdown value={form.service} onChange={(v) => set('service', v)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Atenas"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 bg-white outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+506 0000 0000"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 bg-white outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            Save Service
          </button>

        </div>
      </div>
    </>
  )
}

