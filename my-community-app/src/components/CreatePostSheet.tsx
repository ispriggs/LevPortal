import { useState, useRef } from 'react'
import { X, ImagePlus } from 'lucide-react'

const PRIMARY = '#243d20'

export type CreatePostData = {
  title: string
  content: string
  imageUrl?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: CreatePostData) => void
}

export default function CreatePostSheet({ open, onClose, onSave }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  function reset() { setTitle(''); setContent(''); setImageUrl(''); if (fileRef.current) fileRef.current.value = '' }
  function handleClose() { reset(); onClose() }

  function handleSave() {
    if (!content.trim()) return
    onSave({ title: title.trim(), content: content.trim(), imageUrl: imageUrl || undefined })
    reset()
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={handleClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md mx-auto shadow-2xl transition-transform duration-300 safe-bottom"
        style={{ transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
          <button onClick={handleClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <div className="overflow-y-auto max-h-[75vh] px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Title <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. LEV Talent Show"
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Post *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in the community?"
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm text-gray-900 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{content.length} chars</p>
          </div>

          {/* Photo picker */}
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="Preview" className="w-full rounded-xl object-cover max-h-52" />
                <button
                  onClick={() => { setImageUrl(''); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5"
                  aria-label="Remove photo"
                >
                  <X size={14} color="white" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-400 font-medium"
              >
                <ImagePlus size={18} />
                Add photo
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={!content.trim()}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-opacity disabled:opacity-40"
            style={{ backgroundColor: PRIMARY }}
          >
            Post
          </button>
        </div>
      </div>
    </>
  )
}
