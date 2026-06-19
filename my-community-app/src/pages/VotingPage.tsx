import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Calendar, MessageCircle, Plus, Check, BarChart2 } from 'lucide-react'
import { useVotingStore } from '@/store/votingStore'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import CreatePollSheet, { type CreatePollData, type PollAudience } from '@/components/CreatePollSheet'
import PollCommentsSheet from '@/components/PollCommentsSheet'

const PRIMARY = '#243d20'

export type PollOption = { id: string; text: string; votes: number }
export type Comment    = { id: string; author: string; text: string; createdAt: string }
export type Poll = {
  id: string
  title: string
  description: string
  createdBy: string
  endsAt: string
  audience: PollAudience
  options: PollOption[]
  comments: Comment[]
}

function isPollActive(p: Poll) {
  return new Date(p.endsAt) > new Date()
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const INITIAL_POLLS: Poll[] = [
  {
    id: '1',
    title: 'Low Ropes Course',
    description:
      'Proposal to build a low ropes kids course on vacant lot #39 — creating a safe, engaging outdoor space where children can climb, balance, and develop confidence, coordination, and teamwork through fun physical challenges. Budget of $5000 for phase 1. Please see proposal for full details.',
    createdBy: 'Ian Spriggs',
    endsAt: '2026-04-18',
    audience: 'owners_only',
    options: [
      { id: 'a', text: 'Yes - I support building the ropes course',    votes: 1 },
      { id: 'b', text: 'No - I do not support building the course', votes: 1 },
    ],
    comments: [
      { id: 'c1', author: 'Jessica Scully', text: 'Great idea! The kids will love it.', createdAt: new Date(Date.now() - 3600000).toISOString() },
    ],
  },
]

// ── Poll card ──────────────────────────────────────────────────────────────

function PollCard({
  poll,
  myVote,
  userRole,
  onVote,
  onCommentOpen,
}: {
  poll: Poll
  myVote: string | undefined
  onVote: (pollId: string, optionId: string) => void
  onCommentOpen: (poll: Poll) => void
}) {
  const active = isPollActive(poll)
  const total = poll.options.reduce((s, o) => s + o.votes, 0)
  const hasVoted = !!myVote
  const [expanded, setExpanded] = useState(false)
  const MAX_DESC = 160

  const descTrimmed =
    poll.description.length > MAX_DESC && !expanded
      ? poll.description.slice(0, MAX_DESC) + '…'
      : poll.description

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">

      {/* Title + badges */}
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900 leading-snug">{poll.title}</h2>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={
              active
                ? { backgroundColor: '#e8f5e9', color: PRIMARY }
                : { backgroundColor: '#fee2e2', color: '#b91c1c' }
            }
          >
            {active ? 'Active' : 'Closed'}
          </span>
          {poll.audience === 'owners_only' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Owners only
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed">
        {descTrimmed}
        {poll.description.length > MAX_DESC && (
          <button
            onClick={() => setExpanded((x) => !x)}
            className="ml-1 text-sm font-medium"
            style={{ color: PRIMARY }}
          >
            {expanded ? 'less' : 'more'}
          </button>
        )}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
        <span className="flex items-center gap-1">
          <User size={13} />
          {poll.createdBy}
        </span>
        <span
          className="flex items-center gap-1 font-semibold"
          style={{ color: active ? PRIMARY : '#b91c1c' }}
        >
          <Calendar size={13} />
          {active ? 'Ends' : 'Closed'} {formatDate(poll.endsAt)}
        </span>
        <span className="flex items-center gap-1">
          <BarChart2 size={13} />
          {total} vote{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Options */}
      <div>
        <p className="text-xs font-bold text-gray-700 mb-2">Poll Options:</p>
        <div className="space-y-2">
          {poll.options.map((opt, i) => {
            const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0
            const isMyVote = myVote === opt.id
            const canVoteOnOption = active && !hasVoted

            return (
              <button
                key={opt.id}
                onClick={() => canVoteOnOption && onVote(poll.id, opt.id)}
                disabled={!canVoteOnOption}
                className="w-full text-left rounded-xl overflow-hidden relative transition-all"
                style={{
                  backgroundColor: isMyVote ? '#e8f5e9' : '#f3f4f6',
                  border: isMyVote ? `2px solid ${PRIMARY}` : '2px solid transparent',
                  cursor: canVoteOnOption ? 'pointer' : 'default',
                }}
              >
                {/* Progress bar fill (shown after voting) */}
                {hasVoted && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-xl transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isMyVote ? 'rgba(36,61,32,0.12)' : 'rgba(0,0,0,0.05)',
                    }}
                  />
                )}

                <div className="relative flex items-center gap-2 px-3 py-3">
                  {/* Number */}
                  <span className="text-xs text-gray-400 w-4 flex-shrink-0">{i + 1}.</span>

                  {/* Text */}
                  <span
                    className="flex-1 text-sm"
                    style={{ color: isMyVote ? PRIMARY : '#374151', fontWeight: isMyVote ? 600 : 400 }}
                  >
                    {opt.text}
                  </span>

                  {/* Right side */}
                  {hasVoted ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">{opt.votes} Vote{opt.votes !== 1 ? 's' : ''}</span>
                      <span className="text-xs font-bold" style={{ color: PRIMARY }}>{pct}%</span>
                      {isMyVote && <Check size={14} color={PRIMARY} />}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">{opt.votes} Vote{opt.votes !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {!active && !hasVoted && (
          <p className="text-xs text-gray-400 mt-2 text-center">This poll is closed.</p>
        )}
        {hasVoted && (
          <p className="text-xs text-center mt-2" style={{ color: PRIMARY }}>
            ✓ You voted on this poll
          </p>
        )}
      </div>

      {/* Comments button */}
      <button
        onClick={() => onCommentOpen(poll)}
        className="flex items-center gap-2 text-sm text-gray-500 pt-1"
      >
        <MessageCircle size={16} />
        <span>{poll.comments.length} comment{poll.comments.length !== 1 ? 's' : ''}</span>
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function VotingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const displayName = getDisplayName(user)
  const { votes, castVote } = useVotingStore()

  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS)
  const [createOpen, setCreateOpen] = useState(false)
  const [commentPoll, setCommentPoll] = useState<Poll | null>(null)

  function handleVote(pollId: string, optionId: string) {
    if (votes[pollId]) return                        // already voted
    castVote(pollId, optionId)                       // persist choice
    setPolls((prev) =>
      prev.map((p) =>
        p.id !== pollId ? p : {
          ...p,
          options: p.options.map((o) =>
            o.id === optionId ? { ...o, votes: o.votes + 1 } : o
          ),
        }
      )
    )
  }

  function handleCreatePoll(data: CreatePollData) {
    const newPoll: Poll = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      createdBy: displayName,
      endsAt: data.endsAt,
      audience: data.audience,
      options: data.options.map((text, i) => ({ id: String(i), text, votes: 0 })),
      comments: [],
    }
    setPolls((prev) => [newPoll, ...prev])
  }

  function handleAddComment(pollId: string, text: string) {
    const comment: Comment = {
      id: Date.now().toString(),
      author: displayName,
      text,
      createdAt: new Date().toISOString(),
    }
    setPolls((prev) =>
      prev.map((p) =>
        p.id !== pollId ? p : { ...p, comments: [...p.comments, comment] }
      )
    )
    // Keep comment sheet open with updated poll
    setCommentPoll((prev) =>
      prev?.id === pollId ? { ...prev, comments: [...prev.comments, comment] } : prev
    )
  }

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
        <div className="flex items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Community Polls &amp; Voting</h1>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Have your say! Our voting and poll page lets neighbours make decisions together,
          and help shape the future of our community.
        </p>

        {/* Create button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={16} />
            Create Poll
          </button>
        </div>

        {/* Poll list */}
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              myVote={votes[poll.id]}
              onVote={handleVote}
              onCommentOpen={setCommentPoll}
            />
          ))}
        </div>
      </div>

      <CreatePollSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreatePoll}
      />

      <PollCommentsSheet
        poll={commentPoll}
        onClose={() => setCommentPoll(null)}
        onAddComment={handleAddComment}
      />
    </div>
  )
}
