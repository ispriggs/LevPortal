import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Check, X, Send, MessageSquare,
  FileText, UserPlus, ClipboardList, Ticket as TicketIcon,
  AlertCircle, Eye, ExternalLink, QrCode,
} from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { useMessagesStore } from '@/store/messagesStore'
import {
  useTicketsStore, type Ticket, type TicketStatus, type TicketPriority,
} from '@/store/ticketsStore'
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from '@/components/SubmitTicketSheet'
import { STATUS_CONFIG } from '@/pages/NeighbourSupportPage'
import {
  useGateStore, type GatePass,
  PASS_TYPE_CONFIG, PASS_REASON_LABELS,
} from '@/store/gateStore'
import type { ProposalComment } from '@/pages/ProposalsPage'

const PRIMARY = '#243d20'
const RED = '#c03828'

// ── Types ────────────────────────────────────────────────────────────────

type DocStatus = 'pending' | 'approved' | 'declined'
type SignupStatus = 'pending' | 'approved' | 'declined'

type PendingDoc = {
  id: string; title: string; folder: string; uploadedBy: string
  uploadedAt: string; access: 'all' | 'owners_only'; status: DocStatus
  fileUrl?: string; filePath?: string
}
type PendingSignup = {
  id: string; name: string; email: string; role: 'owner' | 'renter'
  lot?: string; submittedAt: string; status: SignupStatus
}
type AdminProposal = {
  id: string; category: string; title: string; description: string
  photoUrl?: string; submittedBy: string; submittedAt: string
  status: 'pending' | 'approved' | 'rejected'
  comments: ProposalComment[]
}



// ── Helpers ───────────────────────────────────────────────────────────────

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const MAP: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
    approved: { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
    declined: { bg: '#fee2e2', color: '#991b1b', label: 'Declined' },
    in_review: { bg: '#dbeafe', color: '#1e40af', label: 'In Review' },
    assigned: { bg: '#ede9fe', color: '#5b21b6', label: 'Assigned' },
    completed: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
    open: { bg: '#ffedd5', color: '#9a3412', label: 'Open' },
    in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'In Progress' },
    resolved: { bg: '#d1fae5', color: '#065f46', label: 'Resolved' },
    closed: { bg: '#f3f4f6', color: '#6b7280', label: 'Closed' },
  }
  const s = MAP[status] ?? { bg: '#f3f4f6', color: '#6b7280', label: status }
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ── Message Sheet ─────────────────────────────────────────────────────────

function MessageSheet({
  open, to, subject, onClose, onSend,
}: { open: boolean; to: string; subject: string; onClose: () => void; onSend: (text: string) => void }) {
  const [text, setText] = useState('')
  function handleSend() { if (!text.trim()) return; onSend(text.trim()); setText(''); onClose() }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .3s' }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md mx-auto shadow-2xl safe-bottom" style={{ maxHeight: '80vh', transform: open ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .3s' }}>
        <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Send Message</h2>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="text-sm text-gray-500 space-y-0.5">
            <p><span className="font-medium text-gray-700">To:</span> {to}</p>
            <p><span className="font-medium text-gray-700">Subject:</span> {subject}</p>
          </div>
          <textarea
            value={text} onChange={(e) => setText(e.target.value)}
            placeholder="Write your message…"
            rows={5}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
          />
          <button onClick={handleSend} disabled={!text.trim()} className="w-full py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40" style={{ backgroundColor: PRIMARY }}>
            <Send size={15} /> Send Message
          </button>
        </div>
      </div>
    </>
  )
}

// ── Signup Decline Sheet ──────────────────────────────────────────────────

function SignupDeclineSheet({
  open, signup, onClose, onDecline,
}: { open: boolean; signup: PendingSignup | null; onClose: () => void; onDecline: (id: string, reason: string) => void }) {
  const [reason, setReason] = useState('')
  function handleDecline() { if (!reason.trim() || !signup) return; onDecline(signup.id, reason.trim()); setReason(''); onClose() }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .3s' }} onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md mx-auto shadow-2xl safe-bottom" style={{ maxHeight: '80vh', transform: open ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .3s' }}>
        <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Decline Signup</h2>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {signup && (
            <div className="p-3 bg-gray-50 rounded-xl text-sm">
              <p className="font-semibold text-gray-900">{signup.name}</p>
              <p className="text-gray-500">{signup.email}</p>
            </div>
          )}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
            <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">This reason will be emailed to the applicant.</p>
          </div>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for declining…"
            rows={4}
            className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-red-500 resize-none"
          />
          <button onClick={handleDecline} disabled={!reason.trim()} className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40" style={{ backgroundColor: RED }}>
            Decline & Send Email
          </button>
        </div>
      </div>
    </>
  )
}

// ── Doc Preview Sheet ─────────────────────────────────────────────────────

function DocPreviewSheet({
  doc, onClose, onApprove, onDecline,
}: {
  doc: PendingDoc | null
  onClose: () => void
  onApprove: (id: string) => void
  onDecline: (id: string) => void
}) {
  const open = !!doc

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md mx-auto shadow-2xl flex flex-col transition-transform duration-300 safe-bottom"
        style={{ height: '80vh', transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Document Review</p>
            <h2 className="text-sm font-bold text-gray-900 leading-snug">{doc?.title}</h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc?.fileUrl && (
              <button
                onClick={() => window.open(doc.fileUrl, '_blank')}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-300 text-gray-600"
              >
                <ExternalLink size={12} /> Browser
              </button>
            )}
            <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
          </div>
        </div>

        {/* Metadata strip */}
        {doc && (
          <div className="px-5 py-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <span>By <strong className="text-gray-700">{doc.uploadedBy}</strong></span>
            <span>Folder: <strong className="text-gray-700">{doc.folder}</strong></span>
            <span>Access: <strong className="text-gray-700">{doc.access === 'owners_only' ? 'Owners only' : 'All residents'}</strong></span>
            <span>{fmt(doc.uploadedAt)}</span>
          </div>
        )}

        {/* Preview area */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {doc?.fileUrl ? (
            <iframe
              src={doc.fileUrl}
              className="w-full h-full border-0 bg-white"
              title={doc.title}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-8">
              <FileText size={56} color="#d1d5db" strokeWidth={1} className="mb-4" />
              <p className="text-sm font-semibold text-gray-500">No preview available</p>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed max-w-[260px]">
                Document previews will be available once Supabase storage is connected.
                Uploaded files will render here as PDFs or images.
              </p>
            </div>
          )}
        </div>

        {/* Action footer */}
        {doc?.status === 'pending' && (
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={() => { onApprove(doc.id); onClose() }}
              className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: PRIMARY }}
            >
              <Check size={15} /> Approve
            </button>
            <button
              onClick={() => { onDecline(doc.id); onClose() }}
              className="flex-1 py-3 rounded-xl border-2 border-red-300 text-red-600 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <X size={15} /> Decline
            </button>
          </div>
        )}
        {doc?.status !== 'pending' && (
          <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={onClose} className="w-full py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm">
              Close
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Tab sections ──────────────────────────────────────────────────────────

function DocItem({ doc, onPreview }: { doc: PendingDoc; onPreview: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-gray-900 leading-snug flex-1">{doc.title}</p>
        <StatusBadge status={doc.status} />
      </div>
      <div className="text-xs text-gray-500 space-y-0.5">
        <p>Uploaded by <span className="font-medium text-gray-700">{doc.uploadedBy}</span></p>
        <p>Folder: {doc.folder} · {doc.access === 'owners_only' ? 'Owners only' : 'All residents'}</p>
        <p>{fmt(doc.uploadedAt)}</p>
      </div>
      <button
        onClick={onPreview}
        className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: PRIMARY }}
      >
        <Eye size={14} />
        {doc.status === 'pending' ? 'Preview & Review' : 'View Document'}
      </button>
    </div>
  )
}

function SignupItem({ s, onApprove, onDecline }: { s: PendingSignup; onApprove: () => void; onDecline: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-gray-900">{s.name}</p>
          <p className="text-xs text-gray-500">{s.email}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="text-xs text-gray-500">
        <span className="capitalize font-medium text-gray-700">{s.role}</span>
        {s.lot && ` · Lot ${s.lot}`}
        {' · Applied '}{fmt(s.submittedAt)}
      </div>
      {s.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button onClick={onApprove} className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5" style={{ backgroundColor: PRIMARY }}>
            <Check size={14} /> Approve
          </button>
          <button onClick={onDecline} className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold flex items-center justify-center gap-1.5">
            <X size={14} /> Decline
          </button>
        </div>
      )}
    </div>
  )
}

function ProposalItem({
  p, onManage,
}: { p: AdminProposal; onManage: () => void }) {
  const commentCount = p.comments.length
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex">
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: p.status === 'pending' ? '#d97706' : p.status === 'approved' ? '#16a34a' : '#dc2626' }} />
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{p.category}</p>
            <p className="text-sm font-bold text-gray-900 leading-snug">{p.title}</p>
          </div>
          <StatusBadge status={p.status} />
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {p.submittedBy} · {fmt(p.submittedAt)}
          {commentCount > 0 && <span className="ml-2">{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>}
        </p>
        <button onClick={onManage} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: PRIMARY }}>
          <MessageSquare size={14} /> View &amp; Manage
        </button>
      </div>
    </div>
  )
}

function AdminTicketCard({ ticket, onManage }: { ticket: Ticket; onManage: () => void }) {
  const cat = CATEGORY_CONFIG[ticket.category]
  const commentCount = ticket.history.filter((h) => h.type === 'comment').length
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex">
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cat.color }} />
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-gray-400">{ticket.ticketNumber} · <span style={{ color: cat.color }}>{cat.label}</span></p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 leading-snug">{ticket.subject}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {ticket.submittedBy} · Unit {ticket.unit} · {fmt(ticket.createdAt)}
          {commentCount > 0 && <span className="ml-2">{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>}
        </p>
        <button onClick={onManage} className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: PRIMARY }}>
          <MessageSquare size={14} /> View &amp; Manage
        </button>
      </div>
    </div>
  )
}

// Full-screen ticket management view for admin
function TicketManageView({
  ticket, allTickets, onBack, onMessage, onStatusChange, onAddNote,
}: {
  ticket: Ticket; allTickets: Ticket[]
  onBack: () => void; onMessage: () => void
  onStatusChange: (id: string, status: TicketStatus) => void
  onAddNote: (id: string, text: string) => void
}) {
  const [note, setNote] = useState('')
  const live = allTickets.find((t) => t.id === ticket.id) ?? ticket

  const nextStatusMap: Record<TicketStatus, TicketStatus | null> = {
    open: 'in_progress', in_progress: 'resolved', resolved: 'closed', closed: null,
  }
  const nextStatus = nextStatusMap[live.status]
  const cat = CATEGORY_CONFIG[live.category]

  function handleSendNote() {
    if (!note.trim()) return
    onAddNote(live.id, note.trim())
    setNote('')
  }

  return (
    <div className="fixed inset-0 z-[35] bg-white flex flex-col safe-top">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft size={22} color="#111" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-400">{live.ticketNumber}</p>
          <p className="text-sm font-bold text-gray-900 truncate">{live.subject}</p>
        </div>
        <button onClick={onMessage} className="p-2 rounded-xl border border-gray-300 text-gray-600" title="Message submitter">
          <MessageSquare size={16} />
        </button>
      </div>

      {/* Ticket details */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0 space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cat.bg, color: cat.color }}>{cat.label}</span>
          <PriorityBadge priority={live.priority} />
          <StatusBadge status={live.status} />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{live.description}</p>
        <p className="text-xs text-gray-400">{live.submittedBy} · Unit {live.unit} · {fmt(live.createdAt)}</p>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {live.history.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No updates yet on this ticket.</p>
        )}
        {live.history.map((entry) => {
          if (entry.type === 'status_change') {
            return (
              <div key={entry.id} className="flex items-center gap-3 py-1">
                <div className="flex-1 border-t border-dashed border-gray-200" />
                <p className="text-[11px] text-gray-400 text-center flex-shrink-0 whitespace-nowrap">
                  → <strong className="text-gray-600">{STATUS_CONFIG[entry.toStatus!].label}</strong> · {fmt(entry.createdAt)}
                </p>
                <div className="flex-1 border-t border-dashed border-gray-200" />
              </div>
            )
          }
          const isAdmin = entry.isAdmin
          return (
            <div key={entry.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[80%]">
                {isAdmin && <p className="text-xs text-gray-400 mb-1 ml-1">You (Admin)</p>}
                <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={isAdmin
                    ? { backgroundColor: PRIMARY, color: 'white', borderBottomLeftRadius: 4 }
                    : { backgroundColor: '#f3f4f6', color: '#111827', borderBottomRightRadius: 4 }}>
                  {entry.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${isAdmin ? 'ml-1' : 'text-right mr-1'}`}>
                  {entry.actor} · {fmt(entry.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions footer */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 space-y-3 safe-bottom">
        {nextStatus && (
          <button
            onClick={() => onStatusChange(live.id, nextStatus)}
            className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: PRIMARY }}
          >
            Move to {STATUS_CONFIG[nextStatus].label}
          </button>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note or update to the ticket…"
            rows={2}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
          />
          <button onClick={handleSendNote} disabled={!note.trim()} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40" style={{ backgroundColor: PRIMARY }}>
            <Send size={15} color="white" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Proposal Manage View ──────────────────────────────────────────────────

function ProposalManageView({
  proposal, allProposals, adminName, onBack, onApprove, onReject, onMessage, onAddComment,
}: {
  proposal: AdminProposal
  allProposals: AdminProposal[]
  adminName: string
  onBack: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onMessage: () => void
  onAddComment: (id: string, text: string) => void
}) {
  const [note, setNote] = useState('')
  const live = allProposals.find((p) => p.id === proposal.id) ?? proposal

  function handleSend() {
    if (!note.trim()) return
    onAddComment(live.id, note.trim())
    setNote('')
  }

  return (
    <div className="fixed inset-0 z-[35] bg-white flex flex-col safe-top">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft size={22} color="#111" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{live.category}</p>
          <p className="text-sm font-bold text-gray-900 truncate">{live.title}</p>
        </div>
        <button onClick={onMessage} className="p-2 rounded-xl border border-gray-300 text-gray-600" title="Message submitter">
          <MessageSquare size={16} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0 space-y-1.5">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={live.status} />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{live.description}</p>
        <p className="text-xs text-gray-400">By {live.submittedBy} · {fmt(live.submittedAt)}</p>
        {live.status === 'pending' && (
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { onApprove(live.id); onBack() }}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: PRIMARY }}
            >
              <Check size={14} /> Approve
            </button>
            <button
              onClick={() => { onReject(live.id); onBack() }}
              className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold flex items-center justify-center gap-1"
            >
              <X size={13} /> Reject
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {live.comments.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No comments yet on this proposal.</p>
        )}
        {live.comments.map((c) => {
          const isAdmin = c.author === adminName
          return (
            <div key={c.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
              <div className="max-w-[80%]">
                {isAdmin && <p className="text-xs text-gray-400 mb-1 ml-1">You (Admin)</p>}
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={isAdmin
                    ? { backgroundColor: PRIMARY, color: 'white', borderBottomLeftRadius: 4 }
                    : { backgroundColor: '#f3f4f6', color: '#111827', borderBottomRightRadius: 4 }}
                >
                  {c.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${isAdmin ? 'ml-1' : 'text-right mr-1'}`}>
                  {c.author} · {fmt(c.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex-shrink-0 px-4 py-4 border-t border-gray-100 safe-bottom">
        <div className="flex gap-2 items-end">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a comment on this proposal…"
            rows={2}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!note.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            <Send size={15} color="white" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Extended Pass Card ────────────────────────────────────────────────────────

function ExtendedPassCard({
  pass, onApprove, onDecline,
}: { pass: GatePass; onApprove: () => void; onDecline: () => void }) {
  const cfg = PASS_TYPE_CONFIG[pass.type]
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {pass.idPhotoUrl ? (
        <img src={pass.idPhotoUrl} alt="ID" className="w-full h-44 object-cover" />
      ) : (
        <div className="h-20 bg-gray-100 flex items-center justify-center">
          <p className="text-xs text-gray-400">No ID photo</p>
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-gray-900">{pass.visitorName}</p>
          <StatusBadge status={pass.approvalStatus ?? 'pending'} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}>{cfg.label}</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {PASS_REASON_LABELS[pass.reason]}
          </span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            Lot {pass.visitingLot}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {fmt(pass.arrivalDate)} – {fmt(pass.departureDate)} · {pass.phone}
        </p>
        <p className="text-xs text-gray-500">
          Requested by <span className="font-medium text-gray-700">{pass.createdBy}</span>
        </p>
        {pass.approvalStatus === 'pending' && (
          <div className="flex gap-2 pt-1">
            <button onClick={onApprove}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5"
              style={{ backgroundColor: PRIMARY }}>
              <Check size={14} /> Approve
            </button>
            <button onClick={onDecline}
              className="flex-1 py-2.5 rounded-xl border border-red-300 text-red-600 text-sm font-semibold flex items-center justify-center gap-1.5">
              <X size={14} /> Decline
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────

type Tab = 'docs' | 'signups' | 'proposals' | 'tickets' | 'passes'

export default function AdminPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const adminName = getDisplayName(user)
  const startThread = useMessagesStore((s) => s.startThread)

  const { tickets: allTickets, updateStatus: storeUpdateStatus, addComment: storeAddComment, fetchTickets } = useTicketsStore()
  const { passes: allPasses, approvePass, declinePass, fetchPasses } = useGateStore()

  useEffect(() => {
    fetchTickets()
    fetchPasses()
  }, [])
  const [managingTicket, setManagingTicket] = useState<Ticket | null>(null)
  const [managingProposal, setManagingProposal] = useState<AdminProposal | null>(null)

  const [activeTab, setActiveTab] = useState<Tab>('docs')
  const [docs, setDocs] = useState<PendingDoc[]>([])
  const [signups, setSignups] = useState<PendingSignup[]>([])
  const [proposals, setProposals] = useState<AdminProposal[]>([])

  const loadDocs = useCallback(async () => {
    const { data: rows } = await supabase
      .from('documents')
      .select('*')
      .eq('status', 'pending')
      .order('uploaded_at', { ascending: false })
    if (!rows) return

    const uids = [...new Set(rows.map((r) => r.uploaded_by).filter(Boolean))]
    const { data: profiles } = uids.length
      ? await supabase.from('profiles').select('id, full_name').in('id', uids)
      : { data: [] }
    const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))

    setDocs(rows.map((r) => ({
      id: r.id,
      title: r.title,
      folder: r.folder,
      uploadedBy: nameMap[r.uploaded_by] ?? 'Unknown',
      uploadedAt: r.uploaded_at,
      access: r.access as 'all' | 'owners_only',
      status: r.status as DocStatus,
      fileUrl: r.file_url,
      filePath: r.file_path,
    })))
  }, [])

  const loadSignups = useCallback(async () => {
    const { data: rows } = await supabase
      .from('profiles')
      .select('id, full_name, role, lot, phone, created_at')
      .order('created_at', { ascending: false })
    if (!rows) return
    setSignups(rows.map((r) => ({
      id: r.id,
      name: r.full_name,
      email: r.phone ?? '',
      role: r.role as 'owner' | 'renter',
      lot: r.lot ?? undefined,
      submittedAt: r.created_at,
      status: 'approved' as SignupStatus,
    })))
  }, [])

  const loadProposals = useCallback(async () => {
    const { data: rows } = await supabase
      .from('proposals')
      .select('*')
      .in('status', ['pending', 'approved', 'rejected'])
      .order('created_at', { ascending: false })
    if (!rows) return

    const uids = [...new Set(rows.map((r) => r.created_by).filter(Boolean))]
    const { data: profiles } = uids.length
      ? await supabase.from('profiles').select('id, full_name').in('id', uids)
      : { data: [] }
    const nameMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))

    const ids = rows.map((r) => r.id)
    const { data: commentRows } = ids.length
      ? await supabase.from('proposal_comments').select('*').in('proposal_id', ids).order('created_at', { ascending: true })
      : { data: [] }
    const commentsByProposal = (commentRows ?? []).reduce<Record<string, ProposalComment[]>>((acc, c) => {
      const list = acc[c.proposal_id] ?? []
      return { ...acc, [c.proposal_id]: [...list, { id: c.id, author: c.author, text: c.text, createdAt: c.created_at }] }
    }, {})

    setProposals(rows.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      description: r.description,
      photoUrl: r.photo_url ?? undefined,
      submittedBy: nameMap[r.created_by] ?? 'Unknown',
      submittedAt: r.created_at,
      status: r.status as AdminProposal['status'],
      comments: commentsByProposal[r.id] ?? [],
    })))
  }, [])

  useEffect(() => {
    fetchTickets()
    fetchPasses()
    loadDocs()
    loadSignups()
    loadProposals()
  }, [])

  // Sheet state
  const [msgSheet, setMsgSheet] = useState<{ to: string; subject: string } | null>(null)
  const [declineSignup, setDeclineSignup] = useState<PendingSignup | null>(null)
  const [previewDoc, setPreviewDoc] = useState<PendingDoc | null>(null)

  // ── Doc actions
  async function approveDoc(id: string) {
    await supabase.from('documents').update({ status: 'approved' }).eq('id', id)
    setDocs((p) => p.filter((d) => d.id !== id))
  }
  async function declineDoc(id: string) {
    const doc = docs.find((d) => d.id === id)!
    await Promise.all([
      supabase.from('documents').delete().eq('id', id),
      doc.filePath ? supabase.storage.from('documents').remove([doc.filePath]) : Promise.resolve(),
    ])
    setDocs((p) => p.filter((d) => d.id !== id))
    setMsgSheet({ to: doc.uploadedBy, subject: `Re: Document declined — ${doc.title}` })
  }

  // ── Signup actions
  function approveSignup(id: string) {
    setSignups((p) => p.map((s) => s.id !== id ? s : { ...s, status: 'approved' }))
  }
  function declineSignupFn(id: string, reason: string) {
    setSignups((p) => p.map((s) => s.id !== id ? s : { ...s, status: 'declined' }))
    const s = signups.find((x) => x.id === id)!
    // In production: Supabase Edge Function sends email to s.email with reason
    alert(`Email sent to ${s.email}:\n\n"${reason}"`)
  }

  // ── Proposal actions
  async function approveProposal(id: string) {
    await supabase.from('proposals').update({ status: 'approved' }).eq('id', id)
    setProposals((prev) => prev.filter((x) => x.id !== id))
  }
  async function rejectProposal(id: string) {
    const p = proposals.find((x) => x.id === id)!
    await supabase.from('proposals').update({ status: 'rejected' }).eq('id', id)
    setProposals((prev) => prev.filter((x) => x.id !== id))
    setMsgSheet({ to: p.submittedBy, subject: `Re: Proposal not approved — ${p.title}` })
  }
  async function addProposalComment(proposalId: string, text: string) {
    const { data: row } = await supabase
      .from('proposal_comments')
      .insert({ proposal_id: proposalId, text, author: adminName })
      .select()
      .single()
    if (!row) return
    const comment: ProposalComment = { id: row.id, author: adminName, text: row.text, createdAt: row.created_at }
    setProposals((prev) => prev.map((p) => p.id !== proposalId ? p : { ...p, comments: [...p.comments, comment] }))
  }

  // ── Send in-app message
  function handleSendMessage(text: string) {
    if (!msgSheet) return
    startThread(msgSheet.subject, msgSheet.to, adminName, text)
  }

  const pendingDocs = docs.filter((d) => d.status === 'pending').length
  const pendingSignups = 0
  const pendingProposals = proposals.filter((p) => p.status === 'pending').length
  const openTickets = allTickets.filter((t) => t.status === 'open').length
  const pendingPasses = allPasses.filter((p) => p.extended && p.approvalStatus === 'pending').length

  const TABS: { id: Tab; label: string; icon: typeof FileText; count: number }[] = [
    { id: 'docs', label: 'Documents', icon: FileText, count: pendingDocs },
    { id: 'signups', label: 'Signups', icon: UserPlus, count: pendingSignups },
    { id: 'proposals', label: 'Proposals', icon: ClipboardList, count: pendingProposals },
    { id: 'tickets', label: 'Tickets', icon: TicketIcon, count: openTickets },
    { id: 'passes', label: 'Passes', icon: QrCode, count: pendingPasses },
  ]

  return (
    <div className="min-h-svh flex flex-col bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 safe-top">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
          <ArrowLeft size={22} color="#111" />
        </button>
      </div>

      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-0">
        <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
        <p className="text-sm text-gray-500 mt-0.5 mb-3">
          Manage documents, signups, proposals, and support tickets.
        </p>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0">
          {TABS.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors relative"
              style={
                activeTab === id
                  ? { backgroundColor: '#f9fafb', color: PRIMARY, borderBottom: '2px solid ' + PRIMARY }
                  : { backgroundColor: 'transparent', color: '#6b7280', borderBottom: '2px solid transparent' }
              }
            >
              <Icon size={14} />
              {label}
              {count > 0 && (
                <span className="ml-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-3">

        {activeTab === 'docs' && (
          <>
            {docs.length === 0 && <p className="text-sm text-gray-400 text-center py-12">No documents to review.</p>}
            {docs.map((d) => (
              <DocItem key={d.id} doc={d} onPreview={async () => {
                if (d.filePath) {
                  const { data } = await supabase.storage.from('documents').createSignedUrl(d.filePath, 3600)
                  setPreviewDoc({ ...d, fileUrl: data?.signedUrl ?? d.fileUrl })
                } else {
                  setPreviewDoc(d)
                }
              }} />
            ))}
          </>
        )}

        {activeTab === 'signups' && (
          <>
            {signups.length === 0 && <p className="text-sm text-gray-400 text-center py-12">No pending signups.</p>}
            {signups.map((s) => (
              <SignupItem key={s.id} s={s} onApprove={() => approveSignup(s.id)} onDecline={() => setDeclineSignup(s)} />
            ))}
          </>
        )}

        {activeTab === 'proposals' && (
          <>
            {proposals.length === 0 && <p className="text-sm text-gray-400 text-center py-12">No pending proposals.</p>}
            {proposals.map((p) => (
              <ProposalItem
                key={p.id}
                p={p}
                onManage={() => setManagingProposal(p)}
              />
            ))}
          </>
        )}

        {activeTab === 'tickets' && (
          <>
            {allTickets.length === 0 && <p className="text-sm text-gray-400 text-center py-12">No tickets.</p>}
            {[...allTickets]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((t) => (
                <AdminTicketCard key={t.id} ticket={t} onManage={() => setManagingTicket(t)} />
              ))}
          </>
        )}

        {activeTab === 'passes' && (
          <>
            {allPasses.filter((p) => p.extended).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-12">No extended passes.</p>
            )}
            {[...allPasses]
              .filter((p) => p.extended)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .map((p) => (
                <ExtendedPassCard
                  key={p.id}
                  pass={p}
                  onApprove={() => approvePass(p.id)}
                  onDecline={() => declinePass(p.id)}
                />
              ))}
          </>
        )}
      </div>

      {/* Proposal manage view */}
      {managingProposal && (
        <ProposalManageView
          proposal={managingProposal}
          allProposals={proposals}
          adminName={adminName}
          onBack={() => setManagingProposal(null)}
          onApprove={(id) => approveProposal(id)}
          onReject={(id) => rejectProposal(id)}
          onMessage={() => setMsgSheet({ to: managingProposal.submittedBy, subject: `Re: ${managingProposal.title}` })}
          onAddComment={addProposalComment}
        />
      )}

      {/* Ticket manage view */}
      {managingTicket && (
        <TicketManageView
          ticket={managingTicket}
          allTickets={allTickets}
          onBack={() => setManagingTicket(null)}
          onMessage={() => {
            const t = allTickets.find((x) => x.id === managingTicket.id) ?? managingTicket
            setMsgSheet({ to: t.submittedBy, subject: `Re: Ticket ${t.ticketNumber} — ${t.subject}` })
          }}
          onStatusChange={(id, status) => storeUpdateStatus(id, status, adminName)}
          onAddNote={(id, text) => storeAddComment(id, adminName, text, true)}
        />
      )}

      {/* Sheets */}
      <MessageSheet
        open={!!msgSheet}
        to={msgSheet?.to ?? ''}
        subject={msgSheet?.subject ?? ''}
        onClose={() => setMsgSheet(null)}
        onSend={handleSendMessage}
      />
      <SignupDeclineSheet
        open={!!declineSignup}
        signup={declineSignup}
        onClose={() => setDeclineSignup(null)}
        onDecline={declineSignupFn}
      />
      <DocPreviewSheet
        doc={previewDoc}
        onClose={() => setPreviewDoc(null)}
        onApprove={(id) => { approveDoc(id); setPreviewDoc(null) }}
        onDecline={(id) => { declineDoc(id); setPreviewDoc(null) }}
      />
    </div>
  )
}
