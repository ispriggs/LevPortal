import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { GatePass } from '@/store/gateStore'
import { PASS_TYPE_CONFIG, PASS_REASON_LABELS } from '@/store/gateStore'
import { triggerGate } from '@/lib/gate'

const PRIMARY = '#243d20'
const AMBER   = '#d08a10'

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function passStatus(pass: GatePass): 'active' | 'upcoming' | 'expired' {
  const today = new Date().toISOString().slice(0, 10)
  if (today > pass.departureDate) return 'expired'
  if (today < pass.arrivalDate)   return 'upcoming'
  return 'active'
}

export default function PassSharePage() {
  const [params] = useSearchParams()
  const [loading, setLoading] = useState<'enter' | 'exit' | null>(null)
  const [result,  setResult]  = useState<{ action: 'enter' | 'exit'; ok: boolean } | null>(null)

  let pass: GatePass | null = null
  try {
    const v = params.get('v')
    if (v) pass = JSON.parse(atob(v)) as GatePass
  } catch { /* invalid */ }

  async function handleGate(action: 'enter' | 'exit') {
    setLoading(action)
    setResult(null)
    const ok = await triggerGate(action === 'enter')
    setResult({ action, ok })
    setLoading(null)
  }

  if (!pass) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center bg-gray-100 px-6 text-center">
        <p className="text-xl font-bold text-gray-800 mb-2">Invalid Pass</p>
        <p className="text-sm text-gray-500">This link is invalid or may have been corrupted.</p>
        <p className="text-xs text-gray-400 mt-2">Please ask the resident to re-share the pass.</p>
      </div>
    )
  }

  const status  = passStatus(pass)
  const cfg     = PASS_TYPE_CONFIG[pass.type]
  const expired  = status === 'expired'
  const upcoming = status === 'upcoming'
  const pendingApproval = status === 'pending_approval'
  const declined        = status === 'declined'

  return (
    <div className="min-h-svh flex flex-col bg-gray-100 safe-top safe-bottom">

      {/* Community header */}
      <div className="px-6 pt-10 pb-8 text-white" style={{ backgroundColor: PRIMARY }}>
        <p className="text-[11px] font-bold tracking-widest opacity-60 uppercase">Pura Maracay · Ecovilla</p>
        <p className="text-3xl font-black tracking-wide mt-1">GATE PASS</p>
        <div className="mt-3">
          {expired && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
              EXPIRED
            </span>
          )}
          {upcoming && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-400 text-white text-xs font-bold">
              UPCOMING
            </span>
          )}
          {pendingApproval && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-400 text-white text-xs font-bold">
              PENDING APPROVAL
            </span>
          )}
          {declined && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
              DECLINED
            </span>
          )}
          {!expired && !upcoming && !pendingApproval && !declined && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-400 text-white text-xs font-bold">
              ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Pass detail card */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="h-1.5" style={{ backgroundColor: cfg.color }} />
        <div className="p-5 space-y-4">
          {/* Visitor name */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">Visitor</p>
            <p className="text-2xl font-black text-gray-900 leading-tight mt-0.5">{pass.visitorName}</p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}>
              {cfg.label}
            </span>
            <span className="text-sm font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
              {PASS_REASON_LABELS[pass.reason]}
            </span>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Visiting</p>
              <p className="text-base font-bold text-gray-800">Lot {pass.visitingLot}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Valid</p>
              <p className="text-sm font-semibold text-gray-800 leading-snug">
                {pass.extended
                  ? `${fmtDate(pass.arrivalDate)} –\n${fmtDate(pass.departureDate)}`
                  : fmtDate(pass.arrivalDate)}
              </p>
            </div>
            {pass.phone && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Phone</p>
                <p className="text-sm font-semibold text-gray-800">{pass.phone}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Authorised by</p>
              <p className="text-sm font-semibold text-gray-800">{pass.createdBy}</p>
            </div>
          </div>

          {/* Pass code */}
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Pass Code</p>
              <p className="text-xl font-bold font-mono tracking-[0.2em] text-gray-900">{pass.passCode}</p>
            </div>
            <p className="text-[10px] text-gray-400">{fmtDate(pass.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Gate buttons */}
      <div className="mx-4 mt-5 space-y-3">
        {result && (
          <div
            className={`p-4 rounded-2xl text-sm text-center font-semibold ${
              result.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {result.ok
              ? result.action === 'enter'
                ? 'Gate opened for entry — please proceed!'
                : 'Gate opened for exit — safe travels!'
              : 'Could not reach the gate. Please try again or call the resident.'}
          </div>
        )}

        {pendingApproval ? (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 text-center">
            <p className="text-base font-semibold text-amber-700">Awaiting Admin Approval</p>
            <p className="text-sm text-amber-600 mt-1">
              This extended pass must be approved before it can be used. The resident will send you an updated link once approved.
            </p>
          </div>
        ) : declined ? (
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6 text-center">
            <p className="text-base font-semibold text-red-600">Pass Declined</p>
            <p className="text-sm text-red-500 mt-1">This pass was not approved. Please contact the resident.</p>
          </div>
        ) : expired ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-base font-semibold text-gray-600">This pass has expired.</p>
            <p className="text-sm text-gray-400 mt-1">Please contact the resident for a new pass.</p>
          </div>
        ) : upcoming ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <p className="text-base font-semibold text-gray-600">This pass is not yet active.</p>
            <p className="text-sm text-gray-400 mt-1">It becomes valid on {fmtDate(pass.arrivalDate)}.</p>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => handleGate('enter')}
              disabled={!!loading}
              className="flex-1 py-7 rounded-2xl text-white text-2xl font-black disabled:opacity-50 transition-opacity active:opacity-80 shadow-md"
              style={{ backgroundColor: PRIMARY }}
            >
              {loading === 'enter' ? '…' : 'ENTER'}
            </button>
            <button
              onClick={() => handleGate('exit')}
              disabled={!!loading}
              className="flex-1 py-7 rounded-2xl text-white text-2xl font-black disabled:opacity-50 transition-opacity active:opacity-80 shadow-md"
              style={{ backgroundColor: AMBER }}
            >
              {loading === 'exit' ? '…' : 'EXIT'}
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex-1 flex items-end justify-center pb-8 pt-6">
        <p className="text-[10px] text-gray-400 tracking-wider">LEV PORTAL · PURA MARACAY · ECOVILLA</p>
      </div>
    </div>
  )
}
