import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import PostCard from '../components/PostCard'
import CreatePostModal from '../components/CreatePostModal'
import FeedMap from '../components/map/FeedMap'
import { useFeedStore } from '../store/feedStore'

export default function FeedPage() {
  const { posts, isLoading, hasMore, fetchPosts, addPost } = useFeedStore()
  const [showCreate, setShowCreate] = useState(false)
  const [mapView, setMapView]       = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchPosts(true) }, [])

  const mapCases = posts
    .filter(p => p.latitude && p.longitude)
    .map(p => ({
      id: p.id,
      title: p.content?.slice(0, 60) ?? 'Post',
      status: p.status ?? 'reported',
      category: p.location_name ?? '',
      latitude: p.latitude,
      longitude: p.longitude,
    }))

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 py-6 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setShowCreate(true)}
              className="flex-1 mr-3 bg-white border border-gray-200 hover:border-primary-300 rounded-2xl p-4 flex items-center gap-3 text-left transition-colors shadow-sm"
            >
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold">+</div>
              <span className="text-gray-400 text-sm">Share something happening near you…</span>
            </button>

            {/* View toggle */}
            <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm shrink-0">
              <button
                onClick={() => setMapView(false)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${!mapView ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                ☰ List
              </button>
              <button
                onClick={() => setMapView(true)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${mapView ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                🗺 Map
              </button>
            </div>
          </div>

          {/* Map view */}
          {mapView && (
            <div className="mb-4">
              <FeedMap
                cases={mapCases}
                height="500px"
                onCaseClick={(id) => navigate(`/post/${id}`)}
              />
              {mapCases.length === 0 && (
                <p className="text-center text-gray-400 text-sm mt-3">No geotagged posts to show on map.</p>
              )}
            </div>
          )}

          {/* List view */}
          {!mapView && (
            <>
              <div className="space-y-4">
                {posts.map((post) => <PostCard key={post.id} post={post} />)}
              </div>

              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {!isLoading && hasMore && posts.length > 0 && (
                <button onClick={() => fetchPosts(false)} className="w-full py-3 mt-4 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors text-sm font-medium">
                  Load more posts
                </button>
              )}
              {!isLoading && !hasMore && posts.length > 0 && (
                <p className="text-center py-8 text-gray-400 text-sm">You're all caught up ✓</p>
              )}
              {!isLoading && posts.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-5xl mb-4">📭</p>
                  <p className="text-gray-500 font-medium">No posts yet</p>
                  <p className="text-gray-400 text-sm mt-1">Be the first to share something!</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onPostCreated={(post) => { addPost(post); setShowCreate(false) }}
        />
      )}
    </div>
  )
}
