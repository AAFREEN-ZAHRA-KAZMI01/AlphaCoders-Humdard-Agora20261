import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PostCard from '../components/PostCard'
import { useAuthStore } from '../store/authStore'
import * as postsApi from '../api/posts'

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [post, setPost]         = useState(null)
  const [comments, setComments] = useState([])
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)

  useEffect(() => {
    Promise.all([postsApi.getPost(postId), postsApi.getComments(postId)])
      .then(([p, c]) => { setPost(p.data); setComments(c.data.items) })
      .finally(() => setLoading(false))
  }, [postId])

  const handleComment = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      const { data } = await postsApi.addComment(postId, text.trim())
      setComments((p) => [data, ...p])
      setPost((p) => ({ ...p, comment_count: p.comment_count + 1 }))
      setText('')
    } finally {
      setSending(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    await postsApi.deleteComment(postId, commentId)
    setComments((p) => p.filter((c) => c.id !== commentId))
    setPost((p) => ({ ...p, comment_count: Math.max(0, p.comment_count - 1) }))
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 py-6 px-4">
        <div className="max-w-xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4">
            ← Back
          </button>

          {loading && <div className="text-center py-20 text-gray-400">Loading…</div>}

          {post && (
            <>
              <PostCard post={post} />

              {/* Add comment */}
              <form onSubmit={handleComment} className="mt-5 bg-white rounded-2xl border border-gray-200 p-4 flex gap-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
                  {user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    value={text} onChange={(e) => setText(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-primary-400 focus:outline-none"
                  />
                  <button type="submit" disabled={!text.trim() || sending}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                    Post
                  </button>
                </div>
              </form>

              {/* Comments */}
              <div className="mt-4 space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex gap-3 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm flex-shrink-0">
                      {c.user_id?.toString()[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{c.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                    {c.user_id === user?.id && (
                      <button onClick={() => handleDeleteComment(c.id)} className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0">✕</button>
                    )}
                  </div>
                ))}
                {comments.length === 0 && <p className="text-center text-sm text-gray-400 py-6">No comments yet.</p>}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
