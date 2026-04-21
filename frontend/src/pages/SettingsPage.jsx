import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuthStore } from '../store/authStore'
import * as usersApi from '../api/users'

export default function SettingsPage() {
  const { user, setUser } = useAuthStore()
  const [form, setForm]   = useState({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    const profile = user?.citizen_profile ?? user?.ngo_profile ?? user?.volunteer_profile ?? {}
    setForm({
      full_name:          profile.full_name          ?? '',
      city:               profile.city               ?? '',
      province:           profile.province           ?? '',
      org_name:           profile.org_name           ?? '',
      mission_statement:  profile.mission_statement  ?? '',
      phone:              profile.phone              ?? '',
      website:            profile.website            ?? '',
      bio:                profile.bio                ?? '',
    })
  }, [user])

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSaved(false)
    try {
      await usersApi.updateMe(form)
      const { data: me } = await usersApi.getMe()
      setUser(me)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Update failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  const isNgo  = user?.user_type === 'ngo'
  const isVol  = user?.user_type === 'volunteer'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 py-6 px-4">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            {/* Account info (read-only) */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Account</h2>
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-800">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Profile fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-700">Profile</h2>

              {(isNgo) ? (
                <>
                  <div><label className={labelCls}>Organization name</label><input value={form.org_name ?? ''} onChange={set('org_name')} className={inputCls} /></div>
                  <div><label className={labelCls}>Mission statement</label><textarea value={form.mission_statement ?? ''} onChange={set('mission_statement')} rows={3} className={`${inputCls} resize-none`} /></div>
                  <div><label className={labelCls}>Phone</label><input type="tel" value={form.phone ?? ''} onChange={set('phone')} className={inputCls} /></div>
                  <div><label className={labelCls}>Website</label><input type="url" value={form.website ?? ''} onChange={set('website')} className={inputCls} /></div>
                </>
              ) : (
                <>
                  <div><label className={labelCls}>Full name</label><input value={form.full_name ?? ''} onChange={set('full_name')} className={inputCls} /></div>
                  {isVol && <div><label className={labelCls}>Bio</label><textarea value={form.bio ?? ''} onChange={set('bio')} rows={3} className={`${inputCls} resize-none`} /></div>}
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>City</label><input value={form.city ?? ''} onChange={set('city')} className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Province</label>
                  <select value={form.province ?? ''} onChange={set('province')} className={inputCls}>
                    <option value="">Select</option>
                    {['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'ICT'].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {error  && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              {saved  && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ Changes saved</p>}

              <button
                type="submit" disabled={loading}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
