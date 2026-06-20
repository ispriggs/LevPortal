import { useState, useRef, useEffect } from 'react'
import { X, Send } from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import type { Poll, Comment } from '@/pages/VotingPage'

const PRIMARY = '#243d20'

interface Props {
  poll: Poll | null
  onClose: () => void
  onAddComment: (pollId: string, text: string) => void
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function PollCommentsSheet({ poll, onClose, onAddComment }: Props) {
  const isOpen = poll !== null
  const [text, setText] = useState('')
  const user = useAuthStore((s) => s.user)
  const displayName = getDisplayName(user)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [poll?.comments.length, isOpen])

  function handleSend() {
    if (!text.trim() || !poll) return
    onAddComment(poll.id, text.trim())
    setText('')
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md mx-auto shadow-2xl flex flex-col transition-transform duration-300 safe-bottom"
        style={{ maxHeight: '70vh', minHeight: '40vh', transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Comments</h2>
            {poll && <p className="text-xs text-gray-400 truncate max-w-[220px]">{poll.title}</p>}
          </div>
          <button onClick={onClose} className="p-1 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Comments list */}
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-4">
          {poll?.comments.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-6">No comments yet. Be the first!</p>
          )}
          {poll?.comments.map((c: Comment) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="white" width="14" height="14">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">{c.author}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 pt-3 border-t border-gray-100 flex gap-2 items-center" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={`Comment as ${displayName}…`}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-base text-gray-900 outline-none focus:border-green-700"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </>
  )
}
