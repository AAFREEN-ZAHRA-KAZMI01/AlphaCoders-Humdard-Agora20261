import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PostCard from '../components/PostCard'
import UserTypeBadge from '../components/UserTypeBadge'
import * as usersApi from '../api/users'
import * as postsApi from '../api/posts'

export default function ProfilePage() {
  const { userId } = useParams()
  const [user, setUser]   = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([usersApi.getUser(userId), postsApi.getFeed(1, 50)])
      .then(([u, p]) => {
        setUser(u.data)
        setPosts(p.data.items.filter((post) => post.user_id === userId))
      })
      .finally(() => setLoading(false))
  }, [userId])

  const profile = user?.citizen_profile ?? user?.ngo_profile ?? user?.volunteer_profile

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 py-6 px-4">
        <div className="max-w-xl mx-auto">
          {loading && <div className="text-center py-20 text-gray-400">Loading…</div>}

          {user && (
            <>
              {/* Profile header */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700">
                    {user.user_type === 'ngo' ? '🏢' : user.user_type === 'volunteer' ? '🙋' : '👤'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-bold text-gray-900">
                        {user.ngo_profile?.org_name ?? profile?.full_name ?? 'Unknown'}
                      </h1>
                      <UserTypeBadge type={user.user_type} />
                    </div>
                    {(profile?.city || profile?.province) && (
                      <p className="text-sm text-gray-500">📍 {[profile.city, profile.province].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                </div>

                {/* Type-specific details */}
                {user.ngo_profile && (
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    {user.ngo_profile.mission_statement && <p className="italic text-gray-500">"{user.ngo_profile.mission_statement}"</p>}
                    {user.ngo_profile.focus_areas?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.ngo_profile.focus_areas.map((a) => (
                          <span key={a} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {user.volunteer_profile && (
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    {user.volunteer_profile.bio && <p className="text-gray-500">{user.volunteer_profile.bio}</p>}
                    {user.volunteer_profile.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {user.volunteer_profile.skills.map((s) => (
                          <span key={s} className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {user.citizen_profile?.cnic && (
                  <p className="mt-3 text-xs text-gray-400">CNIC: {user.citizen_profile.cnic.replace(/(\d{5})(\d{7})(\d)/, '$1-$2-$3')}</p>
                )}
              </div>

              {/* Posts */}
              <h2 className="text-sm font-semibold text-gray-500 mb-3">{posts.length} post{posts.length !== 1 ? 's' : ''}</h2>
              <div className="space-y-4">
                {posts.map((post) => <PostCard key={post.id} post={post} />)}
                {posts.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No posts yet.</p>}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
