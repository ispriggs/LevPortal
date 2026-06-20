import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, User, Eye, Calendar, Trash2, FileText, CheckCircle } from 'lucide-react'
import { useAuthStore, getDisplayName, getRole } from '@/store/authStore'
import UploadDocumentSheet, {
  FOLDERS, FOLDER_COLORS,
  type DocFolder, type DocAccess, type UploadDocData,
} from '@/components/UploadDocumentSheet'
import { supabase } from '@/lib/supabase'

const PRIMARY = '#243d20'

type DocStatus = 'approved' | 'pending'

export type CommunityDoc = {
  id: string
  title: string
  folder: DocFolder
  access: DocAccess
  status: DocStatus
  uploadedBy: string
  uploadedAt: string
  fileUrl: string
  filePath: string
}

async function fetchNameMap(uids: string[]): Promise<Record<string, string>> {
  if (!uids.length) return {}
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', uids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]))
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// â”€â”€ Document card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DocCard({
  doc,
  canDelete,
  onView,
  onDelete,
}: {
  doc: CommunityDoc
  canDelete: boolean
  onView: (doc: CommunityDoc) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-400 p-4 space-y-2.5">

      <h2 className="text-base font-bold text-gray-900 leading-snug">{doc.title}</h2>

      {/* Folder color bar */}
      <div
        className="h-1 rounded-full w-28"
        style={{ backgroundColor: FOLDER_COLORS[doc.folder] }}
      />

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <User size={14} strokeWidth={1.5} />
          {doc.uploadedBy}
        </span>
        <span className="flex items-center gap-1.5">
          <Eye size={14} strokeWidth={1.5} />
          {doc.access === 'owners_only' ? 'Owners' : 'All Residents'}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar size={14} strokeWidth={1.5} />
          {formatDateTime(doc.uploadedAt)}
        </span>
      </div>


      {/* View button */}
      <button
        onClick={() => onView(doc)}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: PRIMARY }}
      >
        <Eye size={15} />
        View Document
      </button>

      {/* Delete â€” uploader or owner */}
      {canDelete && (
        <button
          onClick={() => onDelete(doc.id)}
          className="w-full py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-600 flex items-center justify-center gap-2"
        >
          <Trash2 size={15} />
          Delete
        </button>
      )}
    </div>
  )
}

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DocumentsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const displayName = getDisplayName(user)
  const isOwner = getRole(user) === 'owner'
  const isRenter = !isOwner

  const [docs, setDocs] = useState<CommunityDoc[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadedPending, setUploadedPending] = useState(false)
  const [titleFilter, setTitleFilter] = useState('')
  const [folderFilter, setFolderFilter] = useState('')

  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from('documents')
        .select('*')
        .eq('status', 'approved')
        .order('uploaded_at', { ascending: false })
      if (!rows) return

      const uids = [...new Set(rows.map((r) => r.uploaded_by).filter(Boolean))]
      const nameMap = await fetchNameMap(uids)

      setDocs(rows.map((r) => ({
        id: r.id,
        title: r.title,
        folder: r.folder as DocFolder,
        access: r.access as DocAccess,
        status: r.status as DocStatus,
        uploadedBy: nameMap[r.uploaded_by] ?? 'Unknown',
        uploadedAt: r.uploaded_at,
        fileUrl: r.file_url,
        filePath: r.file_path,
      })))
    }
    load()
  }, [])

  const visibleDocs = docs.filter((doc) => {
    if (doc.access === 'owners_only' && isRenter) return false
    if (titleFilter && !doc.title.toLowerCase().includes(titleFilter.toLowerCase())) return false
    if (folderFilter && doc.folder !== folderFilter) return false
    return true
  })

  async function handleUpload(data: UploadDocData) {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const ext = data.file.name.split('.').pop() ?? 'pdf'
    const path = `${authUser.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(path, data.file)

    if (uploadError) return

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

    const { data: row } = await supabase
      .from('documents')
      .insert({
        title: data.title,
        folder: data.folder,
        access: data.access,
        status: 'pending',
        uploaded_by: authUser.id,
        file_url: publicUrl,
        file_path: path,
      })
      .select()
      .single()

    if (!row) return
    setUploadedPending(true)
    setTimeout(() => setUploadedPending(false), 5000)
  }

  async function handleView(doc: CommunityDoc) {
    if (!doc.filePath) return

    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(doc.filePath, 60 * 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  async function handleDelete(id: string) {
    const doc = docs.find((d) => d.id === id)
    if (!doc) return

    await Promise.all([
      supabase.from('documents').delete().eq('id', id),
      doc.filePath
        ? supabase.storage.from('documents').remove([doc.filePath])
        : Promise.resolve(),
    ])
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  // Unique folders in the current visible set for the folder filter
  const availableFolders = FOLDERS.filter((f) => docs.some((d) => d.folder === f))

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 safe-top">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
          <ArrowLeft size={32} color="#111" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-6">

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Community Documents</h1>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          All your important community documents in one place! Access HOA rules, meeting minutes,
          forms, and resources whenever you need them.
        </p>
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: PRIMARY }}
          >
            <Upload size={15} />
            Upload
          </button>
        </div>

        {uploadedPending && (
          <div className="flex items-center gap-2.5 px-4 py-3 mb-4 rounded-xl bg-green-50 border border-green-200">
            <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">Document submitted â€” it will appear here once approved by an admin.</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-400 p-4 mb-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Filter by Title:</label>
            <input
              type="text"
              placeholder="All Titles"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-base text-gray-700 outline-none focus:border-green-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Filter by Folder:</label>
            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-green-700"
            >
              <option value="">All Folders</option>
              {availableFolders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Document list */}
        {visibleDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText size={40} color="#d1d5db" strokeWidth={1} className="mb-3" />
            <p className="text-sm text-gray-400">No documents found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleDocs.map((doc) => (
              <DocCard
                key={doc.id}
                doc={doc}
                canDelete={isAdmin || (isOwner && doc.uploadedBy === displayName)}
                onView={handleView}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <UploadDocumentSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSave={handleUpload}
      />
    </div>
  )
}

