import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MessageCircle, ChevronDown, ChevronUp, Clock, XCircle, FileEdit, CheckCircle, ClipboardList } from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import CreateProposalSheet from '@/components/CreateProposalSheet'
import ProposalCommentsSheet from '@/components/ProposalCommentsSheet'
import type { ProposalFormData } from '@/components/CreateProposalSheet'

const PRIMARY = '#243d20'

export type ProposalComment = {
  id: string
  author: string
  text: string
  createdAt: string
}

export type Proposal = {
  id: string
  author: string
  authorId: string
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
  photoUrl?: string
  photoPath?: string
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  comments: ProposalComment[]
}

const STATUS_CFG: Record<Proposal['status'], { label: string; bg: string; color: string }> = {
  draft:    { label: 'Draft',          bg: '#f3f4f6', color: '#6b7280' },
  pending:  { label: 'Pending Review', bg: '#fef3c7', color: '#92400e' },
  approved: { label: 'Approved',       bg: '#d1fae5', color: '#065f46' },
  rejected: { label: 'Rejected',       bg: '#fee2e2', color: '#991b1b' },
}

async function fetchNameMap(uids: string[]): Promise<Record<string, string>> {
  if (!uids.length) return {}
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', uids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]))
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Proposal card ──────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  currentUserId,
  currentUser,
  onCommentOpen,
  onEdit,
  onSubmitDraft,
}: {
  proposal: Proposal
  currentUserId: string
  currentUser: string
  onCommentOpen: (p: Proposal) => void
  onEdit: (p: Proposal) => void
  onSubmitDraft: (p: Proposal) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isOwner = proposal.authorId === currentUserId
  const cfg = STATUS_CFG[proposal.status]
  const needsExpansion = proposal.description.length > 220

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

      {/* Card header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
          style={{ backgroundColor: PRIMARY }}
        >
          {proposal.author.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 leading-tight">{proposal.author}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(proposal.createdAt)}</p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Category + title + body */}
      <div className="px-4 pb-3">
        <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 mb-2">
          {proposal.category}
        </span>
        <h2 className="text-base font-bold text-gray-900 leading-snug mb-1.5">{proposal.title}</h2>
        <div className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words ${!expanded && needsExpansion ? 'line-clamp-4' : ''}`}>
          {proposal.description}
        </div>
        {needsExpansion && (
          <button
            onClick={() => setExpanded((x) => !x)}
            className="flex items-center gap-0.5 mt-1.5 text-sm font-semibold"
            style={{ color: PRIMARY }}
          >
            {expanded
              ? <><ChevronUp size={15} /> Show less</>
              : <><ChevronDown size={15} /> Show more</>}
          </button>
        )}
      </div>

      {/* Photo */}
      {proposal.photoUrl && (
        <img src={proposal.photoUrl} alt="" className="w-full object-cover max-h-72" />
      )}

      {/* Owner-only status notes */}
      {isOwner && proposal.status === 'pending' && (
        <div className="mx-4 mb-3 flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Clock size={13} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">Awaiting admin approval before going public</p>
        </div>
      )}
      {isOwner && proposal.status === 'rejected' && (
        <div className="mx-4 mb-3 flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <XCircle size={13} className="text-red-600 flex-shrink-0" />
          <p className="text-xs text-red-700">Not approved. You can edit and resubmit.</p>
        </div>
      )}

      <div className="border-t border-gray-100 mx-4" />

      {/* Action row */}
      <div className="px-4 py-3 flex gap-2">
        {proposal.status === 'approved' && (
          <button
            onClick={() => onCommentOpen(proposal)}
            className="flex-1 flex items-center gap-2 text-sm text-gray-500"
          >
            <MessageCircle size={16} />
            <span>
              {proposal.comments.length > 0
                ? `${proposal.comments.length} comment${proposal.comments.length !== 1 ? 's' : ''}`
                : 'Add a comment'}
            </span>
          </button>
        )}

        {isOwner && (proposal.status === 'draft' || proposal.status === 'rejected') && (
          <>
            <button
              onClick={() => onEdit(proposal)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700"
            >
              <FileEdit size={14} /> Edit
            </button>
            <button
              onClick={() => onSubmitDraft(proposal)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: PRIMARY }}
            >
              <CheckCircle size={14} /> Submit
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const navigate      = useNavigate()
  const user          = useAuthStore((s) => s.user)
  const displayName   = getDisplayName(user)
  const userId        = user?.id ?? ''

  const [proposals,        setProposals]        = useState<Proposal[]>([])
  const [createOpen,       setCreateOpen]       = useState(false)
  const [editingProposal,  setEditingProposal]  = useState<Proposal | null>(null)
  const [commentProposal,  setCommentProposal]  = useState<Proposal | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: rows }, { data: commentRows }] = await Promise.all([
      supabase.from('proposals').select('*').order('created_at', { ascending: false }),
      supabase.from('proposal_comments').select('*').order('created_at', { ascending: true }),
    ])
    if (!rows) return

    const comments = commentRows ?? []
    const uids = [...new Set([
      ...rows.map((r) => r.created_by),
      ...comments.map((c) => c.author_id),
    ].filter(Boolean))]
    const nameMap = await fetchNameMap(uids)

    setProposals(rows.map((r) => ({
      id:                 r.id,
      author:             nameMap[r.created_by] ?? 'Unknown',
      authorId:           r.created_by,
      category:           r.category,
      title:              r.title,
      description:        r.description,
      supporters:         r.supporters ?? '',
      problemSolution:    r.problem_solution ?? '',
      implementationTeam: r.implementation_team ?? '',
      implementationPlan: r.implementation_plan ?? '',
      timeline:           r.timeline ?? '',
      longTermManagement: r.long_term_management ?? '',
      costs:              r.costs ?? '',
      photoUrl:           r.photo_url ?? undefined,
      photoPath:          r.photo_path ?? undefined,
      status:             r.status as Proposal['status'],
      createdAt:          r.created_at,
      comments:           comments
        .filter((c) => c.proposal_id === r.id)
        .map((c) => ({
          id:        c.id,
          author:    nameMap[c.author_id] ?? 'Unknown',
          text:      c.text,
          createdAt: c.created_at,
        })),
    })))
  }

  async function uploadPhoto(file: File, uid: string): Promise<{ url: string; path: string } | null> {
    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${uid}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('proposal-images').upload(path, file)
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('proposal-images').getPublicUrl(path)
    return { url: publicUrl, path }
  }

  async function persistProposal(data: ProposalFormData, status: 'draft' | 'pending') {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    let photoUrl  = editingProposal?.photoUrl
    let photoPath = editingProposal?.photoPath
    if (data.photo) {
      const uploaded = await uploadPhoto(data.photo, authUser.id)
      if (uploaded) { photoUrl = uploaded.url; photoPath = uploaded.path }
    }

    const payload = {
      category:             data.category,
      title:                data.title,
      description:          data.description,
      supporters:           data.supporters || null,
      problem_solution:     data.problemSolution || null,
      implementation_team:  data.implementationTeam || null,
      implementation_plan:  data.implementationPlan || null,
      timeline:             data.timeline || null,
      long_term_management: data.longTermManagement || null,
      costs:                data.costs || null,
      photo_url:            photoUrl ?? null,
      photo_path:           photoPath ?? null,
      status,
      updated_at:           new Date().toISOString(),
    }

    if (editingProposal) {
      await supabase.from('proposals').update(payload).eq('id', editingProposal.id)
      setEditingProposal(null)
      await load()
    } else {
      const { data: row } = await supabase
        .from('proposals')
        .insert({ ...payload, created_by: authUser.id })
        .select()
        .single()
      if (!row) return
      const newP: Proposal = {
        id:                 row.id,
        author:             displayName,
        authorId:           authUser.id,
        category:           row.category,
        title:              row.title,
        description:        row.description,
        supporters:         row.supporters ?? '',
        problemSolution:    row.problem_solution ?? '',
        implementationTeam: row.implementation_team ?? '',
        implementationPlan: row.implementation_plan ?? '',
        timeline:           row.timeline ?? '',
        longTermManagement: row.long_term_management ?? '',
        costs:              row.costs ?? '',
        photoUrl:           row.photo_url ?? undefined,
        photoPath:          row.photo_path ?? undefined,
        status,
        createdAt:          row.created_at,
        comments:           [],
      }
      setProposals((prev) => [newP, ...prev])
    }
  }

  async function handleSubmitDraft(proposal: Proposal) {
    await supabase.from('proposals').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', proposal.id)
    setProposals((prev) =>
      prev.map((p) => p.id !== proposal.id ? p : { ...p, status: 'pending' })
    )
  }

  async function handleAddComment(proposalId: string, text: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    const { data: row } = await supabase
      .from('proposal_comments')
      .insert({ proposal_id: proposalId, author_id: authUser.id, text })
      .select()
      .single()
    if (!row) return
    const comment: ProposalComment = { id: row.id, author: displayName, text: row.text, createdAt: row.created_at }
    setProposals((prev) =>
      prev.map((p) => p.id !== proposalId ? p : { ...p, comments: [...p.comments, comment] })
    )
    setCommentProposal((prev) =>
      prev?.id === proposalId ? { ...prev, comments: [...prev.comments, comment] } : prev
    )
  }

  async function handleDeleteComment(proposalId: string, commentId: string) {
    await supabase.from('proposal_comments').delete().eq('id', commentId)
    setProposals((prev) =>
      prev.map((p) => p.id !== proposalId ? p : { ...p, comments: p.comments.filter((c) => c.id !== commentId) })
    )
    setCommentProposal((prev) =>
      prev?.id === proposalId
        ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }
        : prev
    )
  }

  function handleEdit(proposal: Proposal) {
    setEditingProposal(proposal)
    setCreateOpen(true)
  }

  function handleCreateOpen() {
    setEditingProposal(null)
    setCreateOpen(true)
  }

  const initialForEdit: Partial<ProposalFormData> | undefined = editingProposal
    ? {
        category:           editingProposal.category,
        title:              editingProposal.title,
        description:        editingProposal.description,
        supporters:         editingProposal.supporters,
        problemSolution:    editingProposal.problemSolution,
        implementationTeam: editingProposal.implementationTeam,
        implementationPlan: editingProposal.implementationPlan,
        timeline:           editingProposal.timeline,
        longTermManagement: editingProposal.longTermManagement,
        costs:              editingProposal.costs,
        photo:              null,
        existingPhotoUrl:   editingProposal.photoUrl,
      }
    : undefined

  return (
    <div className="min-h-svh flex flex-col bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 safe-top">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
          <ArrowLeft size={22} color="#111" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Proposals</h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Submit ideas and initiatives for the community. Approved proposals are visible and open for discussion by all residents.
        </p>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleCreateOpen}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={15} />
            New Proposal
          </button>
        </div>

        {/* List */}
        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList size={40} color="#d1d5db" strokeWidth={1} className="mb-3" />
            <p className="text-sm text-gray-400">No proposals yet. Be the first to submit one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => (
              <ProposalCard
                key={p.id}
                proposal={p}
                currentUserId={userId}
                currentUser={displayName}
                onCommentOpen={setCommentProposal}
                onEdit={handleEdit}
                onSubmitDraft={handleSubmitDraft}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProposalSheet
        open={createOpen}
        onClose={() => { setCreateOpen(false); setEditingProposal(null) }}
        onSaveDraft={(data) => persistProposal(data, 'draft')}
        onSubmit={(data) => persistProposal(data, 'pending')}
        initial={initialForEdit}
      />

      <ProposalCommentsSheet
        proposal={commentProposal}
        currentUser={displayName}
        onClose={() => setCommentProposal(null)}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  )
}
