import { useState, useEffect } from 'react'
import { X, Image } from 'lucide-react'

const PRIMARY = '#243d20'

export const PROPOSAL_CATEGORIES = [
  'Official Proposal',
  'Infrastructure',
  'Environmental',
  'Financial',
  'Community Events',
  'Other',
] as const

export type ProposalFormData = {
  category: string
  title: string
  description: string
  supporters: string
  problemSolution: string
  implementationTeam: string
  implementationPlan: string
  timeline: string
  longTermManagement: string
  costs: string
  photo: File | null
  existingPhotoUrl?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaveDraft: (data: ProposalFormData) => Promise<void>
  onSubmit: (data: ProposalFormData) => Promise<void>
  initial?: Partial<ProposalFormData>
}

const EMPTY: ProposalFormData = {
  category: 'Official Proposal',
  title: '',
  description: '',
  supporters: '',
  problemSolution: '',
  implementationTeam: '',
  implementationPlan: '',
  timeline: '',
  longTermManagement: '',
  costs: '',
  photo: null,
}

export default function CreateProposalSheet({ open, onClose, onSaveDraft, onSubmit, initial }: Props) {
  const [form, setForm] = useState<ProposalFormData>({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.existingPhotoUrl ?? null)

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initial })
      setPhotoPreview(initial?.existingPhotoUrl ?? null)
    }
  }, [open])

  function set<K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    set('photo', file)
    setPhotoPreview(file ? URL.createObjectURL(file) : (initial?.existingPhotoUrl ?? null))
  }

  async function handleSaveDraft() {
    if (!form.title.trim()) return
    setSaving(true)
    await onSaveDraft(form)
    setSaving(false)
    onClose()
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.description.trim()) return
    setSubmitting(true)
    await onSubmit(form)
    setSubmitting(false)
    onClose()
  }

  const canDraft = !!form.title.trim()
  const canSubmit = !!form.title.trim() && !!form.description.trim()

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md md:max-w-3xl lg:max-w-5xl mx-auto shadow-2xl flex flex-col transition-transform duration-300 sheet-safe-bottom"
        style={{ maxHeight: 'calc(85vh - var(--keyboard-h, 0px))', minHeight: '40vh', transform: open ? 'translateY(0)' : 'translateY(100%)', pointerEvents: open ? 'auto' : 'none' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">Submit Proposal</h2>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <p className="px-5 py-3 text-sm text-gray-500 border-b border-gray-100 flex-shrink-0 leading-relaxed">
          Once submitted, your proposal will need to be approved by the AC before it is visible to all residents.
        </p>

        {/* Scrollable form */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">Category*</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 bg-white outline-none focus:border-green-700"
            >
              {PROPOSAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">Title*</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Brief title for your submission"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">Description*</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Provide detailed information about your submission"
              rows={4}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            />
          </div>

          {/* Supporters */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">Supporters</label>
            <textarea
              value={form.supporters}
              onChange={(e) => set('supporters', e.target.value)}
              placeholder="List all supporters"
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            />
          </div>

          {/* Problem / Solution */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">
              Why is this a problem and how can this proposal solve the problem?
            </label>
            <textarea
              value={form.problemSolution}
              onChange={(e) => set('problemSolution', e.target.value)}
              placeholder="max 500 words"
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            />
          </div>

          {/* Implementation team */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">
              Who is on the implementation team and what are their roles?
            </label>
            <textarea
              value={form.implementationTeam}
              onChange={(e) => set('implementationTeam', e.target.value)}
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            />
          </div>

          {/* Implementation plan */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">How will it be implemented?</label>
            <textarea
              value={form.implementationPlan}
              onChange={(e) => set('implementationPlan', e.target.value)}
              placeholder="(Who takes action, when, and how) Proposed schedule."
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            />
          </div>

          {/* Timeline */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">
              What is the timeline for completing this proposal?
            </label>
            <textarea
              value={form.timeline}
              onChange={(e) => set('timeline', e.target.value)}
              placeholder="When do you propose the plan/project begins? When will it end?"
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            />
          </div>

          {/* Long-term management */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">
              What long-term management will this proposal need?
            </label>
            <textarea
              value={form.longTermManagement}
              onChange={(e) => set('longTermManagement', e.target.value)}
              placeholder="Does it need daily/weekly/monthly/yearly oversight? Who is responsible for this oversight?"
              rows={3}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            />
          </div>

          {/* Costs */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">
              Please share all information about costs for this proposal
            </label>
            <textarea
              value={form.costs}
              onChange={(e) => set('costs', e.target.value)}
              placeholder="Full cost breakdown"
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            />
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1.5">Photo Attachment (Optional)</label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="" className="w-full rounded-xl object-cover max-h-52" />
                <button
                  onClick={() => { set('photo', null); setPhotoPreview(null) }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-600 cursor-pointer">
                <Image size={16} />
                Click to upload an image
                <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          <div className="h-4" />
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-5 py-4 border-t border-gray-100 flex gap-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
        >
          <button
            onClick={handleSaveDraft}
            disabled={!canDraft || saving}
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 text-sm font-semibold disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="flex-1 py-3.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </>
  )
}

