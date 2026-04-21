import { useState } from 'react'
import { fundCase } from '../../api/cases'

const CATEGORY_BADGE = {
  waste:    'bg-red-100 text-red-700',
  drainage: 'bg-blue-100 text-blue-700',
  pothole:  'bg-orange-100 text-orange-700',
}

function formatPKR(amount) {
  if (!amount && amount !== 0) return '—'
  return `PKR ${Number(amount).toLocaleString('en-PK')}`
}

export default function FundingModal({ caseData, onClose, onSuccess }) {
  const [amount, setAmount]           = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [note, setNote]               = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [successData, setSuccessData] = useState(null)

  const totalRaised     = caseData?.total_funds ?? 0
  const contributorCount = caseData?.contributor_count ?? caseData?.funders_count ?? 0
  const categoryKey     = caseData?.category?.toLowerCase() ?? ''
  const badgeCls        = CATEGORY_BADGE[categoryKey] ?? 'bg-gray-100 text-gray-600'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const parsed = parseFloat(amount)
    if (!parsed || parsed < 100) {
      setError('Minimum contribution is PKR 100.')
      return
    }
    if (parsed > 100000) {
      setError('Maximum single contribution is PKR 100,000.')
      return
    }

    setLoading(true)
    try {
      const { data } = await fundCase(caseData.id, {
        amount:       parsed,
        is_anonymous: isAnonymous,
        note:         note.trim() || undefined,
      })
      setSuccessData(data)
      if (onSuccess) onSuccess(data)
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        'Something went wrong. Please try again.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
                {caseData?.title ?? 'Fund This Case'}
              </h2>
              {categoryKey && (
                <span className={`mt-1.5 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${badgeCls}`}>
                  {categoryKey}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Total raised */}
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-primary-600">
              {formatPKR(totalRaised)}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {contributorCount} contributor{contributorCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5">
          {successData ? (
            /* Success state */
            <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-800 font-bold text-lg">Contribution Recorded!</p>
              <p className="text-green-700 text-2xl font-extrabold">
                {formatPKR(successData.amount)}
              </p>
              <div className="bg-white rounded-lg px-4 py-3 border border-green-200 text-left">
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wide">Transaction Hash</p>
                <p className="font-mono text-sm text-gray-800 break-all">
                  {successData.hash
                    ? successData.hash.slice(0, 16)
                    : '—'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 w-full py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            /* Form state */
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Amount (PKR)
                </label>
                <input
                  type="number"
                  min={100}
                  max={100000}
                  step={50}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum PKR 100"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-gray-900 placeholder-gray-400 transition"
                />
              </div>

              {/* Anonymous checkbox */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 accent-primary-600 cursor-pointer"
                />
                <span className="text-sm text-gray-700">Donate anonymously</span>
              </label>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Add a note <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write an encouraging message…"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-gray-900 placeholder-gray-400 transition resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 active:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? 'Processing…' : 'Confirm Contribution'}
              </button>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Your contribution is locked until milestone completion. All transactions are permanently recorded on the ledger.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
