import { useCallback, useEffect, useRef, useState } from 'react'
import { getCaseLedger } from '../../api/cases'

/* ── helpers ────────────────────────────────────────────────────── */

function formatPKR(amount) {
  if (!amount && amount !== 0) return '—'
  if (amount === 0) return '—'
  return `PKR ${Number(amount).toLocaleString('en-PK')}`
}

function formatTime(isoStr) {
  if (!isoStr) return '—'
  return new Date(isoStr).toLocaleString('en-US', {
    month: 'short',
    day:   'numeric',
    hour:  'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function timeAgoSeconds(date) {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / 1000)
}

/* ── type badge styles ──────────────────────────────────────────── */
const TYPE_BADGE = {
  funding:      'bg-green-100 text-green-700',
  release:      'bg-blue-100  text-blue-700',
  verification: 'bg-amber-100 text-amber-700',
  milestone:    'bg-teal-100  text-teal-700',
}

function TypeBadge({ type }) {
  const cls = TYPE_BADGE[type?.toLowerCase()] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {type ?? '—'}
    </span>
  )
}

/* ── main component ─────────────────────────────────────────────── */

export default function LedgerDisplay({ caseId }) {
  const [ledger, setLedger]         = useState(null)   // full API response
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const intervalRef                 = useRef(null)
  const tickRef                     = useRef(null)

  const fetchLedger = useCallback(async () => {
    try {
      const { data } = await getCaseLedger(caseId)
      setLedger(data)
      setLastUpdated(new Date())
      setSecondsAgo(0)
      setError('')
    } catch (err) {
      setError(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        'Failed to load ledger.'
      )
    } finally {
      setLoading(false)
    }
  }, [caseId])

  /* initial fetch + 30-second auto-refresh */
  useEffect(() => {
    fetchLedger()
    intervalRef.current = setInterval(fetchLedger, 30_000)
    return () => clearInterval(intervalRef.current)
  }, [fetchLedger])

  /* "last updated X seconds ago" ticker */
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setSecondsAgo(timeAgoSeconds(lastUpdated) ?? 0)
    }, 1_000)
    return () => clearInterval(tickRef.current)
  }, [lastUpdated])

  const entries     = ledger?.entries ?? ledger?.transactions ?? []
  const chainValid  = ledger?.chain_valid ?? ledger?.chain_integrity?.valid ?? true

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* ── header row ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">Complete Transaction History</h3>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
            </p>
          )}
        </div>

        {/* chain integrity indicator */}
        {chainValid ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                clipRule="evenodd"
              />
            </svg>
            Chain Verified
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Chain Error
          </span>
        )}
      </div>

      {/* ── error banner ── */}
      {error && (
        <div className="mx-5 mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── table ── */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg className="w-12 h-12 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium">No transactions yet</p>
          <p className="text-xs mt-1">Contributions will appear here once recorded.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">From</th>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Hash</th>
                <th className="px-5 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry, idx) => {
                const hash     = entry.transaction_hash ?? entry.hash ?? ''
                const from     = entry.contributor_name ?? entry.from_user ?? entry.from ?? '—'
                const amount   = entry.amount ?? 0
                const type     = entry.transaction_type ?? entry.type ?? ''
                const time     = entry.created_at ?? entry.timestamp ?? ''

                return (
                  <tr key={entry.id ?? idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <TypeBadge type={type} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-[120px] truncate">
                      {from}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {amount === 0 ? '—' : formatPKR(amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      {hash ? (
                        <span
                          title={hash}
                          className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded cursor-help"
                        >
                          {hash.slice(0, 8)}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                      {formatTime(time)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
