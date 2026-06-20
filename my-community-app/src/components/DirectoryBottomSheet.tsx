import { Phone, MapPin, Mail, MessageCircle, X } from 'lucide-react'
import type { Contact } from '@/pages/DirectoryPage'

const PRIMARY = '#243d20'

interface Props {
  contact: Contact | null
  onClose: () => void
}

function Avatar() {
  return (
    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
      <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  )
}

export default function DirectoryBottomSheet({ contact, onClose }: Props) {
  const isOpen = contact !== null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-w-md md:max-w-3xl lg:max-w-5xl mx-auto shadow-2xl transition-transform duration-300 safe-bottom"
        style={{ maxHeight: '85vh', minHeight: '40vh', transform: isOpen ? 'translateY(0)' : 'translateY(100%)' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-4 p-1 text-gray-400"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {contact && (
          <div className="px-6 pt-3 pb-6">
            {/* Contact header */}
            <div className="flex items-center gap-4 mb-5">
              <Avatar />
              <div>
                <h2 className="text-xl font-bold text-gray-900">{contact.name}</h2>
                <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {contact.service}
                </span>
              </div>
            </div>

            {/* Info rows */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <MapPin size={18} color="#22c55e" />
                <span className="text-gray-700">{contact.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} color="#22c55e" />
                <a href={`tel:${contact.phone}`} className="text-gray-700">
                  {contact.phone}
                </a>
              </div>
              {contact.email && (
                <div className="flex items-center gap-3">
                  <Mail size={18} color="#22c55e" />
                  <a href={`mailto:${contact.email}`} className="text-gray-700 text-sm">
                    {contact.email}
                  </a>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <a
                href={`tel:${contact.phone}`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: PRIMARY }}
              >
                <Phone size={16} />
                Call
              </a>
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold bg-green-500"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
