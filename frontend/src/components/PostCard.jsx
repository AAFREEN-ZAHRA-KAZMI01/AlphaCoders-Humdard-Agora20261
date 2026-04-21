import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useFeedStore } from '../store/feedStore'
import * as postsApi from '../api/posts'
import * as casesApi from '../api/cases'
import CRBadgePopup from './CRBadgePopup'
import LocationModal from './LocationModal'
import FundingModal from './funding/FundingModal'
import CreateCaseModal from './funding/CreateCaseModal'

function timeAgo(date) {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60_000)
  if (m < 1)    return 'just now'
  if (m < 60)   return `${m}m`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  return `${Math.floor(m / 1440)}d`
}

function crBadge(media) {
  if (!media.analyzed_at) return { label: 'Analyzing…', cls: 'bg-yellow-400 text-yellow-900', icon: '🔍' }
  if (media.is_fake)       return { label: 'Fake',       cls: 'bg-red-500 text-white',         icon: '⚠️' }
  return                          { label: 'Verified',   cls: 'bg-green-500 text-white',        icon: '✅' }
}

const STATUS_COLORS = {
  reported:    'bg-gray-100 text-gray-600',
  verified:    'bg-amber-100 text-amber-700',
  funded:      'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved:    'bg-teal-100 text-teal-700',
}

function fmt(n) {
  return 'PKR ' + Number(n || 0).toLocaleString('en-PK')
}

export default function PostCard({ post }) {
  const [crMedia, setCrMedia]           = useState(null)
  const [showLocation, setShowLocation] = useState(false)
  const [showFunding, setShowFunding]   = useState(false)
  const [showCreate, setShowCreate]     = useState(false)
  const [caseData, setCaseData]         = useState(null)
  const [caseLoading, setCaseLoading]   = useState(true)

  const { user } = useAuthStore()
  const { updatePost, removePost } = useFeedStore()
  const navigate = useNavigate()

  useEffect(() => {
    casesApi.listCases({ post_id: post.id })
      .then(r => {
        const items = r.data?.items ?? r.data ?? []
        setCaseData(items[0] ?? null)
      })
      .catch(() => setCaseData(null))
      .finally(() => setCaseLoading(false))
  }, [post.id])

  const handleLike = async () => {
    try {
      const { data } = await postsApi.toggleLike(post.id)
      updatePost(post.id, { liked_by_me: data.liked_by_me, like_count: data.count })
    } catch {}
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      await postsApi.deletePost(post.id)
      removePost(post.id)
    } catch {}
  }

  const onCaseCreated = (c) => { setCaseData(c); setShowCreate(false) }
  const onFunded = (updated) => {
    setCaseData(prev => prev ? { ...prev, total_funds: updated.total_funds ?? prev.total_funds } : prev)
  }

  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
          {post.user_id?.toString()[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1">
          <button
            onClick={() => navigate(`/profile/${post.user_id}`)}
            className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition-colors"
          >
            View Profile
          </button>
          <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
        </div>
        {user?.id === post.user_id && (
          <button onClick={handleDelete} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
            Delete
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-gray-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
      )}

      {/* Media grid */}
      {post.media?.length > 0 && (
        <div className={`grid gap-0.5 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.media.map((m) => {
            const badge = crBadge(m)
            return (
              <div key={m.id} className="relative">
                {m.media_type === 'image'
                  ? <img src={m.media_url} alt="" className="w-full aspect-square object-cover" />
                  : <video src={m.media_url} controls className="w-full aspect-video bg-black" />
                }
                <button
                  onClick={() => setCrMedia(m)}
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow ${badge.cls}`}
                >
                  {badge.icon} CR
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Location */}
      {post.location_name && (
        <button
          onClick={() => setShowLocation(true)}
          className="mx-4 mt-3 flex items-center gap-1 text-sm text-primary-600 hover:underline"
        >
          📍 {post.location_name}
        </button>
      )}

      {/* ── Funding strip ── */}
      {!caseLoading && (
        caseData ? (
          <div className="mx-4 mt-3 mb-1 rounded-xl bg-teal-50 border border-teal-100 px-3 py-2.5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-teal-700">{fmt(caseData.total_funds)} raised</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[caseData.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {caseData.status?.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-teal-600 mt-0.5 truncate">{caseData.title}</p>
            </div>
            <button
              onClick={() => setShowFunding(true)}
              className="flex-shrink-0 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Fund
            </button>
            <button
              onClick={() => navigate(`/cases/${caseData.id}`)}
              className="flex-shrink-0 px-3 py-1.5 bg-white border border-teal-200 text-teal-700 text-xs font-semibold rounded-lg hover:bg-teal-50 transition-colors"
            >
              Details
            </button>
          </div>
        ) : (
          <div className="mx-4 mt-3 mb-1">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-2 border border-dashed border-gray-300 text-xs text-gray-400 hover:border-teal-400 hover:text-teal-600 rounded-xl transition-colors"
            >
              + Report as Case &amp; Enable Funding
            </button>
          </div>
        )
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 px-4 py-3 mt-2 border-t border-gray-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.liked_by_me ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
        >
          {post.liked_by_me ? '❤️' : '🤍'} {post.like_count ?? 0}
        </button>
        <button
          onClick={() => navigate(`/post/${post.id}`)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 font-medium"
        >
          💬 {post.comment_count ?? 0}
        </button>
      </div>

      {crMedia      && <CRBadgePopup   media={crMedia}  onClose={() => setCrMedia(null)} />}
      {showLocation && <LocationModal  post={post}      onClose={() => setShowLocation(false)} />}
      {showFunding  && caseData && (
        <FundingModal caseData={caseData} onClose={() => setShowFunding(false)} onSuccess={onFunded} />
      )}
      {showCreate && (
        <CreateCaseModal postId={post.id} onClose={() => setShowCreate(false)} onCreated={onCaseCreated} />
      )}
    </article>
  )
}
