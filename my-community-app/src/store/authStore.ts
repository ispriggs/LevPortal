import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'

export type UserRole = 'owner' | 'renter'

type AuthStore = {
  user: User | null
  session: Session | null
  initialized: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  setSession: (session: Session | null) => void
  setIsAdmin: (v: boolean) => void
  mockLogin: (name: string, role: UserRole) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  initialized: false,
  isAuthenticated: false,
  isAdmin: false,
  setSession: (session) =>
    set({ session, user: session?.user ?? null, initialized: true, isAuthenticated: !!session }),
  setIsAdmin: (v) => set({ isAdmin: v }),
  mockLogin: (name, role) =>
    set({
      initialized: true,
      isAuthenticated: true,
      isAdmin: false,
      user: { user_metadata: { full_name: name, role } } as unknown as User,
      session: null,
    }),
  logout: () => set({ user: null, session: null, isAuthenticated: false, isAdmin: false }),
}))

export function getDisplayName(user: User | null): string {
  return (
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    'Resident'
  )
}

export function getRole(user: User | null): UserRole {
  return user?.user_metadata?.role ?? 'renter'
}
