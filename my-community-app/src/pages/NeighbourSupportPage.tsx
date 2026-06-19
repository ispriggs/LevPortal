import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Search, ChevronRight, Send, X,
  AlertTriangle, Wrench, Flag, Lightbulb,
  Circle, Clock, CheckCircle, XCircle, Paperclip,
} from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import {
  useTicketsStore,
  type Ticket, type TicketCategory, type TicketPriority,
  type TicketStatus, type SubmitTicketData,
} from '@/store/ticketsStore'

const PRIMARY = '#243d20'

// ── Config ────────────────────────────────────────────────────────────────

export const CATEGORY_CONFIG: Record<TicketCategory, {
  label: string; icon: React.FC<{ size?: number; color?: string }>; color: string; bg: string
}> = {
  fault:     { label: 'Fault Report',    icon: AlertTriangle, color: '#dc2626', bg: '#fee2e2' },
  request:   { label: 'General Request', icon: Wrench,        color: '#2563eb', bg: '#dbeafe' },
  complaint: { label: 'Complaint',       icon: Flag,          color: '#d97706', bg: '#fef3c7' },
  idea:      { label: 'Community Idea',  icon: Lightbulb,     color: '#16a34a', bg: '#dcfce7' },
}

export const PRIORITY_CONFIG: Record<TicketPriority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Low',    color: '#15803d', bg: '#dcfce7' },
  medium: { label: 'Medium', color: '#a16207', bg: '#fef9c3' },
  high:   { label: 'High',   color: '#c2410c', bg: '#ffedd5' },
  urgent: { label: 'Urgent', color: '#991b1b', bg: '#fee2e2' },
}

export const STATUS_CONFIG: Record<TicketStatus, {
  label: string; color: string; bg: string; icon: React.FC<{ size?: number; color?: string }>
}> = {
  open:        { label: 'Open',        color: '#c2410c', bg: '#ffedd5', icon: Circle },
  in_progress: { label: 'In Progress', color: '#1d4ed8', bg: '#dbeafe', icon: Clock },
  resolved:    { label: 'Resolved',    color: '#15803d', bg: '#dcfce7', icon: CheckCircle },
  closed:      { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6', icon: XCircle },
}

// ── Helpers ───────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function useToast() {
  const [state, setState] = useState({ msg: '', visible: false })
  function show(msg: string) {
    setState({ msg, visible: true })
    setTimeout(() => setState((s) => ({ ...s, visible: false })), 3500)
  }
  return { ...state, show }
}

function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <div
      className="fixed bottom-28 left-1/2 z-[200] px-5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full shadow-xl pointer-events-none transition-all duration-300 flex items-center gap-2"
      style={{ transform: `translateX(-50%) translateY(${visible ? 0 : 12}px)`, opacity: visible ? 1 : 0 }}
    >
      <CheckCircle size={15} /> {msg}
    </div>
  )
}

// ── Shared badge components ───────────────────────────────────────────────

function CategoryBadge({ category }: { category: TicketCategory }) {
  const cfg = CATEGORY_CONFIG[category]
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      <Icon size={10} /> {cfg.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  )
}

// ── Submit Ticket Sheet ───────────────────────────────────────────────────

function SubmitTicketSheet({
  open, defaultName, onClose, onSubmit,
}: {
  open: boolean
  defaultName: string
  onClose: () => void
  onSubmit: (data: SubmitTicketData, file: File | null) => void
}) {
  const [name, setName]               = useState(defaultName)
  const [unit, setUnit]               = useState('')
  const [category, setCategory]       = useState<TicketCategory | ''>('')
  const [subject, setSubject]         = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState<TicketPriority | ''>('')
  const [file, setFile]               = useState<File | null>(null)
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
      file
    )
    reset()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300" style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }} onClick={handleClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md mx-auto shadow-2xl flex flex-col transition-transform duration-300 safe-bottom" style={{ height: '92vh', transform: open ? 'translateY(0)' : 'translateY(100%)' }}>
        <div className="flex justify-center pt-3 flex-shrink-0"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">New Support Ticket</h2>
          <button onClick={handleClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

          {/* Name + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-700" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Unit / Lot *</label>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. 7" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-700" />
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
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary of the issue" className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-700" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail…" rows={4} className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-700 resize-none" />
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
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              style={file ? { borderColor: PRIMARY, color: PRIMARY, backgroundColor: '#f0f7f0' } : { borderColor: '#d1d5db', color: '#9ca3af' }}>
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

// ── Ticket Detail View (full-screen overlay) ──────────────────────────────

function TicketDetailView({
  ticket, currentUser, onBack, onComment,
}: {
  ticket: Ticket
  currentUser: string
  onBack: () => void
  onComment: (text: string) => void
}) {
  const [text, setText] = useState('')
  const catCfg = CATEGORY_CONFIG[ticket.category]
  const priCfg = PRIORITY_CONFIG[ticket.priority]
  const staCfg = STATUS_CONFIG[ticket.status]

  function handleSend() {
    if (!text.trim()) return
    onComment(text.trim())
    setText('')
  }

  return (
    <div className="fixed inset-0 z-30 bg-white flex flex-col safe-top">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-gray-100 bg-white flex-shrink-0">
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft size={22} color="#111" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-400">{ticket.ticketNumber}</p>
          <p className="text-sm font-bold text-gray-900 truncate">{ticket.subject}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Ticket summary */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex-shrink-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          <CategoryBadge category={ticket.category} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{ticket.description}</p>
        <p className="text-xs text-gray-400">
          {ticket.submittedBy} · Unit {ticket.unit} · {fmtDate(ticket.createdAt)}
        </p>
      </div>

      {/* History timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {ticket.history.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">
            Your ticket has been received. We'll update you here as soon as there's progress.
          </p>
        )}
        {ticket.history.map((entry) => {
          if (entry.type === 'status_change') {
            const toLabel = STATUS_CONFIG[entry.toStatus!].label
            return (
              <div key={entry.id} className="flex items-center gap-3 py-1">
                <div className="flex-1 border-t border-dashed border-gray-200" />
                <p className="text-[11px] text-gray-400 text-center flex-shrink-0 whitespace-nowrap">
                  Status → <strong className="text-gray-600">{toLabel}</strong> · {fmtDateTime(entry.createdAt)}
                </p>
                <div className="flex-1 border-t border-dashed border-gray-200" />
              </div>
            )
          }
          const isMine = entry.actor === currentUser
          return (
            <div key={entry.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                {!isMine && <p className="text-xs text-gray-400 mb-1 ml-1">{entry.actor}</p>}
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    isMine
                      ? { backgroundColor: PRIMARY, color: 'white', borderBottomRightRadius: 4 }
                      : { backgroundColor: '#f3f4f6', color: '#111827', borderBottomLeftRadius: 4 }
                  }
                >
                  {entry.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                  {fmtDateTime(entry.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply input */}
      {ticket.status !== 'closed' && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2 items-end safe-bottom">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment or reply…"
            rows={1}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-700 resize-none"
            style={{ maxHeight: 96 }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      )}
      {ticket.status === 'closed' && (
        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 safe-bottom">
          <p className="text-xs text-gray-400 text-center">This ticket is closed and no longer accepts comments.</p>
        </div>
      )}
    </div>
  )
}

// ── Ticket Card ───────────────────────────────────────────────────────────

function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const cat = CATEGORY_CONFIG[ticket.category]
  const commentCount = ticket.history.filter((h) => h.type === 'comment').length

  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex text-left active:opacity-80">
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: cat.color }} />
      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-gray-400 mb-0.5">{ticket.ticketNumber}</p>
            <p className="text-sm font-bold text-gray-900 leading-snug truncate">{ticket.subject}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 items-center">
            <CategoryBadge category={ticket.category} />
            <span className="text-[11px] text-gray-400">Unit {ticket.unit} · {fmtDate(ticket.createdAt)}</span>
          </div>
          {commentCount > 0 && (
            <span className="text-[11px] text-gray-400 flex-shrink-0">{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
      <div className="flex items-center pr-3">
        <ChevronRight size={16} color="#d1d5db" />
      </div>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const

export default function NeighbourSupportPage() {
  const navigate    = useNavigate()
  const user        = useAuthStore((s) => s.user)
  const displayName = getDisplayName(user)
  const { tickets: allTickets, submitTicket, addComment } = useTicketsStore()

  const [submitOpen,     setSubmitOpen]     = useState(false)
  const [selectedId,     setSelectedId]     = useState<string | null>(null)
  const [search,         setSearch]         = useState('')
  const [catFilter,      setCatFilter]      = useState('')
  const [priFilter,      setPriFilter]      = useState('')
  const [statusFilter,   setStatusFilter]   = useState('')
  const { msg: toastMsg, visible: toastVisible, show: showToast } = useToast()

  // User only sees their own tickets
  const myTickets = allTickets.filter((t) => t.submittedBy === displayName)

  // Apply filters
  const filtered = myTickets
    .filter((t) => {
      if (catFilter    && t.category !== catFilter) return false
      if (priFilter    && t.priority !== priFilter) return false
      if (statusFilter && t.status   !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.subject.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false
      }
      return true
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // Status summary counts (across all my tickets, ignoring current filter)
  const counts = Object.fromEntries(
    STATUSES.map((s) => [s, myTickets.filter((t) => t.status === s).length])
  ) as Record<typeof STATUSES[number], number>

  const selectedTicket = selectedId ? (allTickets.find((t) => t.id === selectedId) ?? null) : null

  function handleSubmit(data: SubmitTicketData, _file: File | null) {
    const num = submitTicket(data)
    showToast(`${num} submitted successfully!`)
    setSubmitOpen(false)
  }

  const hasFilters = !!(search || catFilter || priFilter || statusFilter)

  return (
    <>
      {/* Ticket detail overlay */}
      {selectedTicket && (
        <TicketDetailView
          ticket={selectedTicket}
          currentUser={displayName}
          onBack={() => setSelectedId(null)}
          onComment={(text) => addComment(selectedTicket.id, displayName, text, false)}
        />
      )}

      <div className="min-h-svh flex flex-col bg-gray-50">

        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 safe-top">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
            <ArrowLeft size={22} color="#111" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Neighbour Support</h1>
              <p className="text-sm text-gray-500 mt-0.5">Report issues, make requests, and share ideas.</p>
            </div>
            <button
              onClick={() => setSubmitOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-white text-sm font-semibold flex-shrink-0"
              style={{ backgroundColor: PRIMARY }}
            >
              <Plus size={15} /> New Ticket
            </button>
          </div>

          {/* Status summary bar */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s]
              const active = statusFilter === s
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(active ? '' : s)}
                  className="flex flex-col items-center py-2.5 px-1 rounded-xl border-2 transition-colors"
                  style={{ borderColor: active ? cfg.color : '#e5e7eb', backgroundColor: active ? cfg.bg : 'white' }}
                >
                  <span className="text-xl font-bold leading-none" style={{ color: cfg.color }}>{counts[s]}</span>
                  <span className="text-[9px] font-bold text-center mt-0.5 leading-tight" style={{ color: cfg.color }}>
                    {cfg.label.toUpperCase()}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Filters */}
          <div className="space-y-2 mb-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets…"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 outline-none focus:border-green-700 bg-white"
              />
            </div>
            <div className="flex gap-2">
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-2 py-2 text-xs text-gray-700 bg-white outline-none">
                <option value="">All Categories</option>
                <option value="fault">Fault Report</option>
                <option value="request">General Request</option>
                <option value="complaint">Complaint</option>
                <option value="idea">Community Idea</option>
              </select>
              <select value={priFilter} onChange={(e) => setPriFilter(e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-2 py-2 text-xs text-gray-700 bg-white outline-none">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Ticket list */}
          {myTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center" style={{ backgroundColor: '#f0f7f0' }}>
                <Flag size={28} color={PRIMARY} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-gray-700">No tickets yet</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">Submit a ticket to report an issue or share an idea.</p>
              <button onClick={() => setSubmitOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold" style={{ backgroundColor: PRIMARY }}>
                <Plus size={15} /> New Ticket
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-gray-400">No tickets match your filters.</p>
              {hasFilters && (
                <button onClick={() => { setSearch(''); setCatFilter(''); setPriFilter(''); setStatusFilter('') }} className="mt-2 text-sm font-semibold" style={{ color: PRIMARY }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <TicketCard key={t.id} ticket={t} onClick={() => setSelectedId(t.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <SubmitTicketSheet
        open={submitOpen}
        defaultName={displayName}
        onClose={() => setSubmitOpen(false)}
        onSubmit={handleSubmit}
      />

      <Toast msg={toastMsg} visible={toastVisible} />
    </>
  )
}
