import { useState, useRef } from 'react'
import { X, AlertTriangle, Wrench, Flag, Lightbulb, Paperclip } from 'lucide-react'
import {
  type TicketCategory, type TicketPriority, type SubmitTicketData,
} from '@/store/ticketsStore'

const PRIMARY = '#243d20'

export const CATEGORY_CONFIG: Record<TicketCategory, {
  label: string; icon: React.FC<{ size?: number; color?: string }>; color: string; bg: string
}> = {
  fault: { label: 'Fault Report', icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2' },
  request: { label: 'General Request', icon: Wrench, color: '#2563eb', bg: '#dbeafe' },
  complaint: { label: 'Complaint', icon: Flag, color: '#d97706', bg: '#fef3c7' },
  idea: { label: 'Community Idea', icon: Lightbulb, color: '#16a34a', bg: '#dcfce7' },
}

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: '#15803d', bg: '#dcfce7' },
  medium: { label: 'Medium', color: '#a16207', bg: '#fef9c3' },
  high: { label: 'High', color: '#c2410c', bg: '#ffedd5' },
  urgent: { label: 'Urgent', color: '#991b1b', bg: '#fee2e2' },
}

interface Props {
  open: boolean
  defaultName: string
  onClose: () => void
  onSubmit: (data: SubmitTicketData, file: File | null) => void
}

export default function SubmitTicketSheet({ open, defaultName, onClose, onSubmit }: Props) {
  const [name, setName] = useState(defaultName)
  const [unit, setUnit] = useState('')
  const [category, setCategory] = useState<TicketCategory | ''>('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority | ''>('')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isValid = name.trim() && unit.trim() && category && subject.trim() && description.trim() && priority

  function reset() {
    setName(defaultName); setUnit(''); setCategory(''); setSubject('')
    setDescription(''); setPriority(''); setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }
  function handleClose() { reset(); onClose() }
  function handleSubmit() {
    if (!isValid) return
    onSubmit(
      { category: category as TicketCategory, subject: subject.trim(), description: description.trim(), priority: priority as TicketPriority, submittedBy: name.trim(), unit: unit.trim() },
      file,
    )
    reset()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={handleClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md mx-auto shadow-2xl flex flex-col transition-transform duration-300 safe-bottom"
        style={{ maxHeight: '70vh', minHeight: '40vh', transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">New Support Ticket</h2>
          <button onClick={handleClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">

          {/* Name + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Unit / Lot *</label>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. 7" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Category *</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [TicketCategory, typeof CATEGORY_CONFIG[TicketCategory]][]).map(([id, cfg]) => {
                const Icon = cfg.icon
                const selected = category === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors"
                    style={{ borderColor: selected ? cfg.color : '#e5e7eb', backgroundColor: selected ? cfg.bg : 'white' }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: selected ? cfg.color + '22' : '#f9fafb' }}>
                      <Icon size={18} color={selected ? cfg.color : '#9ca3af'} />
                    </div>
                    <span className="text-xs font-semibold leading-tight" style={{ color: selected ? cfg.color : '#6b7280' }}>{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Subject *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary of the issue" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail…" rows={4} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700 resize-none" />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Priority *</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(PRIORITY_CONFIG) as [TicketPriority, typeof PRIORITY_CONFIG[TicketPriority]][]).map(([id, cfg]) => {
                const selected = priority === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPriority(id)}
                    className="py-2.5 rounded-xl text-xs font-bold border-2 transition-colors"
                    style={{
                      borderColor: selected ? cfg.color : '#e5e7eb',
                      backgroundColor: selected ? cfg.color : 'white',
                      color: selected ? 'white' : '#9ca3af',
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Attachment <span className="font-normal">(optional)</span></label>
            <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              style={file ? { borderColor: PRIMARY, color: PRIMARY, backgroundColor: '#f0f7f0' } : { borderColor: '#d1d5db', color: '#9ca3af' }}
            >
              <Paperclip size={15} />
              {file ? file.name : 'Attach a photo or file'}
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            Submit Ticket
          </button>
        </div>
      </div>
    </>
  )
}
