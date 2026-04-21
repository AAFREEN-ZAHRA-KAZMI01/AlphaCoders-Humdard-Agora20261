import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LocationPreview from '../components/map/LocationPreview'
import FundingModal from '../components/funding/FundingModal'
import LedgerDisplay from '../components/funding/LedgerDisplay'
import { useAuthStore } from '../store/authStore'
import { getCase, getCaseTransparency, completeMilestone } from '../api/cases'

/* ── badge helpers ──────────────────────────────────────────────── */

const CATEGORY_BADGE = {
  waste:    'bg-red-100 text-red-700',
  drainage: 'bg-blue-100 text-blue-700',
  pothole:  'bg-orange-100 text-orange-700',
}

const STATUS_BADGE = {
  reported:    'bg-gray-100 text-gray-600',
  verified:    'bg-amber-100 text-amber-700',
  funded:      'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved:    'bg-teal-100 text-teal-700',
}

function formatPKR(n) {
  if (!n && n !== 0) return 'PKR 0'
  return `PKR ${Number(n).toLocaleString('en-PK')}`
}

/* ── milestone helpers ──────────────────────────────────────────── */

function MilestoneIcon({ status }) {
  if (status === 'completed') {
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (status === 'current') {
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-primary-500 flex items-center justify-center">
        <span className="w-3 h-3 rounded-full bg-primary-500 animate-pulse" />
      </div>
    )
  }
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-gray-200 bg-white" />
  )
}

/* ── main page ──────────────────────────────────────────────────── */

export default function CaseFundingDetailPage() {
  const { caseId }    = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuthStore()

  const [caseData, setCaseData]             = useState(null)
  const [transparencyData, setTransparency] = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [showFunding, setShowFunding]       = useState(false)
  const [milestoneLoading, setMsLoading]    = useState(false)

  /* ── fetch data ── */
  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [caseRes, transRes] = await Promise.allSettled([
          getCase(caseId),
          getCaseTransparency(caseId),
        ])

        if (cancelled) return

        if (caseRes.status === 'fulfilled') {
          setCaseData(caseRes.value.data)
        } else {
          setError('Case not found.')
          setLoading(false)
          return
        }

        if (transRes.status === 'fulfilled') {
          setTransparency(transRes.value.data)
        }
      } catch {
        if (!cancelled) setError('Case not found.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [caseId])

  /* ── complete milestone ── */
  const handleCompleteMilestone = async (milestoneId) => {
    setMsLoading(true)
    try {
      await completeMilestone(caseId, milestoneId)
      // optimistically update local milestone state
      setTransparency((prev) => {
        if (!prev) return prev
        const milestones = (prev.milestones ?? []).map((m) =>
          m.id === milestoneId ? { ...m, status: 'completed', completed_at: new Date().toISOString() } : m
        )
        return { ...prev, milestones }
      })
    } catch {
      /* silently ignore — user will see unchanged state */
    } finally {
      setMsLoading(false)
    }
  }

  /* ── funding success ── */
  const handleFundSuccess = (data) => {
    setCaseData((prev) =>
      prev
        ? {
            ...prev,
            total_funds: (parseFloat(prev.total_funds) || 0) + (parseFloat(data.amount) || 0),
            contributor_count: (prev.contributor_count ?? 0) + 1,
          }
        : prev
    )
  }

  /* ── loading ── */
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  /* ── error ── */
  if (error || !caseData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-bold text-gray-800">Case not found</p>
            <p className="text-gray-500 text-sm mt-1 mb-6">
              {error || "This case doesn't exist or may have been removed."}
            </p>
            <button
              onClick={() => navigate('/cases')}
              className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
            >
              ← Back to Cases
            </button>
          </div>
        </main>
      </div>
    )
  }

  /* ── derived values ── */
  const categoryKey      = caseData.category?.toLowerCase() ?? ''
  const categoryBadgeCls = CATEGORY_BADGE[categoryKey] ?? 'bg-gray-100 text-gray-600'
  const statusKey        = caseData.status?.toLowerCase() ?? ''
  const statusBadgeCls   = STATUS_BADGE[statusKey] ?? 'bg-gray-100 text-gray-600'

  const totalRaised       = caseData.total_funds ?? 0
  const contributorCount  = caseData.contributor_count ?? caseData.funders_count ?? 0

  const milestones = transparencyData?.milestones ?? caseData?.milestones ?? []

  // Assign display statuses: walk forward until we find first non-completed = "current"
  let foundCurrent = false
  const annotatedMilestones = milestones.map((m) => {
    const isDone = m.status === 'completed' || !!m.completed_at
    if (isDone) return { ...m, _display: 'completed' }
    if (!foundCurrent) {
      foundCurrent = true
      return { ...m, _display: 'current' }
    }
    return { ...m, _display: 'future' }
  })

  // First pending milestone index (for "Mark Complete" button)
  const firstPendingIdx = annotatedMilestones.findIndex((m) => m._display === 'current')
  const isNGO = user?.user_type === 'ngo'

  const hasLocation = !!(caseData.latitude && caseData.longitude)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-64 flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* ── SECTION 1: Case header ── */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-5">

            {/* Post image */}
            {caseData.post_thumbnail && (
              <div className="h-56 bg-gray-100 overflow-hidden">
                <img
                  src={caseData.post_thumbnail}
                  alt={caseData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 space-y-5">

            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Back
            </button>

            {/* Title + badges + fund button */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-extrabold text-gray-900 leading-snug">
                  {caseData.title ?? 'Untitled Case'}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {categoryKey && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${categoryBadgeCls}`}>
                      {categoryKey}
                    </span>
                  )}
                  {statusKey && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusBadgeCls}`}>
                      {statusKey.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowFunding(true)}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors shadow-sm"
              >
                Fund This Case
              </button>
            </div>

            {/* Description */}
            {caseData.description && (
              <p className="text-gray-700 leading-relaxed text-sm">{caseData.description}</p>
            )}

            {/* Raised stats */}
            <div>
              <p className="text-3xl font-extrabold text-primary-600">
                {formatPKR(totalRaised)} raised
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                by {contributorCount} contributor{contributorCount !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Funding goal bar (if target provided) */}
            {caseData.funding_goal > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{Math.min(100, Math.round((totalRaised / caseData.funding_goal) * 100))}% funded</span>
                  <span>Goal: {formatPKR(caseData.funding_goal)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalRaised / caseData.funding_goal) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Location preview */}
            {hasLocation && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</p>
                <LocationPreview
                  lat={caseData.latitude}
                  lng={caseData.longitude}
                  title={caseData.location_name ?? caseData.title}
                />
                {caseData.location_name && (
                  <p className="text-sm text-gray-500 mt-1.5">📍 {caseData.location_name}</p>
                )}
              </div>
            )}
            </div>
          </section>

          {/* ── SECTION 2: Milestone timeline ── */}
          {annotatedMilestones.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Milestone Timeline</h2>

              <ol className="relative space-y-0">
                {annotatedMilestones.map((milestone, idx) => {
                  const isLast    = idx === annotatedMilestones.length - 1
                  const isCompleted = milestone._display === 'completed'
                  const isCurrent   = milestone._display === 'current'

                  return (
                    <li key={milestone.id ?? idx} className="flex gap-4">
                      {/* Left: icon + connector line */}
                      <div className="flex flex-col items-center">
                        <MilestoneIcon status={milestone._display} />
                        {!isLast && (
                          <div className={`w-0.5 flex-1 mt-1 mb-1 min-h-[1.5rem] ${isCompleted ? 'bg-green-200' : 'bg-gray-200'}`} />
                        )}
                      </div>

                      {/* Right: content */}
                      <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                        <p className={`text-sm font-semibold leading-snug ${
                          isCompleted ? 'line-through text-gray-400' :
                          isCurrent   ? 'text-gray-900' :
                                        'text-gray-500'
                        }`}>
                          {milestone.title ?? milestone.name ?? `Milestone ${idx + 1}`}
                        </p>
                        {milestone.description && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {milestone.description}
                          </p>
                        )}
                        {isCompleted && milestone.completed_at && (
                          <p className="text-xs text-green-600 mt-1">
                            Completed{' '}
                            {new Date(milestone.completed_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', year: 'numeric',
                            })}
                          </p>
                        )}
                        {isCurrent && milestone.amount_required > 0 && (
                          <p className="text-xs text-primary-600 mt-1 font-medium">
                            Requires {formatPKR(milestone.amount_required)}
                          </p>
                        )}

                        {/* Mark complete button for NGO on first pending milestone */}
                        {isNGO && isCurrent && idx === firstPendingIdx && (
                          <button
                            onClick={() => handleCompleteMilestone(milestone.id)}
                            disabled={milestoneLoading}
                            className="mt-2 px-4 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                          >
                            {milestoneLoading && (
                              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            )}
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}

          {/* ── SECTION 3: Ledger ── */}
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">Blockchain Ledger</h2>
            <LedgerDisplay caseId={caseId} />
          </section>

        </div>
      </main>

      {/* ── Funding modal ── */}
      {showFunding && (
        <FundingModal
          caseData={caseData}
          onClose={() => setShowFunding(false)}
          onSuccess={(data) => {
            handleFundSuccess(data)
            setShowFunding(false)
          }}
        />
      )}
    </div>
  )
}
