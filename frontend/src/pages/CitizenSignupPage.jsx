import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StepProgressBar from '../components/StepProgressBar'
import PasswordStrengthMeter from '../components/PasswordStrengthMeter'
import * as authApi from '../api/auth'

const STEPS = ['Account', 'Personal Info', 'Location']

export default function CitizenSignupPage() {
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '', password: '',
    full_name: '', cnic: '', dob: '',
    city: '', province: '',
  })
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      await authApi.signupCitizen({
        email: form.email, password: form.password,
        full_name: form.full_name, cnic: form.cnic,
        dob: form.dob || undefined,
        city: form.city || undefined, province: form.province || undefined,
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
          <p className="text-gray-500 mt-1">Create a Citizen account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <StepProgressBar steps={STEPS} current={step} />

          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Email address *</label>
                <input type="email" value={form.email} onChange={set('email')} required autoFocus className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Password *</label>
                <input type="password" value={form.password} onChange={set('password')} required className={inputCls} />
                <PasswordStrengthMeter password={form.password} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Full name *</label>
                <input type="text" value={form.full_name} onChange={set('full_name')} required autoFocus className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>CNIC (13 digits, no dashes) *</label>
                <input type="text" value={form.cnic} onChange={set('cnic')} maxLength={13} pattern="\d{13}" placeholder="3520212345678" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Date of birth</label>
                <input type="date" value={form.dob} onChange={set('dob')} className={inputCls} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>City</label>
                <input type="text" value={form.city} onChange={set('city')} placeholder="Karachi" autoFocus className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Province</label>
                <select value={form.province} onChange={set('province')} className={inputCls}>
                  <option value="">Select province</option>
                  {['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK', 'ICT'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>}

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && (!form.email || form.password.length < 8)}
                className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit} disabled={loading}
                className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
