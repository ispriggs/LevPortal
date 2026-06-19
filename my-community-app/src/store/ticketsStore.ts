import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

// ── Sample data ───────────────────────────────────────────────────────────

const SAMPLE: Ticket[] = [
  {
    id: 't1',
    ticketNumber: 'TKT-0001',
    category: 'fault',
    subject: 'Pool pump broken',
    description: 'The main pool pump stopped working yesterday morning. The pool is completely unusable and we have guests visiting this weekend.',
    priority: 'high',
    status: 'open',
    submittedBy: 'Jessica Scully',
    unit: '5',
    createdAt: '2026-06-19T07:00:00Z',
    history: [],
  },
  {
    id: 't2',
    ticketNumber: 'TKT-0002',
    category: 'fault',
    subject: 'Streetlight out – path to Lot 15',
    description: 'The path light near lot 15 has been out for 3 nights. It is a real safety concern when walking at night and we have children in the community.',
    priority: 'medium',
    status: 'in_progress',
    submittedBy: 'Carlos Mendez',
    unit: '12',
    createdAt: '2026-06-18T20:00:00Z',
    history: [
      { id: 'h1', type: 'status_change', actor: 'Admin', isAdmin: true, fromStatus: 'open', toStatus: 'in_progress', createdAt: '2026-06-19T08:00:00Z' },
      { id: 'h2', type: 'comment', actor: 'Admin', isAdmin: true, text: 'We have contacted the electrician and they will be on site tomorrow morning to replace the bulb and check the wiring.', createdAt: '2026-06-19T08:05:00Z' },
    ],
  },
  {
    id: 't3',
    ticketNumber: 'TKT-0003',
    category: 'complaint',
    subject: 'Noise complaint – Lot 8',
    description: 'There has been repeated loud music after 11pm on weekends from Lot 8. I have spoken to the resident directly but nothing has changed over the past 3 weekends.',
    priority: 'low',
    status: 'open',
    submittedBy: 'Maria Santos',
    unit: '3',
    createdAt: '2026-06-17T23:00:00Z',
    history: [],
  },
  {
    id: 't4',
    ticketNumber: 'TKT-0004',
    category: 'request',
    subject: 'Grass cutting overdue in common area',
    description: 'The grass in the main common area near the entrance has not been cut in over 3 weeks and is becoming very overgrown.',
    priority: 'low',
    status: 'resolved',
    submittedBy: 'Ian Spriggs',
    unit: '7',
    createdAt: '2026-06-10T09:00:00Z',
    history: [
      { id: 'h3', type: 'status_change', actor: 'Admin', isAdmin: true, fromStatus: 'open', toStatus: 'in_progress', createdAt: '2026-06-11T08:00:00Z' },
      { id: 'h4', type: 'comment', actor: 'Admin', isAdmin: true, text: 'The gardening team has been assigned and will take care of the common area this Thursday.', createdAt: '2026-06-11T08:10:00Z' },
      { id: 'h5', type: 'comment', actor: 'Ian Spriggs', isAdmin: false, text: 'Thank you for the quick response!', createdAt: '2026-06-11T09:00:00Z' },
      { id: 'h6', type: 'status_change', actor: 'Admin', isAdmin: true, fromStatus: 'in_progress', toStatus: 'resolved', createdAt: '2026-06-12T16:00:00Z' },
      { id: 'h7', type: 'comment', actor: 'Admin', isAdmin: true, text: 'The common area has been fully cut and tidied. Thank you for bringing this to our attention!', createdAt: '2026-06-12T16:05:00Z' },
    ],
  },
  {
    id: 't5',
    ticketNumber: 'TKT-0005',
    category: 'idea',
    subject: 'Install a physical community notice board',
    description: 'A physical notice board near the main entrance where residents can post community announcements, lost and found, local services, and event flyers would be a great addition.',
    priority: 'low',
    status: 'open',
    submittedBy: 'Ian Spriggs',
    unit: '7',
    createdAt: '2026-06-15T14:00:00Z',
    history: [],
  },
]

// ── Store ─────────────────────────────────────────────────────────────────

type TicketsStore = {
  tickets: Ticket[]
  nextNumber: number
  submitTicket: (data: SubmitTicketData) => string   // returns ticket number
  updateStatus: (ticketId: string, newStatus: TicketStatus, actor: string) => void
  addComment: (ticketId: string, actor: string, text: string, isAdmin: boolean) => void
}

export const useTicketsStore = create<TicketsStore>()(
  persist(
    (set, get) => ({
      tickets: SAMPLE,
      nextNumber: 6,

      submitTicket: (data) => {
        const num = get().nextNumber
        const ticketNumber = `TKT-${String(num).padStart(4, '0')}`
        const ticket: Ticket = {
          id: `${Date.now()}`,
          ticketNumber,
          ...data,
          status: 'open',
          createdAt: new Date().toISOString(),
          history: [],
        }
        set((s) => ({ tickets: [ticket, ...s.tickets], nextNumber: s.nextNumber + 1 }))
        return ticketNumber
      },

      updateStatus: (ticketId, newStatus, actor) =>
        set((s) => ({
          tickets: s.tickets.map((t) => {
            if (t.id !== ticketId) return t
            const entry: TicketHistoryEntry = {
              id: `${Date.now()}h`,
              type: 'status_change',
              actor,
              isAdmin: true,
              fromStatus: t.status,
              toStatus: newStatus,
              createdAt: new Date().toISOString(),
            }
            return { ...t, status: newStatus, history: [...t.history, entry] }
          }),
        })),

      addComment: (ticketId, actor, text, isAdmin) =>
        set((s) => ({
          tickets: s.tickets.map((t) => {
            if (t.id !== ticketId) return t
            const entry: TicketHistoryEntry = {
              id: `${Date.now()}c`,
              type: 'comment',
              actor,
              isAdmin,
              text,
              createdAt: new Date().toISOString(),
            }
            return { ...t, history: [...t.history, entry] }
          }),
        })),
    }),
    { name: 'lev-tickets' }
  )
)
