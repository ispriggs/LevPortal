import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

const PRIMARY = '#243d20'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const mockLogin = useAuthStore((s) => s.mockLogin)

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
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: '#f0f0ec' }}>
      <header className="px-6 pt-10 pb-8" style={{ backgroundColor: PRIMARY }}>
        <h1 className="text-white text-2xl font-bold">LEV Portal</h1>
        <p className="text-green-300 text-sm mt-1">Your community, connected.</p>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 pt-10">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': PRIMARY } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:border-transparent"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: PRIMARY }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {/* DEV ONLY — remove when Supabase auth is wired up */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { mockLogin('Ian Spriggs', 'owner'); navigate('/', { replace: true }) }}
              className="flex-1 py-2 rounded-lg text-xs text-gray-400 border border-dashed border-gray-300"
            >
              Skip as Owner
            </button>
            <button
              type="button"
              onClick={() => { mockLogin('Sam Renter', 'renter'); navigate('/', { replace: true }) }}
              className="flex-1 py-2 rounded-lg text-xs text-gray-400 border border-dashed border-gray-300"
            >
              Skip as Renter
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
