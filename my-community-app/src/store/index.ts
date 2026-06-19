import { create } from 'zustand'
import type { User } from '@/types'

type AppStore = {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
}))
