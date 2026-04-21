import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import LocationPreview from '../components/map/LocationPreview'
import * as postsApi from '../api/posts'

const STATUS_COLORS = {
  reported: 'bg-gray-100 text-gray-700',
  verified: 'bg-amber-100 text-amber-700',
  funded: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-teal-100 text-teal-700',
}

export default function CaseDetailPage() {
  const { postId } = useParams()
  const navigate   = useNavigate()
  const [post, setPost]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postsApi.getPost(postId)
      .then(r => setPost(r.data))
      .catch(() => navigate('/feed'))
      .finally(() => setLoading(false))
  }, [postId])

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </main>
    </div>
  )

  if (!post) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
            ← Back
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            {/* Status */}
            {post.status && (
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[post.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {post.status.replace('_', ' ')}
              </span>
            )}

            {/* Content */}
            <p className="text-gray-800 text-base leading-relaxed">{post.content}</p>

            {/* Media */}
            {post.media?.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {post.media.map((m, i) => (
                  <img key={i} src={m.url} alt="" className="w-full rounded-xl object-cover aspect-video" />
                ))}
              </div>
            )}

            {/* Location map */}
            {post.latitude && post.longitude && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</p>
                <LocationPreview lat={post.latitude} lng={post.longitude} title={post.location_name ?? post.content?.slice(0, 50)} />
                {post.location_name && (
                  <p className="text-sm text-gray-500 mt-1.5">📍 {post.location_name}</p>
                )}
              </div>
            )}

            {/* Meta */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Posted {new Date(post.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span>{post.like_count ?? 0} likes · {post.comment_count ?? 0} comments</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
