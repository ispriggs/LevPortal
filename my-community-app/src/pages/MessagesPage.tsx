import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, MessageSquare, ChevronRight } from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import { useMessagesStore, type MessageThread } from '@/store/messagesStore'

const PRIMARY = '#243d20'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Thread view (full-screen overlay) ────────────────────────────────────

function ThreadView({
  thread,
  currentUser,
  onBack,
  onReply,
}: {
  thread: MessageThread
  currentUser: string
  onBack: () => void
  onReply: (threadId: string, text: string) => void
}) {
  const [text, setText] = useState('')

  function handleSend() {
    if (!text.trim()) return
    onReply(thread.id, text.trim())
    setText('')
  }

  const other = thread.participants.find((p) => p !== currentUser) ?? thread.participants[0]

  return (
    <div className="fixed inset-0 z-30 bg-white flex flex-col safe-top">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gray-100 bg-white flex-shrink-0">
        <button onClick={onBack} className="p-1 -ml-1"><ArrowLeft size={22} color="#111" /></button>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{other}</p>
          <p className="text-xs text-gray-400 truncate">{thread.subject}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.messages.map((msg) => {
          const isMine = msg.from === currentUser
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                {!isMine && (
                  <p className="text-xs text-gray-400 mb-1 ml-1">{msg.from}</p>
                )}
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    isMine
                      ? { backgroundColor: PRIMARY, color: 'white', borderBottomRightRadius: 4 }
                      : { backgroundColor: '#f3f4f6', color: '#111827', borderBottomLeftRadius: 4 }
                  }
                >
                  {msg.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                  {timeAgo(msg.sentAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reply input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 flex gap-2 items-end safe-bottom">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply…"
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
    </div>
  )
}

// ── Inbox list ─────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const navigate     = useNavigate()
  const user         = useAuthStore((s) => s.user)
  const currentUser  = getDisplayName(user)
  const { threads, reply, fetchThreads } = useMessagesStore()

  useEffect(() => { fetchThreads() }, [])

  const [openThread, setOpenThread] = useState<MessageThread | null>(null)

  // Only show threads where current user is a participant
  const myThreads = threads.filter((t) => t.participants.includes(currentUser))

  function handleReply(threadId: string, text: string) {
    reply(threadId, currentUser, text)
    // Keep openThread in sync
    setOpenThread((prev) =>
      prev?.id === threadId
        ? { ...prev, messages: [...prev.messages, { id: `${Date.now()}m`, from: currentUser, text, sentAt: new Date().toISOString() }] }
        : prev
    )
  }

  return (
    <>
      {/* Thread view overlay */}
      {openThread && (
        <ThreadView
          thread={openThread}
          currentUser={currentUser}
          onBack={() => setOpenThread(null)}
          onReply={handleReply}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Messages</h1>
          <p className="text-sm text-gray-500 mb-5">Your conversations with the admin team.</p>

          {myThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <MessageSquare size={40} color="#d1d5db" strokeWidth={1} className="mb-3" />
              <p className="text-sm text-gray-400">No messages yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Messages from the admin team will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {myThreads
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((thread) => {
                  const last = thread.messages[thread.messages.length - 1]
                  const other = thread.participants.find((p) => p !== currentUser) ?? thread.participants[0]
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setOpenThread(thread)}
                      className="w-full bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 text-left"
                    >
                      {/* Avatar */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
                        style={{ backgroundColor: PRIMARY }}
                      >
                        {other.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-bold text-gray-900 truncate">{other}</p>
                          <p className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(last.sentAt)}</p>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{thread.subject}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{last.text}</p>
                      </div>

                      <ChevronRight size={16} color="#d1d5db" className="flex-shrink-0" />
                    </button>
                  )
                })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
