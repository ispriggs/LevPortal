import { useState, useRef } from 'react'
import { X, ChevronDown, Paperclip } from 'lucide-react'

const PRIMARY = '#243d20'

export const FOLDERS = [
  'Governing Documents',
  'Meeting Records',
  'Financial',
  'Forms & Applications',
  'Policies & Guidelines',
  'Maintenance & Projects',
] as const
export type DocFolder = typeof FOLDERS[number]

export const FOLDER_COLORS: Record<DocFolder, string> = {
  'Governing Documents': '#4a8a4a',
  'Meeting Records': '#c9893a',
  'Financial': '#2565a8',
  'Forms & Applications': '#6838b8',
  'Policies & Guidelines': '#1e7878',
  'Maintenance & Projects': '#e07820',
}

export type DocAccess = 'all' | 'owners_only'

export type UploadDocData = {
  title: string
  folder: DocFolder
  access: DocAccess
  file: File
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: UploadDocData) => void
}

function FolderDropdown({ value, onChange }: { value: DocFolder | ''; onChange: (v: DocFolder) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm text-left flex items-center justify-between"
        style={{ borderColor: value ? '#d1d5db' : '#d1d5db' }}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || 'Choose a folder…'}
        </span>
        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {FOLDERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { onChange(f); setOpen(false) }}
              className="w-full px-4 py-3 text-sm text-left border-b border-gray-100 last:border-0 flex items-center gap-3"
              style={{ backgroundColor: value === f ? '#f0f7f0' : 'white', color: value === f ? PRIMARY : '#374151' }}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: FOLDER_COLORS[f] }} />
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function UploadDocumentSheet({ open, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [folder, setFolder] = useState<DocFolder | ''>('')
  const [access, setAccess] = useState<DocAccess>('all')
  const [file, setFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setTitle(''); setFolder(''); setAccess('all'); setFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }
  function handleClose() { reset(); onClose() }

  function handleSave() {
    if (!title.trim() || !folder || !file) return
    onSave({ title: title.trim(), folder: folder as DocFolder, access, file })
    reset(); onClose()
  }

  const isValid = title.trim() && folder && file

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={handleClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md mx-auto shadow-2xl flex flex-col transition-transform duration-300 safe-bottom"
        style={{ maxHeight: '70vh', minHeight: '40vh', transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Upload New Document</h2>
          <button onClick={handleClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Document Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>

          {/* Folder */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Folder *</label>
            <FolderDropdown value={folder} onChange={setFolder} />
          </div>

          {/* Access Level */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Access Level *</label>
            <div className="flex rounded-xl overflow-hidden border border-gray-300">
              <button
                type="button"
                onClick={() => setAccess('all')}
                className="flex-1 py-3 text-sm font-semibold transition-colors"
                style={access === 'all'
                  ? { backgroundColor: PRIMARY, color: 'white' }
                  : { backgroundColor: 'white', color: '#6b7280' }}
              >
                All Residents
              </button>
              <button
                type="button"
                onClick={() => setAccess('owners_only')}
                className="flex-1 py-3 text-sm font-semibold border-l border-gray-300 transition-colors"
                style={access === 'owners_only'
                  ? { backgroundColor: PRIMARY, color: 'white' }
                  : { backgroundColor: 'white', color: '#6b7280' }}
              >
                Owners Only
              </button>
            </div>
          </div>

          {/* File picker */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Select File *</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full py-3.5 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              style={file
                ? { borderColor: PRIMARY, color: PRIMARY, borderStyle: 'solid', backgroundColor: '#f0f7f0' }
                : { borderColor: '#d1d5db', color: '#9ca3af', borderStyle: 'dashed', backgroundColor: 'white' }}
            >
              <Paperclip size={16} />
              {file ? file.name : 'Click to upload a file'}
            </button>
            {file && (
              <p className="text-xs text-gray-400 mt-1 text-right">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!isValid}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            Upload Document
          </button>
        </div>
      </div>
    </>
  )
}
