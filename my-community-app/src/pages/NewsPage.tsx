import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import CreatePostSheet from '@/components/CreatePostSheet'
import NewsCommentsSheet from '@/components/NewsCommentsSheet'
import type { CreatePostData } from '@/components/CreatePostSheet'

const PRIMARY = '#243d20'

export type NewsComment = {
  id: string
  author: string
  text: string
  createdAt: string
}

export type NewsPost = {
  id: string
  author: string
  title: string
  content: string
  imageUrl?: string
  createdAt: string
  comments: NewsComment[]
}

const INITIAL_POSTS: NewsPost[] = [
  {
    id: '1',
    author: 'Chantelle Spriggs',
    title: 'LEV Talent Show',
    content: `Hi dear neighbors! The Culture Circle is excited to announce the revival of LEV's talent shows!!!

We invite you to save the date & pre-register using the form in the community WhatsApp group 👇

This is an all-ages event and will also be open to the whole valley!

We are also looking for:
- Any musicians willing to offer their skills to support young singers
- A microphone
- Speakers
- Extra chairs for the event

PM me if you want to offer any equipment or skills for any of the above! Let's make this a wonderful community event together. 🎉`,
    createdAt: '2026-05-20T10:00:00Z',
    comments: [
      {
        id: 'c1',
        author: 'Ian Spriggs',
        text: 'Such a great initiative! We\'ll definitely be there.',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
  },
  {
    id: '2',
    author: 'Jessica Scully',
    title: 'Weekend Trail Clean-Up',
    content: `Reminder that this Saturday we are organising a trail clean-up starting at 8am at the main entrance.

Bring gloves, bags, and water. Should take about 2 hours and we'll have coffee and snacks ready afterwards for everyone who joins.

All welcome — the more the merrier!`,
    createdAt: '2026-05-18T08:30:00Z',
    comments: [],
  },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// ── Post card ──────────────────────────────────────────────────────────────

function PostCard({
  post,
  onCommentOpen,
}: {
  post: NewsPost
  onCommentOpen: (post: NewsPost) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const needsExpansion = post.content.length > 220 || post.content.split('\n').length > 4

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

      {/* Card header — avatar, name, date */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
          style={{ backgroundColor: PRIMARY }}
        >
          {post.author.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">{post.author}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(post.createdAt)}</p>
        </div>
      </div>

      {/* Post body */}
      <div className="px-4 pb-3">
        {post.title && (
          <h2 className="text-base font-bold text-gray-900 mb-1.5 leading-snug">{post.title}</h2>
        )}

        <div className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap ${!expanded && needsExpansion ? 'line-clamp-4' : ''}`}>
          {post.content}
        </div>

        {needsExpansion && (
          <button
            onClick={() => setExpanded((x) => !x)}
            className="flex items-center gap-0.5 mt-1.5 text-sm font-semibold"
            style={{ color: PRIMARY }}
          >
            {expanded ? (
              <><ChevronUp size={15} /> Show less</>
            ) : (
              <><ChevronDown size={15} /> Show more</>
            )}
          </button>
        )}
      </div>

      {/* Image — always visible, text expands above it */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt=""
          className="w-full object-cover max-h-72"
        />
      )}

      {/* Divider */}
      <div className="border-t border-gray-100 mx-4" />

      {/* Comments row */}
      <button
        onClick={() => onCommentOpen(post)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-500 text-left"
      >
        <MessageCircle size={16} />
        <span>
          {post.comments.length > 0
            ? `${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}`
            : 'Add a comment'}
        </span>
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const displayName = getDisplayName(user)

  const [posts, setPosts] = useState<NewsPost[]>(INITIAL_POSTS)
  const [createOpen, setCreateOpen] = useState(false)
  const [commentPost, setCommentPost] = useState<NewsPost | null>(null)

  function handleCreatePost(data: CreatePostData) {
    const newPost: NewsPost = {
      id: Date.now().toString(),
      author: displayName,
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
      createdAt: new Date().toISOString(),
      comments: [],
    }
    setPosts((prev) => [newPost, ...prev])
  }

  function handleAddComment(postId: string, text: string) {
    const comment: NewsComment = {
      id: Date.now().toString(),
      author: displayName,
      text,
      createdAt: new Date().toISOString(),
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId ? p : { ...p, comments: [...p.comments, comment] }
      )
    )
    setCommentPost((prev) =>
      prev?.id === postId ? { ...prev, comments: [...prev.comments, comment] } : prev
    )
  }

  function handleDeleteComment(postId: string, commentId: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId ? p : { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
      )
    )
    setCommentPost((prev) =>
      prev?.id === postId
        ? { ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }
        : prev
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
          <h1 className="text-2xl font-bold text-gray-900">Community Newsfeed</h1>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={15} />
            Create Post
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Stay connected with everything happening at Ecovilla! Our community newsfeed shares
          updates, events, announcements, and stories from neighbours — keeping everyone in the loop.
        </p>

        {/* Post list */}
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onCommentOpen={setCommentPost}
            />
          ))}
        </div>
      </div>

      <CreatePostSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreatePost}
      />

      <NewsCommentsSheet
        post={commentPost}
        currentUser={displayName}
        onClose={() => setCommentPost(null)}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />
    </div>
  )
}
