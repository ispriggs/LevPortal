import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

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

async function fetchNameMap(uids: string[]): Promise<Record<string, string>> {
  if (!uids.length) return {}
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', uids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]))
}

async function getSessionUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

type MessagesStore = {
  threads:      MessageThread[]
  loading:      boolean
  fetchThreads: () => Promise<void>
  startThread:  (subject: string, to: string, from: string, text: string) => Promise<void>
  reply:        (threadId: string, from: string, text: string) => Promise<void>
}

export const useMessagesStore = create<MessagesStore>()((set) => ({
  threads: [],
  loading: false,

  fetchThreads: async () => {
    set({ loading: true })
    const user = await getSessionUser()
    if (!user) { set({ loading: false }); return }

    const { data: myParticipations } = await supabase
      .from('message_participants')
      .select('thread_id')
      .eq('user_id', user.id)

    const threadIds = (myParticipations ?? []).map((p) => p.thread_id)
    if (!threadIds.length) { set({ threads: [], loading: false }); return }

    const [{ data: threadRows }, { data: partRows }, { data: msgRows }] = await Promise.all([
      supabase.from('message_threads').select('*').in('id', threadIds).order('updated_at', { ascending: false }),
      supabase.from('message_participants').select('thread_id, user_id').in('thread_id', threadIds),
      supabase.from('message_items').select('*').in('thread_id', threadIds).order('sent_at', { ascending: true }),
    ])

    if (!threadRows) { set({ loading: false }); return }

    const allUids = [
      ...new Set([
        ...(partRows ?? []).map((p) => p.user_id),
        ...(msgRows ?? []).map((m) => m.from_id),
      ].filter(Boolean))
    ]
    const nameMap = await fetchNameMap(allUids)

    const threads: MessageThread[] = threadRows.map((t) => ({
      id:           t.id,
      subject:      t.subject,
      createdAt:    t.created_at,
      updatedAt:    t.updated_at,
      participants: (partRows ?? [])
        .filter((p) => p.thread_id === t.id)
        .map((p) => nameMap[p.user_id] ?? 'Unknown'),
      messages: (msgRows ?? [])
        .filter((m) => m.thread_id === t.id)
        .map((m) => ({
          id:     m.id,
          from:   nameMap[m.from_id] ?? 'Unknown',
          text:   m.text,
          sentAt: m.sent_at,
        })),
    }))

    set({ threads, loading: false })
  },

  startThread: async (subject, to, _from, text) => {
    const user = await getSessionUser()
    if (!user) return

    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('full_name', to)
      .single()

    if (!recipientProfile) return

    const { data: thread, error } = await supabase.rpc('start_message_thread', {
      p_subject: subject,
      p_to_user_id: recipientProfile.id,
      p_text: text,
    })

    if (error || !thread) { console.error('startThread rpc error', error); return }

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const senderName = senderProfile?.full_name ?? 'Unknown'

    const newThread: MessageThread = {
      id:           thread.id,
      subject:      thread.subject,
      createdAt:    thread.created_at,
      updatedAt:    thread.updated_at,
      participants: [senderName, recipientProfile.full_name],
      messages: [{
        id:     `${Date.now()}`,
        from:   senderName,
        text,
        sentAt: new Date().toISOString(),
      }],
    }
    set((s) => ({ threads: [newThread, ...s.threads] }))
  },

  reply: async (threadId, from, text) => {
    const user = await getSessionUser()
    if (!user) return

    const { data: msgRow } = await supabase
      .from('message_items')
      .insert({ thread_id: threadId, from_id: user.id, text })
      .select()
      .single()

    const now = new Date().toISOString()
    const msg: ThreadMessage = {
      id:     msgRow?.id ?? `${Date.now()}`,
      from,
      text,
      sentAt: msgRow?.sent_at ?? now,
    }
    set((s) => ({
      threads: s.threads.map((t) =>
        t.id !== threadId
          ? t
          : { ...t, messages: [...t.messages, msg], updatedAt: now }
      ),
    }))
  },
}))
