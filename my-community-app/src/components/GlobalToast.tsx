import { CheckCircle, XCircle, Info } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'

const BG = { success: '#243d20', error: '#c03828', info: '#1e40af' }

export default function GlobalToast() {
  const { message, type, visible } = useToastStore()

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info

  return (
    <div
      className="fixed left-4 right-4 max-w-sm mx-auto z-[9999] pointer-events-none"
      style={{
        bottom: 'calc(5rem + env(safe-area-inset-bottom))',
        transform: visible ? 'translateY(0)' : 'translateY(200%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease',
      }}
    >
      <div
        className="rounded-2xl px-4 py-3.5 shadow-2xl flex items-center gap-3"
        style={{ backgroundColor: BG[type] }}
      >
        <Icon size={20} color="white" strokeWidth={2.5} className="flex-shrink-0" />
        <p className="text-white font-semibold text-sm leading-snug">{message}</p>
      </div>
    </div>
  )
}
