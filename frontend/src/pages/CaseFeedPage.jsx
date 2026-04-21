import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { listCases } from '../api/cases'

/* ── constants ──────────────────────────────────────────────────── */

const CATEGORIES = ['All', 'Waste', 'Drainage', 'Pothole']
const STATUSES   = ['All', 'Active', 'Resolved']
const SORTS      = ['Latest', 'Most Funded']

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

/* ── helpers ────────────────────────────────────────────────────── */

function formatPKR(n) {
  if (!n && n !== 0) return 'PKR 0'
  return `PKR ${Number(n).toLocaleString('en-PK')}`
}

function buildParams(category, statusFilter, sort) {
  const params = { page: 1, size: 20 }

  if (category !== 'All') {
    params.category = category.toLowerCase()
  }

  if (statusFilter === 'Active') {
    // don't filter — show all non-resolved; backend doesn't support multi-value
  } else if (statusFilter === 'Resolved') {
    params.status = 'resolved'
  }

  if (sort === 'Most Funded') {
    params.ordering = '-total_funded'
  } else {
    params.ordering = '-created_at'
  }

  return params
}

/* ── skeleton card ──────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-9 bg-gray-200 rounded-xl w-full mt-2" />
      </div>
    </div>
  )
}

/* ── case card ──────────────────────────────────────────────────── */

function CaseCard({ caseItem, onNavigate }) {
  const categoryKey   = caseItem.category?.toLowerCase() ?? ''
  const statusKey     = caseItem.status?.toLowerCase() ?? ''
  const categoryBadge = CATEGORY_BADGE[categoryKey] ?? 'bg-gray-100 text-gray-600'
  const statusBadge   = STATUS_BADGE[statusKey]    ?? 'bg-gray-100 text-gray-600'

  const totalRaised      = caseItem.total_funds ?? 0
  const contributorCount = caseItem.contributor_count ?? caseItem.funders_count ?? 0

  const thumbnail = caseItem.post_thumbnail ?? null

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">

      {/* Thumbnail */}
      <div className="relative h-44 bg-gray-100 flex-shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={caseItem.title ?? 'Case image'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Category badge — top left */}
        {categoryKey && (
          <span className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize shadow-sm ${categoryBadge}`}>
            {categoryKey}
          </span>
        )}

        {/* Status badge — top right */}
        {statusKey && (
          <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize shadow-sm ${statusBadge}`}>
            {statusKey.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
          {caseItem.title ?? 'Untitled Case'}
        </h3>

        {caseItem.location_name && (
          <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
            <span>📍</span>
            <span className="truncate">{caseItem.location_name}</span>
          </p>
        )}

        <div className="mt-3">
          <p className="text-2xl font-extrabold text-primary-600">
            {formatPKR(totalRaised)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {contributorCount} contributor{contributorCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Funding progress bar if goal present */}
        {caseItem.funding_goal > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${Math.min(100, (totalRaised / caseItem.funding_goal) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto pt-3">
          <button
            onClick={() => onNavigate(caseItem.id)}
            className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 active:bg-primary-800 transition-colors"
          >
            Fund This Case
          </button>
        </div>
      </div>
    </article>
  )
}

/* ── filter pill ────────────────────────────────────────────────── */

function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap ${
        active
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
      }`}
    >
      {label}
    </button>
  )
}

/* ── main page ──────────────────────────────────────────────────── */

export default function CaseFeedPage() {
  const navigate = useNavigate()

  const [cases, setCases]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [category, setCategory]         = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sort, setSort]                 = useState('Latest')

  const fetchCases = useCallback(async (cat, status, srt) => {
    setLoading(true)
    setError('')
    try {
      const params = buildParams(cat, status, srt)
      const { data } = await listCases(params)
      // handle both paginated { results: [] } and plain []
      const items = Array.isArray(data) ? data : (data.results ?? data.items ?? [])
      setCases(items)
    } catch (err) {
      setError(
        err?.response?.data?.detail ??
        err?.response?.data?.message ??
        'Failed to load cases. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCases(category, statusFilter, sort)
  }, [category, statusFilter, sort, fetchCases])

  const handleNavigate = (id) => navigate(`/cases/${id}`)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-64 flex-1">

        {/* ── sticky filter bar ── */}
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">

            {/* Category pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <FilterPill
                  key={cat}
                  label={cat}
                  active={category === cat}
                  onClick={() => setCategory(cat)}
                />
              ))}
            </div>

            <div className="w-px h-6 bg-gray-200 hidden sm:block" />

            {/* Status pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {STATUSES.map((st) => (
                <FilterPill
                  key={st}
                  label={st}
                  active={statusFilter === st}
                  onClick={() => setStatusFilter(st)}
                />
              ))}
            </div>

            <div className="w-px h-6 bg-gray-200 hidden sm:block" />

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Sort:</span>
              <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {SORTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                      sort === s
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── content ── */}
        <div className="px-6 py-8">
          <div className="max-w-5xl mx-auto">

            {/* Page heading */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-gray-900">Community Cases</h1>
              <p className="text-sm text-gray-500 mt-1">
                Support verified cases in your community by contributing funds.
              </p>
            </div>

            {/* Error */}
            {error && !loading && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {error}
                <button
                  onClick={() => fetchCases(category, statusFilter, sort)}
                  className="ml-3 underline font-medium hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {/* Cases grid */}
            {!loading && cases.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cases.map((c) => (
                  <CaseCard
                    key={c.id}
                    caseItem={c}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && cases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-bold text-lg">No cases found</p>
                <p className="text-gray-400 text-sm mt-2 max-w-xs">
                  {category !== 'All' || statusFilter !== 'All'
                    ? 'Try adjusting the filters above to see more results.'
                    : 'There are no community cases to display yet. Check back soon.'}
                </p>
                {(category !== 'All' || statusFilter !== 'All') && (
                  <button
                    onClick={() => { setCategory('All'); setStatusFilter('All'); setSort('Latest') }}
                    className="mt-5 px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
