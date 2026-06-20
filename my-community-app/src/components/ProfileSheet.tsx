import { useState, useEffect } from 'react'
import { X, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore, getRole } from '@/store/authStore'

const PRIMARY = '#243d20'

interface Props {
  open: boolean
  onClose: () => void
  onLogout: () => void
}

export default function ProfileSheet({ open, onClose, onLogout }: Props) {
  const user     = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const role     = getRole(user)

  const [fullName, setFullName] = useState('')
  const [phone,    setPhone]    = useState('')
  const [lot,      setLot]      = useState('')
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setSaved(false)
    supabase
      .from('profiles')
      .select('full_name, phone, lot')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setFullName(data.full_name ?? '')
        setPhone(data.phone ?? '')
        setLot(data.lot ?? '')
      })
  }, [open, user])

  async function handleSave() {
    if (!user || !fullName.trim()) return
    setSaving(true)

    await Promise.all([
      supabase.from('profiles').update({ full_name: fullName.trim(), phone: phone.trim(), lot: lot.trim() }).eq('id', user.id),
      supabase.auth.updateUser({ data: { full_name: fullName.trim() } }),
    ])

    const { data: { session } } = await supabase.auth.getSession()
    setSession(session)

    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 800)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl overflow-y-auto" style={{ maxHeight: '70vh', minHeight: '40vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">My Profile</h2>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-full">
            <X size={18} color="#9ca3af" />
          </button>
        </div>

        {/* Fields */}
        <div className="px-5 py-5 space-y-4">

          {/* Role badge */}
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize"
            style={role === 'owner'
              ? { backgroundColor: '#e8f5e9', color: PRIMARY }
              : { backgroundColor: '#fef3c7', color: '#92400e' }}
          >
            {role}
          </span>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Lot Number</label>
            <input
              type="text"
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 outline-none focus:border-green-700"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !fullName.trim()}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-40"
            style={{ backgroundColor: saved ? '#16a34a' : PRIMARY }}
          >
            {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Changes'}
          </button>

          <button
            onClick={onLogout}
            className="w-full py-3.5 rounded-xl border border-red-200 text-red-500 font-semibold text-sm flex items-center justify-center gap-2"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </>
  )
}
