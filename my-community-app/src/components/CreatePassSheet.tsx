import { useState } from 'react'
import { X, Camera, Plus } from 'lucide-react'
import {
  useGateStore, type GatePass, type PassType, type PassReason,
  PASS_REASON_LABELS, PASS_REASONS,
} from '@/store/gateStore'
import { useToastStore } from '@/store/toastStore'

const PRIMARY = '#243d20'

const PASS_TYPES: { value: PassType; label: string }[] = [
  { value: 'visitor', label: 'Visitor Pass' },
  { value: 'worker', label: 'Worker Pass' },
  { value: 'event', label: 'Event Pass' },
  { value: 'other', label: 'Other' },
]

interface Props {
  open: boolean
  currentUser: string
  onClose: () => void
  onCreate: (pass: GatePass) => void
}

export default function CreatePassSheet({ open, currentUser, onClose, onCreate }: Props) {
  const { createPass } = useGateStore()
  const showToast = useToastStore((s) => s.showToast)
  const todayStr = new Date().toISOString().slice(0, 10)

  const [type, setType] = useState<PassType>('visitor')
  const [reason, setReason] = useState<PassReason>('family')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [lot, setLot] = useState('1')
  const [extended, setExtended] = useState(false)
  const [arrival, setArrival] = useState(todayStr)
  const [departure, setDeparture] = useState(todayStr)
  const [idPhoto, setIdPhoto] = useState('')

  function reset() {
    setType('visitor'); setReason('family'); setName(''); setEmail(''); setPhone('')
    setLot('1'); setExtended(false); setArrival(todayStr); setDeparture(todayStr); setIdPhoto('')
  }
  function handleClose() { reset(); onClose() }

  function handleIdPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setIdPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) return
    if (extended && !idPhoto) return
    const pass = await createPass({
      type, reason,
      visitorName: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim(),
      visitingLot: lot,
      extended,
      arrivalDate: arrival,
      departureDate: extended ? departure : arrival,
      idPhotoUrl: extended ? idPhoto : undefined,
      createdBy: currentUser,
    })
    if (pass) {
      reset()
      onCreate(pass)
      showToast(pass.extended ? 'Extended pass created — awaiting admin approval.' : 'Gate pass created!')
    } else {
      showToast('Failed to create pass — please try again.', 'error')
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
        onClick={handleClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md md:max-w-3xl lg:max-w-5xl mx-auto shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 sheet-safe-bottom"
        style={{ maxHeight: 'calc(75vh - var(--keyboard-h, 0px))', minHeight: '40vh', transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-6 pt-3 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Create Pass</h2>
          <button onClick={handleClose} className="p-1 text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 py-4 space-y-4">

          {/* Info hint */}
          <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-700 leading-relaxed space-y-0.5">
            <p><strong>Visitor Pass</strong> — Fill in the visitor's information</p>
            <p><strong>Worker Pass</strong> — Fill in the worker's information</p>
            <p><strong>Event Pass</strong> — Fill in the host's information</p>
          </div>

          {/* Pass Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Pass Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PassType)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 bg-white outline-none focus:border-green-700"
            >
              {PASS_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>

          {/* Pass Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Pass Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as PassReason)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 bg-white outline-none focus:border-green-700"
            >
              {PASS_REASONS.map((r) => (
                <option key={r} value={r}>{PASS_REASON_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Full Name *</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Visitor's full name"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Email <span className="font-normal text-gray-400 text-xs">— not required if they have WhatsApp</span>
            </label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="visitor@email.com"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Phone Number *</label>
            <input
              type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="+506 8888-0000"
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700"
            />
          </div>

          {/* Visiting Lot */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Visiting Lot Number *</label>
            <select
              value={lot}
              onChange={(e) => setLot(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 bg-white outline-none focus:border-green-700"
            >
              {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={String(n)}>Lot {n}</option>
              ))}
            </select>
          </div>

          {/* Extended pass toggle */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Extended Pass? <span className="font-normal text-gray-400 text-xs">— more than 1 day</span>
            </label>
            <div className="flex gap-2">
              {(['No', 'Yes'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setExtended(opt === 'Yes')}
                  className="flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-colors"
                  style={
                    extended === (opt === 'Yes')
                      ? { borderColor: PRIMARY, backgroundColor: PRIMARY + '15', color: PRIMARY }
                      : { borderColor: '#e5e7eb', backgroundColor: 'white', color: '#374151' }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Arrival Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Arrival Date *</label>
            <input
              type="date" value={arrival} min={todayStr}
              onChange={(e) => { setArrival(e.target.value); if (!extended) setDeparture(e.target.value) }}
              className="w-full min-w-0 block border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700"
            />
          </div>

          {/* Departure Date + ID photo — extended only */}
          {extended && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Departure Date *</label>
                <input
                  type="date" value={departure} min={arrival}
                  onChange={(e) => setDeparture(e.target.value)}
                  className="w-full min-w-0 block border border-gray-300 rounded-xl px-3 py-3 text-base text-gray-900 outline-none focus:border-green-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  ID Photo * <span className="font-normal text-gray-400 text-xs">— required for extended passes</span>
                </label>
                {idPhoto ? (
                  <div className="relative">
                    <img src={idPhoto} alt="ID" className="w-full h-44 object-cover rounded-xl" />
                    <button
                      onClick={() => setIdPhoto('')}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                    >
                      <X size={14} color="white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer active:bg-gray-50">
                    <Camera size={30} color="#9ca3af" strokeWidth={1.5} />
                    <p className="text-sm text-gray-400">Tap to photograph or upload ID</p>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleIdPhoto} />
                  </label>
                )}
                <p className="text-xs text-amber-600">
                  Extended passes require admin approval. A share link will be available once approved.
                </p>
              </div>
            </>
          )}

        </div>

        <div className="flex-shrink-0 px-4 pt-3 pb-2 border-t border-gray-100">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !phone.trim() || (extended && !idPhoto)}
            className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity active:opacity-80"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={18} /> Create Pass
          </button>
        </div>
      </div>
    </>
  )
}
