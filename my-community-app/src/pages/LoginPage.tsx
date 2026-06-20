import { useNavigate } from 'react-router-dom'
import levLogo from '@/assets/Stylized_Leaf_Logo_Design_Fotor-removebg-preview.png'

const YELLOW = '#F5C200'
const BG = 'radial-gradient(ellipse at 50% 30%, #2d6b27 0%, #182f15 100%)'

export default function LoginPage() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, display: 'flex', flexDirection: 'column' }}>
      <div
        className="flex flex-col flex-1 items-center justify-between w-full max-w-sm mx-auto"
        style={{
          paddingLeft:   'max(24px, env(safe-area-inset-left))',
          paddingRight:  'max(24px, env(safe-area-inset-right))',
          paddingTop:    'max(60px, env(safe-area-inset-top))',
          paddingBottom: 'max(48px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Logo + name */}
        <div className="flex flex-col items-center gap-4 flex-1 justify-center">
          <img
            src={levLogo}
            alt="LEV"
            style={{ height: 'min(8rem, 25vh)', width: 'auto', filter: 'brightness(0) invert(1)' }}
          />
          <div className="text-center">
            <h1 className="text-white text-3xl font-bold tracking-wide">LEV Portal</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Your community, connected.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => navigate('/signin')}
            className="w-full py-4 rounded-full font-bold text-base transition-opacity active:opacity-80"
            style={{ backgroundColor: YELLOW, color: '#182f15' }}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="w-full py-4 rounded-full font-semibold text-base text-white border transition-opacity active:opacity-80"
            style={{ borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}
