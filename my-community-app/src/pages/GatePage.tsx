import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Share2, ChevronRight, Copy, X, Camera } from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import {
  useGateStore, type GatePass, type PassType, type PassReason,
  PASS_TYPE_CONFIG, PASS_REASON_LABELS, PASS_REASONS,
} from '@/store/gateStore'

const PRIMARY = '#243d20'

const PASS_TYPES: { value: PassType; label: string }[] = [
  { value: 'visitor', label: 'Visitor Pass' },
  { value: 'worker',  label: 'Worker Pass' },
  { value: 'event',   label: 'Event Pass' },
  { value: 'other',   label: 'Other' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type PassDisplayStatus = 'active' | 'upcoming' | 'expired' | 'pending_approval' | 'declined'

function passStatus(pass: GatePass): PassDisplayStatus {
  if (pass.extended) {
    if (!pass.approvalStatus || pass.approvalStatus === 'pending') return 'pending_approval'
    if (pass.approvalStatus === 'declined') return 'declined'
  }
  const today = new Date().toISOString().slice(0, 10)
  if (today > pass.departureDate) return 'expired'
  if (today < pass.arrivalDate)   return 'upcoming'
  return 'active'
}

function buildShareUrl(pass: GatePass): string {
  return `${window.location.origin}/pass?v=${btoa(JSON.stringify(pass))}`
}

function shareWhatsApp(pass: GatePass) {
  const url = buildShareUrl(pass)
  const text =
    `Your gate pass for Pura Maracay is ready!\n\n` +
    `Visitor: ${pass.visitorName}\n` +
    `Valid: ${fmtDate(pass.arrivalDate)}` +
    (pass.extended ? ` – ${fmtDate(pass.departureDate)}` : '') +
    `\n\nTap to open your pass and use the Enter button at the gate:\n${url}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}



// ── Pass card ──────────────────────────────────────────────────────────────────

function PassCard({ pass, onView }: { pass: GatePass; onView: () => void }) {
  const cfg    = PASS_TYPE_CONFIG[pass.type]
  const status = passStatus(pass)

  const STATUS_STYLES: Record<PassDisplayStatus, { bg: string; color: string; label: string }> = {
    active:           { bg: '#d1fae5', color: '#065f46', label: 'Active' },
    upcoming:         { bg: '#dbeafe', color: '#1e40af', label: 'Upcoming' },
    expired:          { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' },
    pending_approval: { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
    declined:         { bg: '#fee2e2', color: '#991b1b', label: 'Declined' },
  }
  const statusStyle = STATUS_STYLES[status]
  const canShare = status !== 'pending_approval' && status !== 'declined'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex">
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cfg.color }} />
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-base font-bold text-gray-900 leading-snug">{pass.visitorName}</p>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>
            {statusStyle.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {PASS_REASON_LABELS[pass.reason]}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            Lot {pass.visitingLot}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {pass.extended
            ? `${fmtDate(pass.arrivalDate)} – ${fmtDate(pass.departureDate)}`
            : fmtDate(pass.arrivalDate)}
        </p>
        {status === 'pending_approval' && (
          <p className="text-xs font-medium text-amber-600 mb-3">
            Awaiting admin approval — share link will be available once approved.
          </p>
        )}
        <div className="flex gap-2">
          {canShare && (
            <button
              onClick={() => shareWhatsApp(pass)}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-opacity active:opacity-80"
              style={{ backgroundColor: '#25D366' }}
            >
              <Share2 size={14} /> Share via WhatsApp
            </button>
          )}
          <button
            onClick={onView}
            className={`py-2.5 px-3 rounded-xl border border-gray-300 text-gray-600 transition-opacity active:opacity-70 ${!canShare ? 'flex-1' : ''}`}
            title="View details"
          >
            <ChevronRight size={16} className="mx-auto" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pass detail view ───────────────────────────────────────────────────────────

function PassDetailView({ pass, onClose }: { pass: GatePass; onClose: () => void }) {
  const cfg      = PASS_TYPE_CONFIG[pass.type]
  const status   = passStatus(pass)
  const shareUrl = buildShareUrl(pass)
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-30 bg-white flex flex-col safe-top">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onClose} className="p-1 -ml-1"><ArrowLeft size={22} color="#111" /></button>
        <p className="text-base font-bold text-gray-900 flex-1">Pass Details</p>
        {status === 'expired' && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Expired</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Styled pass card */}
        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="px-5 py-4 text-white" style={{ backgroundColor: PRIMARY }}>
            <p className="text-[10px] font-bold tracking-widest opacity-60">PURA MARACAY · ECOVILLA</p>
            <p className="text-xl font-black mt-0.5 tracking-wide">GATE PASS</p>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Visitor</p>
              <p className="text-xl font-bold text-gray-900">{pass.visitorName}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                {PASS_REASON_LABELS[pass.reason]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Visiting Lot</p>
                <p className="text-sm font-bold text-gray-800">Lot {pass.visitingLot}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Valid</p>
                <p className="text-xs font-semibold text-gray-800">
                  {pass.extended
                    ? `${fmtDate(pass.arrivalDate)} – ${fmtDate(pass.departureDate)}`
                    : fmtDate(pass.arrivalDate)}
                </p>
              </div>
              {pass.phone && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Phone</p>
                  <p className="text-sm font-semibold text-gray-800">{pass.phone}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Authorised by</p>
                <p className="text-sm font-semibold text-gray-800">{pass.createdBy}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Pass Code</p>
                <p className="text-lg font-bold font-mono tracking-widest text-gray-900">{pass.passCode}</p>
              </div>
              <p className="text-[10px] text-gray-400">{fmtDate(pass.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Share */}
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">Share Pass Link</p>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 flex-1 truncate">{shareUrl}</p>
            <button
              onClick={copyLink}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 flex items-center gap-1 transition-colors"
              style={copied ? { borderColor: PRIMARY, color: PRIMARY } : {}}
            >
              <Copy size={12} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => shareWhatsApp(pass)}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-opacity active:opacity-80"
            style={{ backgroundColor: '#25D366' }}
          >
            <Share2 size={16} /> Share via WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create Pass view ───────────────────────────────────────────────────────────

function CreatePassView({
  currentUser, onClose, onCreate,
}: { currentUser: string; onClose: () => void; onCreate: (pass: GatePass) => void }) {
  const { createPass } = useGateStore()
  const todayStr = new Date().toISOString().slice(0, 10)

  const [type,      setType]      = useState<PassType>('visitor')
  const [reason,    setReason]    = useState<PassReason>('family')
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [lot,       setLot]       = useState('1')
  const [extended,  setExtended]  = useState(false)
  const [arrival,   setArrival]   = useState(todayStr)
  const [departure, setDeparture] = useState(todayStr)
  const [idPhoto,   setIdPhoto]   = useState('')

  function handleIdPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setIdPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) return
    if (extended && !idPhoto) return
    const pass = await createPass({
      type, reason,
      visitorName: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim(),
      visitingLot: lot,
      extended,
      arrivalDate: arrival,
      departureDate: extended ? departure : arrival,
      idPhotoUrl: extended ? idPhoto : undefined,
      createdBy: currentUser,
    })
    if (pass) onCreate(pass)
  }

  return (
    <div className="fixed inset-0 z-30 bg-white flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onClose} className="p-1 -ml-1"><X size={22} color="#111" /></button>
        <p className="text-base font-bold text-gray-900">Create Pass</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8">
        {/* Info hint */}
        <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 leading-relaxed space-y-0.5">
          <p><strong>Visitor Pass</strong> → Fill in the visitor's information</p>
          <p><strong>Worker Pass</strong> → Fill in the worker's information</p>
          <p><strong>Event Pass</strong> → Fill in the host's information</p>
        </div>

        {/* Pass Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Pass Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PassType)}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 bg-white outline-none focus:border-green-700"
          >
            {PASS_TYPES.map((pt) => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
        </div>

        {/* Pass Reason */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Pass Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as PassReason)}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 bg-white outline-none focus:border-green-700"
          >
            {PASS_REASONS.map((r) => (
              <option key={r} value={r}>{PASS_REASON_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Full Name *</label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Visitor's full name"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-700"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">
            Email{' '}
            <span className="font-normal text-gray-400 text-xs">— not required if they have WhatsApp</span>
          </label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="visitor@email.com"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-700"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
          <input
            type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="+506 8888-0000"
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-700"
          />
        </div>

        {/* Visiting Lot */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Visiting Lot Number *</label>
          <select
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 bg-white outline-none focus:border-green-700"
          >
            {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={String(n)}>Lot {n}</option>
            ))}
          </select>
        </div>

        {/* Extended pass toggle */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">
            Extended Pass?{' '}
            <span className="font-normal text-gray-400 text-xs">— more than 1 day</span>
          </label>
          <div className="flex gap-2">
            {(['No', 'Yes'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setExtended(opt === 'Yes')}
                className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-colors"
                style={
                  extended === (opt === 'Yes')
                    ? { borderColor: PRIMARY, backgroundColor: PRIMARY + '15', color: PRIMARY }
                    : { borderColor: '#e5e7eb', backgroundColor: 'white', color: '#374151' }
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Arrival Date */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Arrival Date *</label>
          <input
            type="date" value={arrival} min={todayStr}
            onChange={(e) => { setArrival(e.target.value); if (!extended) setDeparture(e.target.value) }}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-700"
          />
        </div>

        {/* Departure Date + ID photo — extended only */}
        {extended && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Departure Date *</label>
              <input
                type="date" value={departure} min={arrival}
                onChange={(e) => setDeparture(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">
                ID Photo *{' '}
                <span className="font-normal text-gray-400 text-xs">— required for extended passes</span>
              </label>
              {idPhoto ? (
                <div className="relative">
                  <img src={idPhoto} alt="ID" className="w-full h-44 object-cover rounded-xl" />
                  <button
                    onClick={() => setIdPhoto('')}
                    className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <X size={14} color="white" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer active:bg-gray-50">
                  <Camera size={30} color="#9ca3af" strokeWidth={1.5} />
                  <p className="text-sm text-gray-400">Tap to photograph or upload ID</p>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleIdPhoto}
                  />
                </label>
              )}
              <p className="text-xs text-amber-600">
                Extended passes require admin approval. A link to share will be available once approved.
              </p>
            </div>
          </>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || !phone.trim() || (extended && !idPhoto)}
          className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity active:opacity-80"
          style={{ backgroundColor: PRIMARY }}
        >
          <Plus size={18} /> Create Pass
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GatePage() {
  const navigate    = useNavigate()
  const user        = useAuthStore((s) => s.user)
  const currentUser = getDisplayName(user)
  const { passes, fetchPasses } = useGateStore()

  useEffect(() => { fetchPasses() }, [])

  const myPasses = passes.filter((p) => p.createdBy === currentUser)

  const [creating, setCreating] = useState(false)
  const [viewPass, setViewPass] = useState<GatePass | null>(null)

  function handleCreated(pass: GatePass) {
    setCreating(false)
    setViewPass(pass)
  }

  return (
    <>
      {creating && (
        <CreatePassView currentUser={currentUser} onClose={() => setCreating(false)} onCreate={handleCreated} />
      )}
      {viewPass && (
        <PassDetailView pass={viewPass} onClose={() => setViewPass(null)} />
      )}

      <div className="min-h-svh flex flex-col bg-gray-50">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 safe-top">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
            <ArrowLeft size={22} color="#111" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Gate</h1>
          <p className="text-sm text-gray-500 mb-5">Manage visitor passes for Pura Maracay.</p>

          {/* Create pass */}
          <button
            onClick={() => setCreating(true)}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 mb-6 transition-opacity active:opacity-80"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={16} /> Create Pass
          </button>

          {/* Passes */}
          <h2 className="text-sm font-bold text-gray-700 mb-3">Your Passes</h2>
          {myPasses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-gray-400">No passes yet.</p>
              <p className="text-xs text-gray-400 mt-1">Create a pass to share with visitors, workers, or event guests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPasses.map((pass) => (
                <PassCard key={pass.id} pass={pass} onView={() => setViewPass(pass)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
