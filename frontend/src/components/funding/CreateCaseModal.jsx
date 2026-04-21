import { useState } from 'react'
import * as casesApi from '../../api/cases'

const CATEGORIES = ['waste', 'drainage', 'pothole']

export default function CreateCaseModal({ postId, onClose, onCreated }) {
  const [title, setTitle]       = useState('')
  const [category, setCategory] = useState('waste')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setError('')
    try {
      const { data } = await casesApi.createCase({ post_id: postId, title: title.trim(), category })
      onCreated(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Could not create case.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Report as Case</h3>
        <p className="text-sm text-gray-500 mb-5">Enable funding and milestone tracking for this post.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Case Title *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)} required
              placeholder="Brief description of the issue"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-teal-400 focus:outline-none capitalize"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
              {loading ? 'Creating…' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
