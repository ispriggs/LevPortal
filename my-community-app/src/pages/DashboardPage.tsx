import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PhoneCall, Mail, Newspaper, FileText,
  BarChart2, CalendarDays, MessageCircle, QrCode,
  ClipboardList, ShieldAlert, Users, Waves,
  Leaf, Footprints, User,
  LogIn, LogOut, Megaphone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuthStore, getDisplayName, getRole } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { triggerGate } from '@/lib/gate'
import ProfileSheet from '@/components/ProfileSheet'
import { useToastStore } from '@/store/toastStore'
import maracuyaImg from '@/assets/maracuya-image.avif'

const PRIMARY = '#243d20'
const PAGE_BG = '#f0f0ec'

type TileData = {
  id: string
  label: string
  Icon: LucideIcon
  bg: string
  color: string
  path: string
  ownerOnly?: boolean
  adminOnly?: boolean
}

const BADGE_STORAGE_KEY = 'lev_tile_visited'

function getTileLastVisited(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(BADGE_STORAGE_KEY) ?? '{}') } catch { return {} }
}

async function safeCount(q: PromiseLike<{ count: number | null; error: unknown }>): Promise<number> {
  try { const r = await q; return r.count ?? 0 } catch { return 0 }
}

async function fetchBadgeCounts(): Promise<Record<string, number>> {
  const lv = getTileLastVisited()
  const iso = (id: string) => new Date(lv[id] ?? 0).toISOString()

  const [news, docs, tickets, passes, proposals, directory, adminDocs, adminPasses, adminTickets, adminProposals] =
    await Promise.all([
      safeCount(supabase.from('news_posts').select('id', { count: 'exact', head: true }).gt('created_at', iso('news'))),
      safeCount(supabase.from('documents').select('id', { count: 'exact', head: true }).gt('created_at', iso('documents'))),
      safeCount(supabase.from('tickets').select('id', { count: 'exact', head: true }).gt('created_at', iso('neighbours'))),
      safeCount(supabase.from('gate_passes').select('id', { count: 'exact', head: true }).gt('created_at', iso('gate'))),
      safeCount(supabase.from('proposals').select('id', { count: 'exact', head: true }).gt('created_at', iso('proposals'))),
      safeCount(supabase.from('directory_services').select('id', { count: 'exact', head: true }).gt('created_at', iso('directory'))),
      safeCount(supabase.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending').gt('created_at', iso('admin'))),
      safeCount(supabase.from('gate_passes').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending').eq('extended', true).gt('created_at', iso('admin'))),
      safeCount(supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open').gt('created_at', iso('admin'))),
      safeCount(supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending').gt('created_at', iso('admin'))),
    ])

  return {
    news,
    documents: docs,
    neighbours: tickets,
    gate: passes,
    proposals,
    directory,
    admin: adminDocs + adminPasses + adminTickets + adminProposals,
  }
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
  { id: 'admin', label: 'Admin', Icon: Users, bg: '#eeada0', color: '#c03828', path: '/admin', adminOnly: true },
  { id: 'amenities', label: 'Amenities', Icon: Waves, bg: '#c5b5e0', color: '#6838b8', path: '/amenities' },
  { id: 'flora', label: 'Flora &\nFauna', Icon: Leaf, bg: '#a5cf95', color: '#358028', path: '/flora-fauna' },
  { id: 'hiking', label: 'Hiking', Icon: Footprints, bg: '#95bdd8', color: '#2565a8', path: '/hiking' },
]

function Tile({
  data, badge, disabled, onClick,
}: {
  data: TileData
  badge: number
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
      {badge > 0 && !disabled && (
        <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
          {badge > 99 ? '99+' : badge}
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
      <img
        src={maracuyaImg}
        alt="Maracuya"
        className="w-4/5 h-4/5 object-contain rounded-lg"
      />
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
  const showToast = useToastStore((s) => s.showToast)
  const [profileOpen, setProfileOpen] = useState(false)
  const [enterCooldown, setEnterCooldown] = useState(false)
  const [exitCooldown, setExitCooldown] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [badges, setBadges] = useState<Record<string, number>>({})

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, title, body, created_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setAnnouncements(data) })

    fetchBadgeCounts().then(setBadges)
  }, [])

  function handleTileClick(tile: TileData) {
    const lv = getTileLastVisited()
    localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify({ ...lv, [tile.id]: Date.now() }))
    setBadges((b) => ({ ...b, [tile.id]: 0 }))
    navigate(tile.path)
  }

  async function handleGate(action: 'enter' | 'exit') {
    // Disable the tapped button for 5 s â€” independent per gate
    if (action === 'enter') {
      setEnterCooldown(true)
      setTimeout(() => setEnterCooldown(false), 5000)
    } else {
      setExitCooldown(true)
      setTimeout(() => setExitCooldown(false), 5000)
    }

    const ok = await triggerGate(action === 'enter')
    if (ok) {
      showToast(action === 'enter' ? 'Enter gate opened! Please proceed.' : 'Exit gate opened! Safe travels.')
    } else {
      showToast('Could not reach the gate — check your connection.', 'error')
    }
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
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: PAGE_BG }}>

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
              {roleBadge}{lot ? ` Â· Lot ${lot}` : ''}
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
          <div className="flex gap-2.5">
            <button
              onClick={() => handleGate('enter')}
              disabled={enterCooldown}
              className="flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-opacity active:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: '#0ac010', color: '#1a3a18' }}
            >
              <LogIn size={18} strokeWidth={2.5} />
              Enter
            </button>

            <button
              onClick={() => handleGate('exit')}
              disabled={exitCooldown}
              className="flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-opacity active:opacity-80 disabled:opacity-40"
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
              badge={badges[tile.id] ?? 0}
              disabled={isRenter && !!tile.ownerOnly}
              onClick={() => handleTileClick(tile)}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
          {bottomTiles.map((tile) => (
            <Tile
              key={tile.id}
              data={tile}
              badge={badges[tile.id] ?? 0}
              disabled={isRenter && !!tile.ownerOnly}
              onClick={() => handleTileClick(tile)}
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


      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  )
}

