import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StepProgressBar from '../components/StepProgressBar'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import * as authApi from '../api/auth'

const STEPS  = ['Account', 'Organization', 'Mission', 'Location']
const TYPES  = ['ngo', 'charity', 'foundation', 'trust', 'community']
const FOCUS_OPTIONS = ['Education', 'Health', 'Disaster Relief', 'Women Empowerment', 'Clean Water', 'Food Security', 'Climate', 'Child Welfare', 'Legal Aid', 'Other']

export default function NGOSignupPage() {
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '', password: '',
    org_name: '', registration_number: '', org_type: 'ngo', year_founded: '',
    mission_statement: '', focus_areas: [], phone: '', website: '',
    city: '', province: '', full_address: '',
  })
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const toggleFocus = (area) => setForm((p) => ({
    ...p,
    focus_areas: p.focus_areas.includes(area) ? p.focus_areas.filter((x) => x !== area) : [...p.focus_areas, area],
  }))

  const inputCls  = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'
  const labelCls  = 'block text-sm font-medium text-gray-700 mb-1'

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      await authApi.signupNgo({
        email: form.email, password: form.password,
        org_name: form.org_name, registration_number: form.registration_number,
        org_type: form.org_type,
        year_founded: form.year_founded ? Number(form.year_founded) : undefined,
        mission_statement: form.mission_statement || undefined,
        focus_areas: form.focus_areas,
        phone: form.phone || undefined, website: form.website || undefined,
        city: form.city || undefined, province: form.province || undefined,
        full_address: form.full_address || undefined,
      })
      navigate('/verify-otp', { state: { email: form.email } })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Signup failed.')
      setStep(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary-600">HumDard</Link>
          <p className="text-gray-500 mt-1">Register your NGO</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <StepProgressBar steps={STEPS} current={step} />

          {step === 0 && (
            <div className="space-y-4">
              <div><label className={labelCls}>Email *</label><input type="email" value={form.email} onChange={set('email')} required autoFocus className={inputCls} /></div>
              <div>
                <label className={labelCls}>Password *</label>
                <input type="password" value={form.password} onChange={set('password')} className={inputCls} />
                <PasswordStrengthMeter password={form.password} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div><label className={labelCls}>Organization name *</label><input type="text" value={form.org_name} onChange={set('org_name')} autoFocus className={inputCls} /></div>
              <div><label className={labelCls}>Registration number *</label><input type="text" value={form.registration_number} onChange={set('registration_number')} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Organization type *</label>
                <select value={form.org_type} onChange={set('org_type')} className={inputCls}>
                  {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Year founded</label><input type="number" min={1900} max={2026} value={form.year_founded} onChange={set('year_founded')} className={inputCls} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Mission statement</label>
                <textarea value={form.mission_statement} onChange={set('mission_statement')} rows={3} className={`${inputCls} resize-none`} />
              </div>
              <div>
                <label className={labelCls}>Focus areas</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {FOCUS_OPTIONS.map((area) => (
                    <button key={area} type="button" onClick={() => toggleFocus(area)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.focus_areas.includes(area) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className={labelCls}>Phone</label><input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} /></div>
              <div><label className={labelCls}>Website</label><input type="url" value={form.website} onChange={set('website')} placeholder="https://" className={inputCls} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div><label className={labelCls}>City</label><input type="text" value={form.city} onChange={set('city')} autoFocus className={inputCls} /></div>
              <div>
                <label className={labelCls}>Province</label>
                <select value={form.province} onChange={set('province')} className={inputCls}>
                  <option value="">Select province</option>
                  {['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'ICT'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Full address</label><textarea value={form.full_address} onChange={set('full_address')} rows={2} className={`${inputCls} resize-none`} /></div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>}

          <div className="flex gap-3 mt-8">
            {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Back</button>}
            {step < STEPS.length - 1
              ? <button onClick={() => setStep((s) => s + 1)} className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors">Next</button>
              : <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl">{loading ? 'Creating…' : 'Register NGO'}</button>}
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            <Link to="/signin" className="text-primary-600 font-semibold hover:underline">Already have an account?</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
