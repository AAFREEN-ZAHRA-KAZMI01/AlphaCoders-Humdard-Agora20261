import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StepProgressBar from '../components/StepProgressBar'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import * as authApi from '../api/auth'

const STEPS    = ['Account', 'Personal', 'Skills', 'Location']
const SKILLS   = ['First Aid', 'Teaching', 'Driving', 'Cooking', 'Construction', 'Medical', 'IT', 'Legal', 'Photography', 'Translation', 'Fundraising', 'Social Media']
const AVAIL    = ['Weekday Mornings', 'Weekday Evenings', 'Weekends', 'Full-time', 'On-call / Emergencies']
const INTERESTS = ['Disaster Relief', 'Education', 'Health', 'Environment', 'Women Empowerment', 'Food Distribution', 'Blood Donation', 'Mental Health', 'Child Welfare']

export default function VolunteerSignupPage() {
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '', password: '',
    full_name: '', cnic: '', age: '', gender: '',
    skills: [], availability: [],
    city: '', province: '', max_travel_km: '', interest_areas: [], bio: '',
  })
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))
  const toggle = (k, val) => setForm((p) => ({
    ...p, [k]: p[k].includes(val) ? p[k].filter((x) => x !== val) : [...p[k], val],
  }))

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  const TagPicker = ({ label, field, options }) => (
    <div>
      <p className={labelCls}>{label}</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map((o) => (
          <button key={o} type="button" onClick={() => toggle(field, o)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form[field].includes(o) ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  )

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      await authApi.signupVolunteer({
        email: form.email, password: form.password,
        full_name: form.full_name, cnic: form.cnic,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        skills: form.skills, availability: form.availability,
        city: form.city || undefined, province: form.province || undefined,
        max_travel_km: form.max_travel_km ? Number(form.max_travel_km) : undefined,
        interest_areas: form.interest_areas,
        bio: form.bio || undefined,
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
          <p className="text-gray-500 mt-1">Sign up as a Volunteer</p>
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
              <div><label className={labelCls}>Full name *</label><input type="text" value={form.full_name} onChange={set('full_name')} autoFocus className={inputCls} /></div>
              <div><label className={labelCls}>CNIC (13 digits) *</label><input type="text" value={form.cnic} onChange={set('cnic')} maxLength={13} className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Age</label><input type="number" min={16} max={80} value={form.age} onChange={set('age')} className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Gender</label>
                  <select value={form.gender} onChange={set('gender')} className={inputCls}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option><option>Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <TagPicker label="Skills" field="skills" options={SKILLS} />
              <TagPicker label="Availability" field="availability" options={AVAIL} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div><label className={labelCls}>City</label><input type="text" value={form.city} onChange={set('city')} autoFocus className={inputCls} /></div>
              <div>
                <label className={labelCls}>Province</label>
                <select value={form.province} onChange={set('province')} className={inputCls}>
                  <option value="">Select</option>
                  {['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'ICT'].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label className={labelCls}>Max travel distance (km)</label><input type="number" min={0} value={form.max_travel_km} onChange={set('max_travel_km')} className={inputCls} /></div>
              <TagPicker label="Interest areas" field="interest_areas" options={INTERESTS} />
              <div><label className={labelCls}>Bio</label><textarea value={form.bio} onChange={set('bio')} rows={3} className={`${inputCls} resize-none`} /></div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>}

          <div className="flex gap-3 mt-8">
            {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Back</button>}
            {step < STEPS.length - 1
              ? <button onClick={() => setStep((s) => s + 1)} className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors">Next</button>
              : <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 bg-primary-500 disabled:opacity-50 text-white font-semibold rounded-xl">{loading ? 'Creating…' : 'Create Account'}</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
