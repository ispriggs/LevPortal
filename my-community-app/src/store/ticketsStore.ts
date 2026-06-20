import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export type TicketCategory = 'fault' | 'request' | 'complaint' | 'idea'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed'

export type TicketHistoryEntry = {
  id: string
  type: 'status_change' | 'comment'
  actor: string
  isAdmin: boolean
  text?: string
  fromStatus?: TicketStatus
  toStatus?: TicketStatus
  createdAt: string
}

export type Ticket = {
  id: string
  ticketNumber: string
  category: TicketCategory
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  submittedBy: string
  unit: string
  createdAt: string
  attachmentUrl?: string
  history: TicketHistoryEntry[]
}

export type SubmitTicketData = {
  category: TicketCategory
  subject: string
  description: string
  priority: TicketPriority
  submittedBy: string
  unit: string
  attachmentUrl?: string
}

async function fetchNameMap(uids: string[]): Promise<Record<string, string>> {
  if (!uids.length) return {}
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', uids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]))
}

function historyFromRow(row: any, nameMap: Record<string, string>): TicketHistoryEntry {
  return {
    id:          row.id,
    type:        row.type as 'status_change' | 'comment',
    actor:       nameMap[row.actor_id] ?? 'Unknown',
    isAdmin:     row.is_admin,
    text:        row.text ?? undefined,
    fromStatus:  row.from_status ?? undefined,
    toStatus:    row.to_status ?? undefined,
    createdAt:   row.created_at,
  }
}

function ticketFromRow(
  row: any,
  nameMap: Record<string, string>,
  historyRows: any[]
): Ticket {
  return {
    id:            row.id,
    ticketNumber:  row.ticket_number,
    category:      row.category as TicketCategory,
    subject:       row.subject,
    description:   row.description,
    priority:      row.priority as TicketPriority,
    status:        row.status as TicketStatus,
    submittedBy:   nameMap[row.submitted_by] ?? 'Unknown',
    unit:          row.unit,
    createdAt:     row.created_at,
    attachmentUrl: row.attachment_url ?? undefined,
    history:       historyRows
      .filter((h) => h.ticket_id === row.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((h) => historyFromRow(h, nameMap)),
  }
}

type TicketsStore = {
  tickets: Ticket[]
  loading: boolean
  fetchTickets:  () => Promise<void>
  submitTicket:  (data: SubmitTicketData) => Promise<string | null>
  updateStatus:  (ticketId: string, newStatus: TicketStatus, actor: string) => Promise<void>
  addComment:    (ticketId: string, actor: string, text: string, isAdmin: boolean) => Promise<void>
  deleteTicket:  (ticketId: string) => Promise<void>
}

export const useTicketsStore = create<TicketsStore>()((set, get) => ({
  tickets: [],
  loading: false,

  fetchTickets: async () => {
    set({ loading: true })
    const [{ data: rows }, { data: histRows }] = await Promise.all([
      supabase.from('tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('ticket_history').select('*').order('created_at', { ascending: true }),
    ])
    if (!rows) { set({ loading: false }); return }

    const hist = histRows ?? []
    const uids = [
      ...new Set([
        ...rows.map((r) => r.submitted_by),
        ...hist.map((h) => h.actor_id),
      ].filter(Boolean))
    ]
    const nameMap = await fetchNameMap(uids)
    set({ tickets: rows.map((r) => ticketFromRow(r, nameMap, hist)), loading: false })
  },

  submitTicket: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: row, error } = await supabase
      .from('tickets')
      .insert({
        category:       data.category,
        subject:        data.subject,
        description:    data.description,
        priority:       data.priority,
        status:         'open',
        submitted_by:   user.id,
        unit:           data.unit,
        attachment_url: data.attachmentUrl ?? null,
      })
      .select()
      .single()

    if (error || !row) return null

    const ticket = ticketFromRow(row, { [user.id]: data.submittedBy }, [])
    set((s) => ({ tickets: [ticket, ...s.tickets] }))
    return row.ticket_number as string
  },

  updateStatus: async (ticketId, newStatus, actor) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ticket = get().tickets.find((t) => t.id === ticketId)
    const fromStatus = ticket?.status

    const { data: hRow } = await supabase
      .from('ticket_history')
      .insert({
        ticket_id:   ticketId,
        type:        'status_change',
        actor_id:    user.id,
        is_admin:    true,
        from_status: fromStatus ?? null,
        to_status:   newStatus,
      })
      .select()
      .single()

    await supabase.from('tickets').update({ status: newStatus }).eq('id', ticketId)

    if (!hRow) return
    const entry: TicketHistoryEntry = {
      id:          hRow.id,
      type:        'status_change',
      actor,
      isAdmin:     true,
      fromStatus,
      toStatus:    newStatus,
      createdAt:   hRow.created_at,
    }
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id !== ticketId ? t : { ...t, status: newStatus, history: [...t.history, entry] }
      ),
    }))
  },

  addComment: async (ticketId, actor, text, isAdmin) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: hRow } = await supabase
      .from('ticket_history')
      .insert({
        ticket_id: ticketId,
        type:      'comment',
        actor_id:  user.id,
        is_admin:  isAdmin,
        text,
      })
      .select()
      .single()

    if (!hRow) return
    const entry: TicketHistoryEntry = {
      id:        hRow.id,
      type:      'comment',
      actor,
      isAdmin,
      text,
      createdAt: hRow.created_at,
    }
    set((s) => ({
      tickets: s.tickets.map((t) =>
        t.id !== ticketId ? t : { ...t, history: [...t.history, entry] }
      ),
    }))
  },

  deleteTicket: async (ticketId) => {
    await supabase.from('tickets').delete().eq('id', ticketId)
    set((s) => ({
      tickets: s.tickets.filter((t) => t.id !== ticketId),
    }))
  },
}))
