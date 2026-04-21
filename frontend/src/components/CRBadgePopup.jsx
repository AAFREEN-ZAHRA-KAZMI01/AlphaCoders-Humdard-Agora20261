import { useEffect, useRef, useState } from 'react'
import * as postsApi from '../api/posts'

export default function CRBadgePopup({ media: initialMedia, onClose }) {
  const [media, setMedia] = useState(initialMedia)
  const intervalRef = useRef(null)

  useEffect(() => {
    // Trigger analysis if not yet started
    if (!initialMedia.analyzed_at) {
      postsApi.triggerAnalysis(initialMedia.id).catch(() => {})
    }

    // Poll every 3s until result arrives
    intervalRef.current = setInterval(async () => {
      try {
        const { data } = await postsApi.getAnalysisResult(initialMedia.id)
        setMedia(data)
        if (data.analyzed_at) clearInterval(intervalRef.current)
      } catch {}
    }, 3000)

    return () => clearInterval(intervalRef.current)
  }, [initialMedia.id])

  const pct = ((media.fake_confidence ?? 0) * 100).toFixed(1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Credibility Report</h3>

        {media.analyzed_at ? (
          <>
            <div className={`rounded-xl p-5 text-center mb-5 ${media.is_fake ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
              <div className="text-5xl mb-2">{media.is_fake ? '⚠️' : '✅'}</div>
              <p className={`text-xl font-bold ${media.is_fake ? 'text-red-600' : 'text-green-600'}`}>
                {media.is_fake ? 'Fake Content Detected' : 'Verified Authentic'}
              </p>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Confidence Score</span>
                <span className="text-sm font-bold text-gray-900">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${media.is_fake ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Analyzed</span>
                <span className="text-sm text-gray-700">{new Date(media.analyzed_at).toLocaleString()}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-5xl mb-3 animate-pulse">🔍</div>
            <p className="font-semibold text-gray-700">Analysis in progress</p>
            <p className="text-sm text-gray-400 mt-1">Auto-updates every 3 seconds…</p>
          </div>
        )}

        <button onClick={onClose} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium">
          Close
        </button>
      </div>
    </div>
  )
}
