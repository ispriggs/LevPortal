import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type PassType      = 'visitor' | 'worker' | 'event' | 'other'
export type PassReason    =
  | 'family' | 'friend_guest' | 'domestic_worker' | 'maintenance'
  | 'contractor' | 'delivery' | 'taxi' | 'gardener'
  | 'healthcare' | 'event' | 'esm_staff' | 'other'
export type ApprovalStatus = 'pending' | 'approved' | 'declined'

export type GatePass = {
  id: string
  passCode: string
  type: PassType
  reason: PassReason
  visitorName: string
  email?: string
  phone: string
  visitingLot: string
  extended: boolean
  arrivalDate: string
  departureDate: string
  createdBy: string
  createdAt: string
  idPhotoUrl?: string      // base64 data URL — required for extended passes
  approvalStatus?: ApprovalStatus  // only set for extended passes
}

// approvalStatus is set automatically by the store — callers don't supply it
export type CreatePassData = Omit<GatePass, 'id' | 'passCode' | 'createdAt' | 'approvalStatus'>

export const PASS_TYPE_CONFIG: Record<PassType, { label: string; color: string; bg: string }> = {
  visitor: { label: 'Visitor', color: '#2565a8', bg: '#dbeafe' },
  worker:  { label: 'Worker',  color: '#d08a10', bg: '#fef3c7' },
  event:   { label: 'Event',   color: '#6838b8', bg: '#ede9fe' },
  other:   { label: 'Other',   color: '#6b7280', bg: '#f3f4f6' },
}

export const PASS_REASON_LABELS: Record<PassReason, string> = {
  family:          'Family',
  friend_guest:    'Friend / Guest',
  domestic_worker: 'Domestic Worker',
  maintenance:     'Maintenance / Technician',
  contractor:      'Contractor',
  delivery:        'Delivery / Courier',
  taxi:            'Taxi',
  gardener:        'Gardener',
  healthcare:      'Healthcare / Caregiver',
  event:           'Event',
  esm_staff:       'ESM Staff',
  other:           'Other',
}

export const PASS_REASONS: PassReason[] = [
  'family', 'friend_guest', 'domestic_worker', 'maintenance',
  'contractor', 'delivery', 'taxi', 'gardener',
  'healthcare', 'event', 'esm_staff', 'other',
]

function generatePassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const SAMPLE: GatePass[] = [
  {
    id: 'g1', passCode: 'ABCD1234', type: 'worker', reason: 'maintenance',
    visitorName: 'ICE Technician', phone: '+506 8888-0001',
    visitingLot: '7', extended: false,
    arrivalDate: '2026-05-05', departureDate: '2026-05-05',
    createdBy: 'Ian Spriggs', createdAt: '2026-05-04T09:00:00Z',
  },
  {
    id: 'g2', passCode: 'EFGH5678', type: 'visitor', reason: 'family',
    visitorName: 'Yesnia Spriggs', phone: '+506 8888-0002', email: 'yesnia@example.com',
    visitingLot: '7', extended: true,
    arrivalDate: '2026-06-20', departureDate: '2026-06-25',
    createdBy: 'Ian Spriggs', createdAt: '2026-06-17T14:00:00Z',
    approvalStatus: 'pending',
  },
]

type GateStore = {
  passes: GatePass[]
  createPass:  (data: CreatePassData) => GatePass
  approvePass: (passId: string) => void
  declinePass: (passId: string) => void
}

export const useGateStore = create<GateStore>()(
  persist(
    (set) => ({
      passes: SAMPLE,

      createPass: (data) => {
        const pass: GatePass = {
          id: `g${Date.now()}`,
          passCode: generatePassCode(),
          createdAt: new Date().toISOString(),
          ...data,
          // Extended passes require admin approval before they can be used
          ...(data.extended ? { approvalStatus: 'pending' as ApprovalStatus } : {}),
        }
        set((s) => ({ passes: [pass, ...s.passes] }))
        return pass
      },

      approvePass: (passId) =>
        set((s) => ({
          passes: s.passes.map((p) =>
            p.id !== passId ? p : { ...p, approvalStatus: 'approved' as ApprovalStatus }
          ),
        })),

      declinePass: (passId) =>
        set((s) => ({
          passes: s.passes.map((p) =>
            p.id !== passId ? p : { ...p, approvalStatus: 'declined' as ApprovalStatus }
          ),
        })),
    }),
    { name: 'lev-gate' }
  )
)
