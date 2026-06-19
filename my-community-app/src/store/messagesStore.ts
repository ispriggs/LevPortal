import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThreadMessage = {
  id: string
  from: string
  text: string
  sentAt: string
}

export type MessageThread = {
  id: string
  subject: string
  participants: string[]   // display names
  messages: ThreadMessage[]
  createdAt: string
  updatedAt: string
}

type MessagesStore = {
  threads: MessageThread[]
  startThread: (subject: string, to: string, from: string, text: string) => void
  reply: (threadId: string, from: string, text: string) => void
}

export const useMessagesStore = create<MessagesStore>()(
  persist(
    (set) => ({
      threads: [],

      startThread: (subject, to, from, text) =>
        set((s) => ({
          threads: [
            {
              id: `${Date.now()}`,
              subject,
              participants: [from, to],
              messages: [{ id: `${Date.now()}m`, from, text, sentAt: new Date().toISOString() }],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...s.threads,
          ],
        })),

      reply: (threadId, from, text) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id !== threadId
              ? t
              : {
                  ...t,
                  messages: [
                    ...t.messages,
                    { id: `${Date.now()}m`, from, text, sentAt: new Date().toISOString() },
                  ],
                  updatedAt: new Date().toISOString(),
                }
          ),
        })),
    }),
    { name: 'lev-messages' }
  )
)
