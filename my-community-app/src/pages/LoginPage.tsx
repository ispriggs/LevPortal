import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import levLogo from '@/assets/Stylized_Leaf_Logo_Design_Fotor-removebg-preview.png'

const YELLOW = '#F5C200'
const BG = 'radial-gradient(ellipse at 50% 30%, #2d6b27 0%, #182f15 100%)'
const BG_BOTTOM = '#182f15'

export default function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    document.body.style.backgroundColor = BG_BOTTOM
    return () => { document.body.style.backgroundColor = '' }
  }, [])

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-between px-6 pt-20 pb-16 safe-bottom"
      style={{ background: BG }}
    >
      {/* Logo + name */}
      <div className="flex flex-col items-center gap-4 flex-1 justify-center">
        <img
          src={levLogo}
          alt="LEV"
          className="h-32 w-auto sm:h-44"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold tracking-wide">LEV Portal</h1>
          <p className="text-white/60 text-sm mt-1">Your community, connected.</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => navigate('/signin')}
          className="w-full py-4 rounded-full font-bold text-base transition-opacity active:opacity-80"
          style={{ backgroundColor: YELLOW, color: '#182f15' }}
        >
          Login
        </button>
        <button
          onClick={() => navigate('/signup')}
          className="w-full py-4 rounded-full font-semibold text-base text-white border border-white/30 bg-white/10 transition-opacity active:opacity-80"
        >
          Create Account
        </button>
      </div>
    </div>
  )
}
