import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore, getDisplayName } from '@/store/authStore'
import CreatePostSheet from '@/components/CreatePostSheet'
import NewsCommentsSheet from '@/components/NewsCommentsSheet'
import type { CreatePostData } from '@/components/CreatePostSheet'
import { supabase } from '@/lib/supabase'

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

async function fetchNameMap(uids: string[]): Promise<Record<string, string>> {
  if (!uids.length) return {}
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', uids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]))
}

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

        <div className={`text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words ${!expanded && needsExpansion ? 'line-clamp-4' : ''}`}>
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

  const [posts, setPosts] = useState<NewsPost[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [commentPost, setCommentPost] = useState<NewsPost | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: postRows }, { data: commentRows }] = await Promise.all([
        supabase.from('news_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('news_comments').select('*').order('created_at', { ascending: true }),
      ])
      if (!postRows) return

      const comments = commentRows ?? []
      const uids = [...new Set([
        ...postRows.map((r) => r.author_id),
        ...comments.map((c) => c.author_id),
      ].filter(Boolean))]
      const nameMap = await fetchNameMap(uids)

      setPosts(postRows.map((p) => ({
        id:        p.id,
        author:    nameMap[p.author_id] ?? 'Unknown',
        title:     p.title ?? '',
        content:   p.content,
        imageUrl:  p.image_url ?? undefined,
        createdAt: p.created_at,
        comments:  comments
          .filter((c) => c.post_id === p.id)
          .map((c) => ({
            id:        c.id,
            author:    nameMap[c.author_id] ?? 'Unknown',
            text:      c.text,
            createdAt: c.created_at,
          })),
      })))
    }
    load()
  }, [])

  async function handleCreatePost(data: CreatePostData) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: row } = await supabase
      .from('news_posts')
      .insert({
        author_id: authUser.id,
        title:     data.title || null,
        content:   data.content,
        image_url: data.imageUrl || null,
      })
      .select()
      .single()

    if (!row) return
    const newPost: NewsPost = {
      id:        row.id,
      author:    displayName,
      title:     row.title ?? '',
      content:   row.content,
      imageUrl:  row.image_url ?? undefined,
      createdAt: row.created_at,
      comments:  [],
    }
    setPosts((prev) => [newPost, ...prev])
  }

  async function handleAddComment(postId: string, text: string) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data: row } = await supabase
      .from('news_comments')
      .insert({ post_id: postId, author_id: authUser.id, text })
      .select()
      .single()

    if (!row) return
    const comment: NewsComment = {
      id:        row.id,
      author:    displayName,
      text:      row.text,
      createdAt: row.created_at,
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

  async function handleDeleteComment(postId: string, commentId: string) {
    await supabase.from('news_comments').delete().eq('id', commentId)

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
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Newsfeed</h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Stay connected with everything happening at Ecovilla! Our community newsfeed shares
          updates, events, announcements, and stories from neighbours — keeping everyone in the loop.
        </p>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={15} />
            Create Post
          </button>
        </div>

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
