import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import levLogo from '@/assets/Stylized_Leaf_Logo_Design_Fotor-removebg-preview.png'

const YELLOW = '#F5C200'
const BG = 'radial-gradient(ellipse at 50% 30%, #2d6b27 0%, #182f15 100%)'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center px-5 py-12"
      style={{ background: BG }}
    >
      {/* Small logo + name */}
      <div className="flex flex-col items-center mb-8">
        <img
          src={levLogo}
          alt="LEV"
          className="h-12 w-auto mb-1"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <span className="text-white text-sm font-semibold tracking-wide">LEV Portal</span>
      </div>

      {/* Heading */}
      <div className="text-center mb-6">
        <h1 className="text-white text-3xl font-bold">Welcome back</h1>
        <p className="text-white/60 text-sm mt-1">Sign in to your account</p>
      </div>

      {/* Card with form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-5 space-y-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="space-y-1">
          <label className="block text-white/70 text-xs font-medium pl-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-xl px-4 py-3 text-base text-white placeholder:text-white/40 outline-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-white/70 text-xs font-medium pl-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Your password"
            className="w-full rounded-xl px-4 py-3 text-base text-white placeholder:text-white/40 outline-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        {error && <p className="text-red-300 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl font-bold text-base transition-opacity disabled:opacity-60"
          style={{ backgroundColor: YELLOW, color: '#182f15' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          onClick={() => navigate('/login')}
          className="text-white/50 text-sm hover:text-white/70 transition-colors"
        >
          ← Back
        </button>
        <Link
          to="/forgot-password"
          className="text-white/40 text-xs hover:text-white/60 transition-colors"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  )
}
