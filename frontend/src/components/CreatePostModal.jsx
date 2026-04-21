import { useRef, useState } from 'react'
import * as postsApi from '../api/posts'
import MapPicker from './map/MapPicker'

export default function CreatePostModal({ onClose, onPostCreated }) {
  const [content, setContent]           = useState('')
  const [locationName, setLocationName] = useState('')
  const [coords, setCoords]             = useState(null)
  const [showMap, setShowMap]           = useState(false)
  const [files, setFiles]               = useState([])
  const [previews, setPreviews]         = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const fileRef                         = useRef()

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files)
    setFiles(selected)
    setPreviews(selected.map((f) => URL.createObjectURL(f)))
  }

  const removeFile = (i) => {
    setFiles((p) => p.filter((_, j) => j !== i))
    setPreviews((p) => p.filter((_, j) => j !== i))
  }

  const handleMapSelect = (pos) => {
    setCoords(pos)
    setLocationName(`${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!files.length && !locationName.trim()) {
      setError('A post must include media or a location.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      if (content.trim())      fd.append('content', content.trim())
      if (locationName.trim()) fd.append('location_name', locationName.trim())
      if (coords) {
        fd.append('latitude',  coords.lat)
        fd.append('longitude', coords.lng)
      }
      files.forEach((f) => fd.append('files', f))
      const { data } = await postsApi.createPost(fd)
      onPostCreated(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to create post.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg mx-0 sm:mx-4 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create Post</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening in your area? Share an update…"
              rows={3}
              className="w-full resize-none border border-gray-200 rounded-xl p-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-full aspect-square object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Location section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="📍 Location name (optional)"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <button
                  type="button"
                  onClick={() => setShowMap(v => !v)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-colors ${showMap ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {showMap ? 'Hide Map' : '🗺 Pick on Map'}
                </button>
              </div>

              {showMap && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <MapPicker onLocationSelect={handleMapSelect} height="250px" />
                </div>
              )}

              {coords && (
                <p className="text-xs text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg">
                  ✓ Location selected: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          </div>

          <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              📷 Add Media
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFiles} />
            <button
              type="submit"
              disabled={loading}
              className="ml-auto px-6 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
            >
              {loading ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
