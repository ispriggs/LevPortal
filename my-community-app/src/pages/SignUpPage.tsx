import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Check } from 'lucide-react'

const PRIMARY = '#243d20'
const PAGE_BG = '#f0f0ec'

type Step = 1 | 2 | 3

const STEPS = [
  { n: 1, label: 'PERSONAL' },
  { n: 2, label: 'PROPERTY' },
  { n: 3, label: 'SECURITY' },
] as const

export default function SignUpPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  // Step 1
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Step 2
  const [role, setRole] = useState<'owner' | 'renter'>('owner')
  const [lot, setLot] = useState('')
  const [arrivalDate, setArrivalDate] = useState('')
  const [departureDate, setDepartureDate] = useState('')

  // Step 3
  const [password, setPassword] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  function validateStep1() {
    if (!fullName.trim()) { setError('Full name is required.'); return false }
    if (!email.trim() || !email.includes('@')) { setError('A valid email is required.'); return false }
    if (!phone.trim()) { setError('Phone number is required.'); return false }
    return true
  }

  function validateStep2() {
    if (!lot.trim()) { setError('Unit / lot number is required.'); return false }
    if (role === 'renter') {
      if (!arrivalDate || !departureDate) { setError('Please enter your rental dates.'); return false }
      if (arrivalDate >= departureDate) { setError('Departure must be after arrival.'); return false }
    }
    return true
  }

  function handleNext() {
    setError('')
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => (s + 1) as Step)
  }

  function handleBack() {
    setError('')
    if (step === 1) navigate('/login')
    else setStep(s => (s - 1) as Step)
  }

  async function handleSubmit() {
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPw) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          lot,
          phone,
          ...(role === 'renter' ? { rental_start: arrivalDate, rental_end: departureDate } : {}),
        },
      },
    })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      setDone(true)
    }
  }

  /* â”€â”€ Success â”€â”€ */
  if (done) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5 text-white"
          style={{ backgroundColor: PRIMARY }}
        >
          <Check size={28} strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Check your email</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs leading-relaxed">
          We sent a confirmation link to{' '}
          <strong className="text-gray-700">{email}</strong>.
          Once verified, an admin will approve your account.
        </p>
        <button
          onClick={() => navigate('/signin', { replace: true })}
          className="mt-8 px-8 py-4 rounded-full text-white font-bold text-sm"
          style={{ backgroundColor: PRIMARY }}
        >
          Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>

      {/* Green header â€” ~30% of screen */}
      <div
        className="relative overflow-hidden px-6 pt-10 pb-5 rounded-b-3xl flex flex-col justify-end"
        style={{ backgroundColor: PRIMARY, minHeight: '28svh' }}
      >
        <div
          className="absolute -top-10 -right-10 w-36 h-36 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        />
        <span className="inline-block text-white/60 text-xs font-bold tracking-widest uppercase border border-white/20 rounded-full px-3 py-1 mb-3">
          New Account
        </span>
        <h1 className="text-white text-3xl font-extrabold leading-tight">
          Create<br />Account
        </h1>
        <p className="text-white/50 text-sm mt-1.5">Fill in your details to request access</p>
      </div>

      {/* Step indicator */}
      <div className="px-6 pt-5 pb-1">
        <div className="relative flex items-start justify-between max-w-xs mx-auto">
          <div className="absolute top-4 left-8 right-8 h-px bg-gray-200 -translate-y-1/2" />
          {STEPS.map(({ n, label }) => {
            const complete = n < step
            const active = n === step
            return (
              <div key={n} className="flex flex-col items-center gap-1.5 z-10">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={
                    complete || active
                      ? { backgroundColor: PRIMARY, color: 'white' }
                      : { backgroundColor: 'white', color: '#9ca3af', border: '1.5px solid #d1d5db' }
                  }
                >
                  {complete ? <Check size={13} strokeWidth={3} /> : n}
                </div>
                <span
                  className="text-[10px] font-bold tracking-wider"
                  style={{ color: active || complete ? PRIMARY : '#9ca3af' }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
        {/* Active underline */}
        <div className="max-w-xs mx-auto mt-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ backgroundColor: PRIMARY, width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-5 pt-5 pb-4">

        {/* Step 1: Personal */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-0.5">Personal Details</h2>
            <p className="text-gray-400 text-sm mb-4">Tell us a bit about yourself</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Full Name *"
                autoComplete="name"
                className="w-full px-4 py-4 text-base text-gray-800 placeholder:text-gray-400 outline-none border-b border-gray-100"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email *"
                autoComplete="email"
                className="w-full px-4 py-4 text-base text-gray-800 placeholder:text-gray-400 outline-none border-b border-gray-100"
              />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone Number *"
                autoComplete="tel"
                className="w-full px-4 py-4 text-base text-gray-800 placeholder:text-gray-400 outline-none"
              />
            </div>
          </>
        )}

        {/* Step 2: Property */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-0.5">Property Details</h2>
            <p className="text-gray-400 text-sm mb-4">Your unit and residency type</p>
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-5">

              {/* Role cards */}
              <div>
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">I AM A *</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'owner', emoji: 'ðŸ ', label: 'Owner', sub: 'Property owner' },
                    { value: 'renter', emoji: 'ðŸ”‘', label: 'Renter', sub: 'Temp. renter' },
                  ].map(({ value, emoji, label, sub }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value as 'owner' | 'renter')}
                      className="relative flex flex-col items-center gap-1 py-4 px-3 rounded-xl border-2 transition-all"
                      style={
                        role === value
                          ? { borderColor: PRIMARY, backgroundColor: '#f0f7ee' }
                          : { borderColor: '#e5e7eb', backgroundColor: 'white' }
                      }
                    >
                      {role === value && (
                        <span
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: PRIMARY }}
                        >
                          <Check size={11} color="white" strokeWidth={3} />
                        </span>
                      )}
                      <span className="text-2xl">{emoji}</span>
                      <span className="font-bold text-sm text-gray-800 mt-1">{label}</span>
                      <span className="text-xs text-gray-400">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lot number */}
              <div>
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">UNIT / LOT NUMBER *</p>
                <input
                  type="text"
                  value={lot}
                  onChange={e => setLot(e.target.value)}
                  placeholder="Unit / Lot Number *"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-800 placeholder:text-gray-400 outline-none"
                />
              </div>

              {/* Renter dates */}
              {role === 'renter' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">ARRIVAL</p>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={e => setArrivalDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-800 outline-none"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">DEPARTURE</p>
                    <input
                      type="date"
                      value={departureDate}
                      min={arrivalDate}
                      onChange={e => setDepartureDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base text-gray-800 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 3: Security */}
        {step === 3 && (
          <>
            <h2 className="text-xl font-bold text-gray-800 mb-0.5">Set Password</h2>
            <p className="text-gray-400 text-sm mb-4">Minimum 6 characters</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password *"
                autoComplete="new-password"
                className="w-full px-4 py-4 text-base text-gray-800 placeholder:text-gray-400 outline-none border-b border-gray-100"
              />
              <input
                type="password"
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Confirm Password *"
                autoComplete="new-password"
                className="w-full px-4 py-4 text-base text-gray-800 placeholder:text-gray-400 outline-none"
              />
            </div>
            <div className="flex items-start gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
              <p className="text-gray-400 text-sm">Your account will be reviewed by an admin</p>
            </div>
          </>
        )}

        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      {/* Bottom nav */}
      <div className="px-5 pb-10 pt-2">
        {step === 3 ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 rounded-full font-bold text-base text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: PRIMARY }}
            >
              {loading ? 'Creating accountâ€¦' : 'Create Account â†’'}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              â† Back
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
            >
              â† {step === 1 ? 'Login' : 'Back'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-3.5 rounded-full font-bold text-sm text-white transition-opacity active:opacity-80"
              style={{ backgroundColor: PRIMARY }}
            >
              Continue â†’
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

