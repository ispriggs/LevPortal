import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

interface ToastStore {
  message: string
  type: ToastType
  visible: boolean
  showToast: (message: string, type?: ToastType) => void
}

let timer: ReturnType<typeof setTimeout> | null = null

export const useToastStore = create<ToastStore>((set) => ({
  message: '',
  type: 'success',
  visible: false,
  showToast: (message, type = 'success') => {
    if (timer) clearTimeout(timer)
    set({ message, type, visible: true })
    timer = setTimeout(() => set({ visible: false }), 3200)
  },
}))
