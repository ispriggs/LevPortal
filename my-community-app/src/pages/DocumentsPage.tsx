import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, User, Eye, Calendar, Trash2, FileText, Clock } from 'lucide-react'
import { useAuthStore, getDisplayName, getRole } from '@/store/authStore'
import UploadDocumentSheet, {
  FOLDERS, FOLDER_COLORS,
  type DocFolder, type DocAccess, type UploadDocData,
} from '@/components/UploadDocumentSheet'

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
}

const MOCK_DOCS: CommunityDoc[] = [
  {
    id: '1',
    title: 'Board Meeting Minutes June 19, 2026',
    folder: 'Meeting Records',
    access: 'owners_only',
    status: 'approved',
    uploadedBy: 'John Leonard',
    uploadedAt: '2026-06-19T11:43:00Z',
    fileUrl: '',
  },
  {
    id: '2',
    title: 'Water Test June 2026',
    folder: 'Maintenance & Projects',
    access: 'owners_only',
    status: 'approved',
    uploadedBy: 'Robert Faulstich',
    uploadedAt: '2026-06-19T10:42:00Z',
    fileUrl: '',
  },
  {
    id: '3',
    title: 'Ecovilla Rules & Regulations 2026',
    folder: 'Governing Documents',
    access: 'all',
    status: 'approved',
    uploadedBy: 'Ian Spriggs',
    uploadedAt: '2026-05-01T09:00:00Z',
    fileUrl: '',
  },
  {
    id: '4',
    title: 'Community Budget Q1 2026',
    folder: 'Financial',
    access: 'owners_only',
    status: 'approved',
    uploadedBy: 'Ian Spriggs',
    uploadedAt: '2026-04-15T14:00:00Z',
    fileUrl: '',
  },
]

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Document card ─────────────────────────────────────────────────────────

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
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2.5">

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

      {/* Pending badge */}
      {doc.status === 'pending' && (
        <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <Clock size={14} className="text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700 font-medium">Pending admin approval</p>
        </div>
      )}

      {/* View button */}
      <button
        onClick={() => onView(doc)}
        className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
        style={{ backgroundColor: PRIMARY }}
      >
        <Eye size={15} />
        View Document
      </button>

      {/* Delete — uploader or owner */}
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

// ── Page ──────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const displayName = getDisplayName(user)
  const isOwner = getRole(user) === 'owner'
  const isRenter = !isOwner

  const [docs, setDocs] = useState<CommunityDoc[]>(MOCK_DOCS)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [titleFilter, setTitleFilter] = useState('')
  const [folderFilter, setFolderFilter] = useState('')

  // Visibility: owners_only hidden from renters; pending hidden from non-uploaders
  const visibleDocs = docs.filter((doc) => {
    if (doc.access === 'owners_only' && isRenter) return false
    if (doc.status === 'pending' && doc.uploadedBy !== displayName && !isOwner) return false
    if (titleFilter && !doc.title.toLowerCase().includes(titleFilter.toLowerCase())) return false
    if (folderFilter && doc.folder !== folderFilter) return false
    return true
  })

  function handleUpload(data: UploadDocData) {
    const newDoc: CommunityDoc = {
      id: Date.now().toString(),
      title: data.title,
      folder: data.folder,
      access: data.access,
      status: 'pending',
      uploadedBy: displayName,
      uploadedAt: new Date().toISOString(),
      fileUrl: URL.createObjectURL(data.file),
    }
    setDocs((prev) => [newDoc, ...prev])
  }

  function handleView(doc: CommunityDoc) {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank')
    } else {
      alert('Document preview not available in demo mode. Connect Supabase storage to enable real files.')
    }
  }

  function handleDelete(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  // Unique folders in the current visible set for the folder filter
  const availableFolders = FOLDERS.filter((f) => docs.some((d) => d.folder === f))

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
          <h1 className="text-2xl font-bold text-gray-900">Community Documents</h1>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-white text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: PRIMARY }}
          >
            <Upload size={15} />
            Upload
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          All your important community documents in one place! Access HOA rules, meeting minutes,
          forms, and resources whenever you need them.
        </p>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Filter by Title:</label>
            <input
              type="text"
              placeholder="All Titles"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-green-700"
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
                canDelete={isOwner && doc.uploadedBy === displayName}
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
