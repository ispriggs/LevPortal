import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const PRIMARY = '#243d20'
const PAGE_BG = '#f0f0ec'

const inputCls =
  'w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900 bg-white outline-none focus:ring-2 focus:border-transparent'
const labelCls =
  'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'

export default function ForgotPasswordPage() {
  const navigate  = useNavigate()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [sent,    setSent]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  /* ── Success state ── */
  if (sent) {
    return (
      <div
        className="min-h-svh flex flex-col items-center justify-center px-6 text-center safe-top safe-bottom"
        style={{ backgroundColor: PAGE_BG }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
          style={{ backgroundColor: PRIMARY }}
        >
          <Mail size={28} color="white" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Check your email</h2>
        <p className="text-gray-500 text-sm mt-2 max-w-xs leading-relaxed">
          If <strong className="text-gray-700">{email}</strong> is registered you'll receive a
          password reset link shortly. Check your spam folder if you don't see it.
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

  /* ── Request form ── */
  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: PAGE_BG }}>

      <header className="safe-top px-4 pt-4 pb-6" style={{ backgroundColor: PRIMARY }}>
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-0.5 text-green-300 text-sm mb-4"
        >
          <ChevronLeft size={16} />
          Sign In
        </button>
        <h1 className="text-white text-2xl font-bold">Forgot Password</h1>
        <p className="text-green-300 text-sm mt-0.5">We'll send you a reset link</p>
      </header>

      <main className="flex-1 px-4 py-6 w-full max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">

          <p className="text-sm text-gray-500 leading-relaxed">
            Enter the email address linked to your account and we'll send you a link to reset your password.
          </p>

          <div>
            <label className={labelCls}>Email Address</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className={inputCls} autoComplete="email"
            />
          </div>

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
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>

        </form>
      </main>
    </div>
  )
}
