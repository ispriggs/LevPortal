import { useState } from 'react'
import { X, Plus, Trash2, Calendar } from 'lucide-react'

const PRIMARY = '#243d20'

export type PollAudience = 'all' | 'owners_only'

export type CreatePollData = {
  title: string
  description: string
  endsAt: string
  options: string[]
  audience: PollAudience
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: CreatePollData) => void
}

export default function CreatePollSheet({ open, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [audience, setAudience] = useState<PollAudience>('all')

  function updateOption(i: number, val: string) {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)))
  }
  function addOption() {
    if (options.length < 6) setOptions((prev) => [...prev, ''])
  }
  function removeOption(i: number) {
    if (options.length <= 2) return
    setOptions((prev) => prev.filter((_, idx) => idx !== i))
  }
  function reset() {
    setTitle(''); setDescription(''); setEndsAt(''); setOptions(['', '']); setAudience('all')
  }
  function handleClose() { reset(); onClose() }
  function handleSave() {
    const filledOptions = options.filter((o) => o.trim())
    if (!title.trim() || !description.trim() || !endsAt || filledOptions.length < 2) return
    onSave({ title: title.trim(), description: description.trim(), endsAt, options: filledOptions, audience })
    reset()
    onClose()
  }

  const today = new Date().toISOString().split('T')[0]
  const isValid =
    title.trim() && description.trim() && endsAt && endsAt > today &&
    options.filter((o) => o.trim()).length >= 2

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={handleClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md md:max-w-3xl lg:max-w-5xl mx-auto shadow-2xl flex flex-col transition-transform duration-300 sheet-safe-bottom"
        style={{ maxHeight: 'calc(85vh - var(--keyboard-h, 0px))', minHeight: '40vh', transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Create Poll</h2>
          <button onClick={handleClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Poll title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Low Ropes Course"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the proposal or question in detailâ€¦"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 resize-none"
            />
          </div>

          {/* End date â€” styled button with transparent native input on top */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Voting closes on *</label>
            <div className="relative">
              {/* Visible styled button (pointer-events-none so clicks pass through to input) */}
              <div className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm flex items-center justify-between pointer-events-none"
                style={{ borderColor: endsAt ? '#15803d' : '#d1d5db' }}
              >
                <span className={endsAt ? 'text-gray-900' : 'text-gray-400'}>
                  {endsAt
                    ? new Date(endsAt + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    : 'Tap to choose a dateâ€¦'}
                </span>
                <Calendar size={16} color={endsAt ? '#15803d' : '#9ca3af'} />
              </div>
              {/* Transparent native input floated over the button â€” opens native calendar on tap */}
              <input
                type="date"
                value={endsAt}
                min={today}
                onChange={(e) => setEndsAt(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Who can vote? *</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-300">
              <button
                type="button"
                onClick={() => setAudience('all')}
                className="flex-1 py-3 text-sm font-semibold transition-colors"
                style={
                  audience === 'all'
                    ? { backgroundColor: PRIMARY, color: 'white' }
                    : { backgroundColor: 'white', color: '#6b7280' }
                }
              >
                All Residents
              </button>
              <button
                type="button"
                onClick={() => setAudience('owners_only')}
                className="flex-1 py-3 text-sm font-semibold border-l border-gray-300 transition-colors"
                style={
                  audience === 'owners_only'
                    ? { backgroundColor: PRIMARY, color: 'white' }
                    : { backgroundColor: 'white', color: '#6b7280' }
                }
              >
                Owners Only
              </button>
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Poll options * <span className="text-gray-400 font-normal">(min 2, max 6)</span>
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-sm text-gray-400 w-4 flex-shrink-0">{i + 1}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                  />
                  {options.length > 2 && (
                    <button onClick={() => removeOption(i)} className="text-red-400 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button onClick={addOption} className="mt-2 flex items-center gap-1 text-sm font-medium" style={{ color: PRIMARY }}>
                <Plus size={16} /> Add option
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            Create Poll
          </button>
        </div>
      </div>
    </>
  )
}

