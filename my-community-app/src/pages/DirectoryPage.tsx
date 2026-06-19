import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Plus } from 'lucide-react'
import DirectoryBottomSheet from '@/components/DirectoryBottomSheet'
import AddServiceSheet, { type FormData } from '@/components/AddServiceSheet'

const PRIMARY = '#243d20'
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export type Contact = {
  id: string
  name: string
  service: string
  location: string
  phone: string
  email?: string
  whatsapp?: string
}

// Temporary mock data — will be replaced with Supabase query
const MOCK_SERVICES: Contact[] = [
  { id: '1', name: 'Milton',           service: 'Taxi',             location: 'Atenas',  phone: '+506 6017 2967', whatsapp: '+50660172967' },
  { id: '2', name: 'Louis',            service: 'Car Hire',         location: 'Atenas',  phone: '+506 6004 774' },
  { id: '3', name: 'Jessica Scully',   service: 'Acupuncture',      location: 'LEV',     phone: '+1 484 834 5472', email: 'jessica@example.com' },
  { id: '4', name: 'Flanders',         service: 'Electrician',      location: 'Orotina', phone: '+506 8702 4502', whatsapp: '+50687024502' },
  { id: '5', name: 'Ian Spriggs',      service: 'Handyman',         location: 'LEV',     phone: '+506 1234 5678' },
  { id: '6', name: 'Chantelle Spriggs',service: 'Property Manager', location: 'LEV',     phone: '+506 8765 4321', email: 'chantelle@lev.cr' },
]

const MOCK_USERS: Contact[] = [
  { id: 'u1', name: 'Ian Spriggs',       service: 'Lot 4',  location: 'LEV', phone: '+506 1234 5678' },
  { id: 'u2', name: 'Chantelle Spriggs', service: 'Lot 4',  location: 'LEV', phone: '+506 8765 4321', email: 'chantelle@lev.cr' },
  { id: 'u3', name: 'Jessica Scully',    service: 'Lot 12', location: 'LEV', phone: '+1 484 834 5472', email: 'jessica@example.com' },
  { id: 'u4', name: 'Louis Martin',      service: 'Lot 7',  location: 'LEV', phone: '+506 6004 774' },
]

function Avatar() {
  return (
    <div className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  )
}

function ContactCard({ contact, onClick }: { contact: Contact; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 p-3 space-y-2 active:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Avatar />
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight">{contact.name}</p>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-0.5 inline-block">
            {contact.service}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MapPin size={13} color="#22c55e" className="flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate">{contact.location}</span>
      </div>
      <div className="flex items-center gap-2">
        <Phone size={13} color="#22c55e" className="flex-shrink-0" />
        <span className="text-xs text-gray-500 truncate">{contact.phone}</span>
      </div>
    </button>
  )
}

export default function DirectoryPage() {
  const navigate = useNavigate()
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [mode, setMode] = useState<'services' | 'users'>('services')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [services, setServices] = useState<Contact[]>(MOCK_SERVICES)

  const sourceList = mode === 'services' ? services : MOCK_USERS

  function handleSave(data: FormData) {
    const newContact: Contact = {
      id: Date.now().toString(),
      name: data.name,
      service: data.service,
      location: data.location,
      phone: data.phone,
      email: data.email || undefined,
      whatsapp: data.whatsapp || undefined,
    }
    setServices((prev) => [...prev, newContact])
  }

  const filtered = useMemo(() => {
    return sourceList.filter((c) =>
      !activeLetter ||
      c.name.toUpperCase().startsWith(activeLetter) ||
      c.service.toUpperCase().startsWith(activeLetter)
    )
  }, [activeLetter, mode, sourceList])

  return (
    <div className="min-h-svh flex flex-col bg-gray-50">

      {/* Top bar with back arrow */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-3 safe-top">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1" aria-label="Back">
          <ArrowLeft size={22} color="#111" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6">

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900">Community Directory</h1>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Filter by service or user first. Then tap a letter (A–Z) to filter by name/service.
        </p>

        {/* Service filter + Add button */}
        <div className="flex gap-2 mb-4">
          <select
            value={mode}
            onChange={(e) => { setMode(e.target.value as 'services' | 'users'); setActiveLetter(null) }}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white outline-none"
          >
            <option value="services">Services</option>
            <option value="users">Users</option>
          </select>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-white text-sm font-semibold whitespace-nowrap"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={15} />
            Add Service
          </button>
        </div>

        {/* A–Z alphabet bar */}
        <div className="flex overflow-x-auto scrollbar-none gap-0.5 mb-4 -mx-4 px-4">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(activeLetter === letter ? null : letter)}
              className="flex-shrink-0 w-7 h-7 text-xs font-semibold rounded transition-colors"
              style={
                activeLetter === letter
                  ? { backgroundColor: PRIMARY, color: 'white' }
                  : { color: '#374151' }
              }
            >
              {letter}
            </button>
          ))}
          <button
            onClick={() => setActiveLetter(null)}
            className="flex-shrink-0 px-2.5 h-7 text-xs font-bold rounded ml-1 text-white"
            style={{ backgroundColor: !activeLetter ? PRIMARY : '#9ca3af' }}
          >
            All
          </button>
        </div>

        {/* Emergency + Org Chart buttons */}
        <div className="flex gap-3 mb-4">
          <button className="flex-1 py-2.5 rounded-lg border-2 border-red-500 text-red-500 text-xs font-bold tracking-wide active:opacity-80">
            EMERGENCY CONTACTS
          </button>
          <button
            className="flex-1 py-2.5 rounded-lg border-2 text-xs font-semibold active:opacity-80"
            style={{ borderColor: PRIMARY, color: PRIMARY }}
          >
            LEV Org. Chart
          </button>
        </div>

        {/* Contact grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() => setSelected(contact)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm mt-8">No contacts found.</p>
        )}
      </div>

      {/* Contact detail sheet */}
      <DirectoryBottomSheet
        contact={selected}
        onClose={() => setSelected(null)}
      />

      {/* Add service sheet */}
      <AddServiceSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}
