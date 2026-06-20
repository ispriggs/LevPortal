import { useState } from 'react'
import { X, Trash2, Send } from 'lucide-react'
import type { Proposal, ProposalComment } from '@/pages/ProposalsPage'

const PRIMARY = '#243d20'

interface Props {
  proposal: Proposal | null
  currentUser: string
  onClose: () => void
  onAddComment: (proposalId: string, text: string) => void
  onDeleteComment: (proposalId: string, commentId: string) => void
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ProposalCommentsSheet({
  proposal, currentUser, onClose, onAddComment, onDeleteComment,
}: Props) {
  const [text, setText] = useState('')

  function handleSend() {
    if (!text.trim() || !proposal) return
    onAddComment(proposal.id, text.trim())
    setText('')
  }

  const open = !!proposal
  const isCreator = proposal?.author === currentUser

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
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            Comments {proposal && proposal.comments.length > 0 && `(${proposal.comments.length})`}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        {isCreator && (
          <p className="px-6 py-2 text-xs text-gray-400 bg-gray-50 flex-shrink-0">
            You can remove any comment on your proposal.
          </p>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3 space-y-3">
          {proposal && proposal.comments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No comments yet. Be the first to comment!
            </p>
          )}
          {proposal?.comments.map((c: ProposalComment) => (
            <div key={c.id} className="flex gap-3 group">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xs"
                style={{ backgroundColor: PRIMARY }}
              >
                {c.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">{c.author}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{c.text}</p>
              </div>
              {isCreator && (
                <button
                  onClick={() => proposal && onDeleteComment(proposal.id, c.id)}
                  className="text-gray-300 p-1 self-start flex-shrink-0 opacity-0 group-hover:opacity-100 active:opacity-100"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div
          className="flex-shrink-0 px-4 pt-3 border-t border-gray-100 flex gap-2 items-end"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            rows={1}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700 resize-none"
            style={{ maxHeight: '96px' }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = el.scrollHeight + 'px'
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </>
  )
}

