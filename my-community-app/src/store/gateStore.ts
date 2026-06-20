import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

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
  idPhotoUrl?: string
  approvalStatus?: ApprovalStatus
}

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

async function fetchNameMap(uids: string[]): Promise<Record<string, string>> {
  if (!uids.length) return {}
  const { data } = await supabase.from('profiles').select('id, full_name').in('id', uids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.full_name]))
}

function fromRow(row: any, nameMap: Record<string, string>): GatePass {
  return {
    id:             row.id,
    passCode:       row.pass_code,
    type:           row.type as PassType,
    reason:         row.reason as PassReason,
    visitorName:    row.visitor_name,
    email:          row.email ?? undefined,
    phone:          row.phone,
    visitingLot:    row.visiting_lot,
    extended:       row.extended,
    arrivalDate:    row.arrival_date,
    departureDate:  row.departure_date,
    createdBy:      nameMap[row.created_by] ?? 'Unknown',
    createdAt:      row.created_at,
    idPhotoUrl:     row.id_photo_url ?? undefined,
    approvalStatus: row.approval_status ?? undefined,
  }
}

type GateStore = {
  passes:      GatePass[]
  loading:     boolean
  fetchPasses: () => Promise<void>
  createPass:  (data: CreatePassData) => Promise<GatePass | null>
  approvePass: (passId: string) => Promise<void>
  declinePass: (passId: string) => Promise<void>
}

export const useGateStore = create<GateStore>()((set) => ({
  passes:  [],
  loading: false,

  fetchPasses: async () => {
    set({ loading: true })

    // Delete passes whose departure date has already passed
    const today = new Date().toISOString().slice(0, 10)
    await supabase.from('gate_passes').delete().lt('departure_date', today)

    const { data: rows } = await supabase
      .from('gate_passes')
      .select('*')
      .order('created_at', { ascending: false })
    if (!rows) { set({ loading: false }); return }

    const uids = [...new Set(rows.map((r) => r.created_by).filter(Boolean))]
    const nameMap = await fetchNameMap(uids)
    set({ passes: rows.map((r) => fromRow(r, nameMap)), loading: false })
  },

  createPass: async (data) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const passCode = generatePassCode()
    const { data: row, error } = await supabase
      .from('gate_passes')
      .insert({
        pass_code:       passCode,
        type:            data.type,
        reason:          data.reason,
        visitor_name:    data.visitorName,
        email:           data.email ?? null,
        phone:           data.phone,
        visiting_lot:    data.visitingLot,
        extended:        data.extended,
        arrival_date:    data.arrivalDate,
        departure_date:  data.departureDate,
        created_by:      user.id,
        id_photo_url:    data.idPhotoUrl ?? null,
        approval_status: data.extended ? 'pending' : null,
      })
      .select()
      .single()

    if (error || !row) return null

    const pass = fromRow(row, { [user.id]: data.createdBy })
    set((s) => ({ passes: [pass, ...s.passes] }))
    return pass
  },

  approvePass: async (passId) => {
    await supabase.from('gate_passes').update({ approval_status: 'approved' }).eq('id', passId)
    set((s) => ({
      passes: s.passes.map((p) =>
        p.id === passId ? { ...p, approvalStatus: 'approved' as ApprovalStatus } : p
      ),
    }))
  },

  declinePass: async (passId) => {
    await supabase.from('gate_passes').delete().eq('id', passId)
    set((s) => ({
      passes: s.passes.filter((p) => p.id !== passId),
    }))
  },
}))
