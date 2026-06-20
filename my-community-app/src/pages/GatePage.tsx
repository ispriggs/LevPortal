import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Share2, ChevronRight, Copy, Trash2 } from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import {
  useGateStore, type GatePass,
  PASS_TYPE_CONFIG, PASS_REASON_LABELS,
} from '@/store/gateStore'
import CreatePassSheet from '@/components/CreatePassSheet'
import { useToastStore } from '@/store/toastStore'

const PRIMARY = '#243d20'

// -- Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

type PassDisplayStatus = 'active' | 'upcoming' | 'expired' | 'pending_approval' | 'declined'

function passStatus(pass: GatePass): PassDisplayStatus {
  if (pass.extended) {
    if (pass.approvalStatus === 'declined') return 'declined'
    if (!pass.approvalStatus || pass.approvalStatus === 'pending') {
      const hoursSince = (Date.now() - new Date(pass.createdAt).getTime()) / 3_600_000
      if (hoursSince >= 48) return 'expired'
      // Within 48h window: treat as usable, fall through to date check
    }
  }
  const today = new Date().toISOString().slice(0, 10)
  if (today > pass.departureDate) return 'expired'
  if (today < pass.arrivalDate) return 'upcoming'
  return 'active'
}

function buildShareUrl(pass: GatePass): string {
  // Only include fields PassSharePage actually uses â€" exclude id, email, idPhotoUrl
  const payload = {
    passCode: pass.passCode,
    type: pass.type,
    reason: pass.reason,
    visitorName: pass.visitorName,
    phone: pass.phone,
    visitingLot: pass.visitingLot,
    extended: pass.extended,
    arrivalDate: pass.arrivalDate,
    departureDate: pass.departureDate,
    createdBy: pass.createdBy,
    createdAt: pass.createdAt,
    approvalStatus: pass.approvalStatus,
  }
  return `${window.location.origin}/pass?v=${btoa(JSON.stringify(payload))}`
}

function shareWhatsApp(pass: GatePass) {
  const url = buildShareUrl(pass)
  const valid = pass.extended
    ? `${fmtDate(pass.arrivalDate)} â€" ${fmtDate(pass.departureDate)}`
    : fmtDate(pass.arrivalDate)
  const text =
    `Welcome to LEV! ðŸŒ¿\n\n` +
    `Here is your gate pass for Pura Maracay:\n\n` +
    `ðŸ‘¤ ${pass.visitorName}\n` +
    `ðŸ"… ${valid}\n` +
    `ðŸ  Lot ${pass.visitingLot}\n\n` +
    `Tap the link below to open your pass at the gate:\n${url}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}



// â"€â"€ Pass card â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function PassCard({ pass, onView }: { pass: GatePass; onView: () => void }) {
  const cfg = PASS_TYPE_CONFIG[pass.type]
  const status = passStatus(pass)
  const isPending = pass.extended && pass.approvalStatus === 'pending'
  const hoursLeft = isPending
    ? Math.ceil(Math.max(0, 48 - (Date.now() - new Date(pass.createdAt).getTime()) / 3_600_000))
    : 0

  const STATUS_STYLES: Record<PassDisplayStatus, { bg: string; color: string; label: string }> = {
    active: { bg: '#d1fae5', color: '#065f46', label: 'Active' },
    upcoming: { bg: '#dbeafe', color: '#1e40af', label: 'Upcoming' },
    expired: { bg: '#f3f4f6', color: '#6b7280', label: 'Expired' },
    pending_approval: { bg: '#fef3c7', color: '#92400e', label: 'Pending Approval' },
    declined: { bg: '#fee2e2', color: '#991b1b', label: 'Declined' },
  }
  const statusStyle = isPending
    ? STATUS_STYLES.pending_approval
    : STATUS_STYLES[status]
  const canShare = status !== 'declined' && status !== 'expired'

  return (
    <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden flex">
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
            ? `${fmtDate(pass.arrivalDate)} â€" ${fmtDate(pass.departureDate)}`
            : fmtDate(pass.arrivalDate)}
        </p>
        {isPending && (
          <p className="text-xs font-medium text-amber-600 mb-3">
            Pending approval Â· visitor can use gate for {hoursLeft}h Â· auto-expires if not approved.
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

// â"€â"€ Pass detail view â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

function PassDetailView({ pass, onClose, onDelete }: { pass: GatePass; onClose: () => void; onDelete: () => void }) {
  const cfg = PASS_TYPE_CONFIG[pass.type]
  const status = passStatus(pass)
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
        <button onClick={onClose} className="p-1 -ml-1"><ArrowLeft size={32} color="#111" /></button>
        <p className="text-base font-bold text-gray-900 flex-1">Pass Details</p>
        {status === 'expired' && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Expired</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Styled pass card */}
        <div className="rounded-2xl overflow-hidden border border-gray-400 shadow-sm">
          <div className="px-5 py-4 text-white" style={{ backgroundColor: PRIMARY }}>
            <p className="text-[10px] font-bold tracking-widest opacity-60">PURA MARACAY Â· ECOVILLA</p>
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
                    ? `${fmtDate(pass.arrivalDate)} â€" ${fmtDate(pass.departureDate)}`
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

        <button
          onClick={onDelete}
          className="w-full py-3.5 rounded-xl border border-red-200 text-red-500 font-semibold text-sm flex items-center justify-center gap-2 transition-opacity active:opacity-80"
        >
          <Trash2 size={16} /> Delete Pass
        </button>
      </div>
    </div>
  )
}

// â"€â"€ Main page â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€

export default function GatePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const currentUser = getDisplayName(user)
  const { passes, fetchPasses, deletePass } = useGateStore()
  const showToast = useToastStore((s) => s.showToast)

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
      <CreatePassSheet open={creating} currentUser={currentUser} onClose={() => setCreating(false)} onCreate={handleCreated} />
      {viewPass && (
        <PassDetailView
          pass={viewPass}
          onClose={() => setViewPass(null)}
          onDelete={() => { deletePass(viewPass.id); setViewPass(null); showToast('Pass deleted.') }}
        />
      )}

      <div className="min-h-screen flex flex-col bg-gray-50">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 safe-top">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
            <ArrowLeft size={32} color="#111" />
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
            <Plus size={19} /> Create Pass
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

