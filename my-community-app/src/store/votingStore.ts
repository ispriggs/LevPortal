import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type VotingStore = {
  // pollId → optionId the user voted for
  votes: Record<string, string>
  castVote: (pollId: string, optionId: string) => void
}

export const useVotingStore = create<VotingStore>()(
  persist(
    (set) => ({
      votes: {},
      castVote: (pollId, optionId) =>
        set((s) => ({ votes: { ...s.votes, [pollId]: optionId } })),
    }),
    { name: 'lev-votes' }
  )
)
