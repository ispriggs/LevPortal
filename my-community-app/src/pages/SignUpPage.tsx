import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Camera, ChevronLeft, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const PRIMARY = '#243d20'
const AMBER   = '#d08a10'
const PAGE_BG = '#f0f0ec'

const LOTS = Array.from({ length: 50 }, (_, i) => String(i + 1))

function resizeImage(file: File, maxPx = 256): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const size = Math.min(img.width, img.height, maxPx)
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      const sx = (img.width - size) / 2
      const sy = (img.height - size) / 2
      ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.75))
    }
    img.src = url
  })
}

const inputCls =
  'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 bg-white outline-none focus:ring-2 focus:border-transparent'
const labelCls =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

export default function SignUpPage() {
  const navigate  = useNavigate()
  const photoRef  = useRef<HTMLInputElement>(null)

  const [step,    setStep]    = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)

  const [fullName,       setFullName]       = useState('')
  const [email,          setEmail]          = useState('')
  const [password,       setPassword]       = useState('')
  const [confirmPw,      setConfirmPw]      = useState('')
  const [phone,          setPhone]          = useState('')
  const [lot,            setLot]            = useState('')
  const [role,           setRole]           = useState<'owner' | 'renter'>('owner')
  const [arrivalDate,    setArrivalDate]    = useState('')
  const [departureDate,  setDepartureDate]  = useState('')
  const [photoPreview,   setPhotoPreview]   = useState<string | null>(null)
  const [photoBase64,    setPhotoBase64]    = useState<string | null>(null)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const b64 = await resizeImage(file)
    setPhotoPreview(b64)
    setPhotoBase64(b64)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPw)          { setError('Passwords do not match.'); return }
    if (password.length < 6)             { setError('Password must be at least 6 characters.'); return }
    if (!lot)                            { setError('Please select your lot number.'); return }
    if (role === 'renter' && (!arrivalDate || !departureDate)) {
      setError('Please enter your rental arrival and departure dates.')
      return
    }
    if (role === 'renter' && arrivalDate >= departureDate) {
      setError('Departure date must be after arrival date.')
      return
    }

    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name:  fullName,
          role,
          lot,
          phone,
          avatar_url: photoBase64 ?? null,
          ...(role === 'renter'
            ? { rental_start: arrivalDate, rental_end: departureDate }
            : {}),
        },
      },
    })
    setLoading(false)

    if (authError) {
      setError(authError.message)
    } else {
      setStep('success')
    }
  }

  /* ── Success screen ── */
  if (step === 'success') {
    return (
      <div
        className="min-h-svh flex flex-col items-center justify-center px-6 text-center safe-top safe-bottom"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5 text-white text-3xl font-bold"
          style={{ backgroundColor: PRIMARY }}
        >
          ✓
        </div>
        <h2 className="text-xl font-bold text-gray-800">Check your email</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs leading-relaxed">
          We sent a confirmation link to{' '}
          <strong className="text-gray-700">{email}</strong>.
          Click it to activate your account.
        </p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="mt-8 px-8 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ backgroundColor: PRIMARY }}
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  /* ── Sign-up form ── */
  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: PAGE_BG }}>

      {/* Header */}
      <header className="safe-top px-4 pt-4 pb-6" style={{ backgroundColor: PRIMARY }}>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-0.5 text-green-300 text-sm mb-4"
        >
          <ChevronLeft size={16} />
          Sign In
        </button>
        <h1 className="text-white text-2xl font-bold">Create Account</h1>
        <p className="text-green-300 text-sm mt-0.5">Join the Pura Maracay community</p>
      </header>

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Profile photo */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden bg-white relative"
            >
              {photoPreview
                ? <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                : (
                  <>
                    <Camera size={22} color="#9ca3af" />
                    <span className="text-[10px] text-gray-400 mt-1 font-medium">Add photo</span>
                  </>
                )
              }
            </button>
            <span className="text-xs text-gray-400">Optional profile photo</span>
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Personal info */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Personal Info</p>

            <div>
              <label className={labelCls}>Full Name</label>
              <input
                type="text" required value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Jane Smith" className={inputCls} autoComplete="name"
              />
            </div>

            <div>
              <label className={labelCls}>Email Address</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@example.com" className={inputCls} autoComplete="email"
              />
            </div>

            <div className="relative">
              <label className={labelCls}>Password</label>
              <input
                type={showPw ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters" className={inputCls} autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-[34px] text-gray-400"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div>
              <label className={labelCls}>Confirm Password</label>
              <input
                type="password" required value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••" className={inputCls} autoComplete="new-password"
              />
            </div>

            <div>
              <label className={labelCls}>Phone Number</label>
              <input
                type="tel" required value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+506 8888 8888" className={inputCls} autoComplete="tel"
              />
            </div>
          </div>

          {/* Community */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Community</p>

            <div>
              <label className={labelCls}>Lot Number</label>
              <select
                value={lot}
                onChange={e => setLot(e.target.value)}
                className={inputCls}
                required
              >
                <option value="">Select your lot…</option>
                {LOTS.map(n => (
                  <option key={n} value={n}>Lot {n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['owner', 'renter'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="py-3 rounded-xl text-sm font-semibold border-2 transition-colors"
                    style={
                      role === r
                        ? { backgroundColor: PRIMARY, color: 'white', borderColor: PRIMARY }
                        : { backgroundColor: 'white', color: '#6b7280', borderColor: '#d1d5db' }
                    }
                  >
                    {r === 'owner' ? 'Owner' : 'Renter'}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                {role === 'owner'
                  ? 'Full access to all community features and voting.'
                  : 'Access to community features for your rental period.'}
              </p>
            </div>
          </div>

          {/* Renter dates */}
          {role === 'renter' && (
            <div className="space-y-3 p-4 rounded-2xl" style={{ backgroundColor: '#fff8eb' }}>
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: AMBER }}
              >
                Rental Period
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Arrival Date</label>
                  <input
                    type="date" required value={arrivalDate}
                    onChange={e => setArrivalDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Departure Date</label>
                  <input
                    type="date" required value={departureDate}
                    min={arrivalDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: PRIMARY }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-gray-500 pb-4">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: PRIMARY }}>
              Sign In
            </Link>
          </p>

        </form>
      </main>
    </div>
  )
}
