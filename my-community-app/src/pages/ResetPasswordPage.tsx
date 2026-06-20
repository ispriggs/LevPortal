import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const PRIMARY = '#243d20'
const PAGE_BG = '#f0f0ec'

const inputCls =
  'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 bg-white outline-none focus:ring-2 focus:border-transparent'
const labelCls =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [password,   setPassword]   = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [done,       setDone]       = useState(false)

  useEffect(() => {
    // Supabase processes the recovery token from the URL hash automatically.
    // We listen for the PASSWORD_RECOVERY event to confirm a valid session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true)
      }
    })
    // Also check if a session already exists (handles page refresh after link open)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true)
      else if (hasSession === null) setHasSession(false)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmPw)  { setError('Passwords do not match.'); return }
    if (password.length < 6)     { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setDone(true)
    }
  }

  /* ── Password updated ── */
  if (done) {
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
        <h2 className="text-xl font-bold text-gray-800">Password updated!</h2>
        <p className="text-gray-500 text-sm mt-2">You can now sign in with your new password.</p>
        <button
          onClick={() => navigate('/login', { replace: true })}
          className="mt-8 px-8 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ backgroundColor: PRIMARY }}
        >
          Sign In
        </button>
      </div>
    )
  }

  /* ── Loading / validating link ── */
  if (hasSession === null || hasSession === false) {
    return (
      <div
        className="min-h-svh flex flex-col items-center justify-center px-6 text-center safe-top safe-bottom"
        style={{ backgroundColor: PAGE_BG }}
      >
        {hasSession === null ? (
          <p className="text-gray-500 text-sm">Validating reset link…</p>
        ) : (
          <>
            <p className="text-gray-700 font-semibold">Link expired or invalid</p>
            <p className="text-gray-400 text-sm mt-2">Request a new password reset link.</p>
            <button
              onClick={() => navigate('/forgot-password', { replace: true })}
              className="mt-6 px-6 py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: PRIMARY }}
            >
              Try Again
            </button>
          </>
        )}
      </div>
    )
  }

  /* ── New password form ── */
  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: PAGE_BG }}>

      <header className="safe-top px-4 pt-4 pb-6" style={{ backgroundColor: PRIMARY }}>
        <h1 className="text-white text-2xl font-bold">Set New Password</h1>
        <p className="text-green-300 text-sm mt-0.5">Choose a strong password</p>
      </header>

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="relative">
            <label className={labelCls}>New Password</label>
            <input
              type={showPw ? 'text' : 'password'} required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              className={inputCls} autoComplete="new-password"
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
              placeholder="••••••••"
              className={inputCls} autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: PRIMARY }}
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>

        </form>
      </main>
    </div>
  )
}
