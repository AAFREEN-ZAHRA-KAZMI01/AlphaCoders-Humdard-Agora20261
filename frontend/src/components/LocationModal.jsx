export default function LocationModal({ post, onClose }) {
  const query = post.latitude && post.longitude
    ? `${post.latitude},${post.longitude}`
    : encodeURIComponent(post.location_name ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">📍 Location Details</h3>

        <div className="space-y-3 mb-6">
          {post.location_name && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Location name</p>
              <p className="font-medium text-gray-900">{post.location_name}</p>
            </div>
          )}
          {post.latitude && post.longitude && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Coordinates</p>
              <p className="font-mono text-sm text-gray-700">
                {post.latitude.toFixed(6)}, {post.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <a
          href={`https://maps.google.com?q=${query}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors"
        >
          🗺️ Open in Google Maps
        </a>
        <button onClick={onClose} className="mt-2 w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors">
          Close
        </button>
      </div>
    </div>
  )
}
