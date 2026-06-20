import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PhoneCall, Mail, Newspaper, FileText,
  BarChart2, CalendarDays, MessageCircle, QrCode,
  ClipboardList, ShieldAlert, Users, Waves,
  Leaf, Footprints, User, CheckCircle, AlertCircle,
  LogIn, LogOut, Megaphone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore, getDisplayName, getRole } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { triggerGate } from '@/lib/gate'
import ProfileSheet from '@/components/ProfileSheet'

const PRIMARY = '#243d20'
const AMBER = '#d08a10'
const PAGE_BG = '#f0f0ec'

type TileData = {
  id: string
  label: string
  Icon: LucideIcon
  bg: string
  color: string
  badge?: number
  path: string
  ownerOnly?: boolean  // greyed out for renters
  adminOnly?: boolean  // hidden entirely for non-admins
}

const TILES: TileData[] = [
  { id: 'directory', label: 'Directory', Icon: PhoneCall, bg: '#e4d5b8', color: '#c9893a', path: '/directory' },
  { id: 'voting', label: 'Voting', Icon: Mail, bg: '#c5dec5', color: '#4a8a4a', path: '/voting', ownerOnly: true },
  { id: 'news', label: 'News', Icon: Newspaper, bg: '#e8dfa0', color: '#b8a020', path: '/news' },
  { id: 'documents', label: 'Documents', Icon: FileText, bg: '#9dd0d0', color: '#1e7878', path: '/documents' },
  { id: 'neighbours', label: 'Neighbours\nSupport', Icon: BarChart2, bg: '#aabde0', color: '#3a50a0', path: '/neighbours-support' },
  { id: 'events', label: 'Events', Icon: CalendarDays, bg: '#585878', color: '#d8d8e0', path: '/events' },
  { id: 'faq', label: 'FAQ', Icon: MessageCircle, bg: '#b5cbc0', color: '#4e7860', path: '/faq' },
  { id: 'gate', label: 'Gate', Icon: QrCode, bg: '#98bcb0', color: '#387868', path: '/gate' },
  { id: 'proposals', label: 'Proposals', Icon: ClipboardList, bg: '#d8cba8', color: '#986830', path: '/proposals' },
  { id: 'ae', label: 'A&E', Icon: ShieldAlert, bg: '#f5a5a5', color: '#cc2828', path: '/ae' },
  { id: 'admin', label: 'Admin', Icon: Users, bg: '#eeada0', color: '#c03828', path: '/admin', badge: 7, adminOnly: true },
  { id: 'amenities', label: 'Amenities', Icon: Waves, bg: '#c5b5e0', color: '#6838b8', path: '/amenities' },
  { id: 'flora', label: 'Flora &\nFauna', Icon: Leaf, bg: '#a5cf95', color: '#358028', path: '/flora-fauna' },
  { id: 'hiking', label: 'Hiking', Icon: Footprints, bg: '#95bdd8', color: '#2565a8', path: '/hiking' },
]

function Tile({
  data,
  disabled,
  onClick,
}: {
  data: TileData
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className="relative flex flex-col items-center justify-center gap-1.5 rounded-xl p-2 w-full aspect-square transition-opacity active:opacity-70"
      style={{
        backgroundColor: data.bg,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {data.badge !== undefined && !disabled && (
        <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
          {data.badge}
        </span>
      )}
      <data.Icon size={36} color={data.color} strokeWidth={1.5} />
      <span
        className="text-[14px] font-semibold text-center leading-tight whitespace-pre-line"
        style={{ color: data.color }}
      >
        {data.label}
      </span>
    </button>
  )
}

function LogoTile() {
  return (
    <div
      className="flex items-center justify-center w-full aspect-square rounded-xl"
      style={{ backgroundColor: '#c5ba9a' }}
    >
      <div className="w-3/4 h-3/4 rounded-full bg-white/80 flex flex-col items-center justify-center">
        <span className="text-[9px] font-semibold text-center leading-tight" style={{ color: '#6a6050' }}>
          PURA{'\n'}MARACAY
        </span>
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

type Announcement = { id: string; title: string; body: string | null; created_at: string }

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const isAdmin = useAuthStore((s) => s.isAdmin)
  const displayName = getDisplayName(user)
  const role = getRole(user)
  const isRenter = role === 'renter'
  const lot = user?.user_metadata?.lot as string | undefined
  const roleBadge = isAdmin ? 'Admin' : role === 'owner' ? 'Owner' : 'Renter'
  const firstName = displayName.split(' ')[0]

  const [profileOpen, setProfileOpen] = useState(false)
  const [enterCooldown, setEnterCooldown] = useState(false)
  const [exitCooldown, setExitCooldown] = useState(false)
  const [toast, setToast] = useState<{ action: 'enter' | 'exit'; ok: boolean } | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setAnnouncements(data) })
  }, [])

  async function handleGate(action: 'enter' | 'exit') {
    // Disable the tapped button for 5 s — independent per gate
    if (action === 'enter') {
      setEnterCooldown(true)
      setTimeout(() => setEnterCooldown(false), 5000)
    } else {
      setExitCooldown(true)
      setTimeout(() => setExitCooldown(false), 5000)
    }

    const ok = await triggerGate(action === 'enter')

    // Slide-up toast
    setToast({ action, ok })
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3200)
    setTimeout(() => setToast(null), 3550)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    logout()
    navigate('/login', { replace: true })
  }

  const visibleTiles = TILES.filter((t) => !t.adminOnly || isAdmin)
  const mainTiles = visibleTiles.slice(0, 12)
  const bottomTiles = visibleTiles.slice(12)

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: PAGE_BG }}>

      {/* Header */}
      <header
        className="relative overflow-hidden px-4 pb-4 rounded-b-3xl"
        style={{ backgroundColor: PRIMARY, paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
      >
        {/* Decorative bubbles */}
        <div
          className="absolute -top-12 -right-12 w-44 h-44 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        />
        <div
          className="absolute -top-4 right-16 w-20 h-20 rounded-full pointer-events-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
        />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/50 text-xs mb-0.5">{getGreeting()}</p>
            <h1 className="text-white text-2xl font-bold leading-tight">{displayName}</h1>
            <span
              className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full text-white/80"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
            >
              {roleBadge}{lot ? ` · Lot ${lot}` : ''}
            </span>
          </div>
          <button
            className="rounded-full p-2 bg-white/10 mt-1"
            onClick={() => setProfileOpen(true)}
            aria-label="My profile"
          >
            <User size={20} color="white" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-3 py-3 w-full max-w-2xl mx-auto">

        {/* Main Entrance card */}
        <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#1a3a18' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-white font-bold text-lg">Main Entrance</h2>
            <span className="flex items-center gap-1.5 text-xs font-medium text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Online
            </span>
          </div>
          <p className="text-white/50 text-xs mb-4">Tap a button to open or close the gate</p>
          <div className="space-y-2.5">
            <button
              onClick={() => handleGate('enter')}
              disabled={enterCooldown}
              className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-opacity active:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: '#F5C200', color: '#1a3a18' }}
            >
              <LogIn size={18} strokeWidth={2.5} />
              Enter
            </button>
            <button
              onClick={() => handleGate('exit')}
              disabled={exitCooldown}
              className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-opacity active:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: '#F5C200', color: '#1a3a18' }}
            >
              <LogOut size={18} strokeWidth={2.5} />
              Exit
            </button>
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2 px-1">Announcements</p>
            <div className="space-y-2">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: 'linear-gradient(135deg, #2d5a27 0%, #1a3015 100%)' }}
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Megaphone size={18} color="white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm uppercase tracking-wide" style={{ color: '#F5C200' }}>{a.title}</p>
                    {a.body && <p className="text-white/70 text-sm mt-0.5 leading-snug">{a.body}</p>}
                    <p className="text-white/40 text-xs mt-1">
                      {new Date(a.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Features */}
        <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2 px-1">All Features</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {mainTiles.map((tile) => (
            <Tile
              key={tile.id}
              data={tile}
              disabled={isRenter && !!tile.ownerOnly}
              onClick={() => navigate(tile.path)}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
          {bottomTiles.map((tile) => (
            <Tile
              key={tile.id}
              data={tile}
              disabled={isRenter && !!tile.ownerOnly}
              onClick={() => navigate(tile.path)}
            />
          ))}
          <LogoTile />
        </div>
      </main>

      {/* Floating chat FAB */}
      <button
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-opacity active:opacity-80"
        style={{ backgroundColor: PRIMARY }}
        onClick={() => navigate('/messages')}
        aria-label="Chat"
      >
        <MessageCircle size={22} color="white" />
      </button>

      {/* Gate toast */}
      {toast && (
        <div
          className="fixed left-4 right-4 max-w-sm mx-auto z-50 transition-all duration-300 ease-out"
          style={{
            bottom: 'calc(5rem + env(safe-area-inset-bottom))',
            transform: toastVisible ? 'translateY(0)' : 'translateY(160%)',
            opacity: toastVisible ? 1 : 0,
          }}
        >
          <div
            className="rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4"
            style={{
              backgroundColor: toast.ok
                ? toast.action === 'enter' ? PRIMARY : AMBER
                : '#c03828',
            }}
          >
            {toast.ok
              ? <CheckCircle size={26} color="white" strokeWidth={2} className="flex-shrink-0" />
              : <AlertCircle size={26} color="white" strokeWidth={2} className="flex-shrink-0" />
            }
            <div>
              <p className="text-white font-bold text-sm leading-snug">
                {toast.ok
                  ? toast.action === 'enter' ? 'Enter gate opened!' : 'Exit gate opened!'
                  : 'Could not reach the gate'}
              </p>
              <p className="text-white/75 text-xs mt-0.5">
                {toast.ok
                  ? 'Please proceed through the gate.'
                  : 'Check your connection and try again.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  )
}
