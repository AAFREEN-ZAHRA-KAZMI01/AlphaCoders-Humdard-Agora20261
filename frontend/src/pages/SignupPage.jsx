import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../api/auth'

const TYPES = [
  { id: 'citizen',   icon: '👤', label: 'Citizen',   desc: 'Share updates from your community' },
  { id: 'ngo',       icon: '🏢', label: 'NGO',        desc: 'Coordinate relief and resources' },
  { id: 'volunteer', icon: '🙋', label: 'Volunteer',  desc: 'Offer skills and time' },
]

const PROVINCES = ['Punjab','Sindh','KPK','Balochistan','Islamabad','AJK','GB']
const ORG_TYPES  = ['trust','ngo','charity','foundation','other']

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inp = "w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 text-sm"

export default function SignupPage() {
  const [type, setType]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const navigate = useNavigate()

  // common
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  // citizen + volunteer
  const [fullName, setFullName] = useState('')
  const [cnic, setCnic]         = useState('')
  const [city, setCity]         = useState('')
  const [province, setProvince] = useState('')

  // citizen only
  const [dob, setDob]               = useState('')
  const [cnicIssued, setCnicIssued] = useState('')
  const [cnicExpiry, setCnicExpiry] = useState('')

  // volunteer only
  const [age, setAge]           = useState('')
  const [gender, setGender]     = useState('')
  const [skills, setSkills]     = useState('')
  const [bio, setBio]           = useState('')

  // ngo
  const [orgName, setOrgName]       = useState('')
  const [regNum, setRegNum]         = useState('')
  const [orgType, setOrgType]       = useState('ngo')
  const [phone, setPhone]           = useState('')
  const [mission, setMission]       = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      let res
      if (type === 'citizen') {
        res = await authApi.signupCitizen({
          email, password, full_name: fullName, cnic,
          dob, cnic_issuance_date: cnicIssued, cnic_valid_upto: cnicExpiry,
          city, province,
        })
      } else if (type === 'ngo') {
        res = await authApi.signupNgo({
          email, password, org_name: orgName,
          registration_number: regNum, org_type: orgType,
          phone, mission_statement: mission,
          city, province, full_address: city,
          focus_areas: [], year_founded: 2000,
        })
      } else {
        res = await authApi.signupVolunteer({
          email, password, full_name: fullName, cnic,
          age: parseInt(age) || 18, gender,
          skills: skills.split(',').map(s => s.trim()).filter(Boolean),
          availability: [], interest_areas: [], max_travel_km: 10,
          city, province, bio,
        })
      }
      const msg = res?.data?.message ?? ''
      navigate('/verify-otp', { state: { email, serverMsg: msg } })
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: type selection ────────────────────────────────────────────────
  if (!type) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold text-primary-600">HumDard</Link>
            <p className="text-gray-500 mt-1">Create your account</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Who are you?</h2>
            <div className="space-y-3">
              {TYPES.map((t) => (
                <button
                  key={t.id} onClick={() => setType(t.id)}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-primary-400 hover:bg-primary-50 rounded-xl transition-all text-left group"
                >
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-primary-700">{t.label}</p>
                    <p className="text-xs text-gray-400">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/signin" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 2: form based on type ────────────────────────────────────────────
  const selected = TYPES.find(t => t.id === type)
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="text-3xl font-bold text-primary-600">HumDard</Link>
          <p className="text-gray-500 mt-1">Sign up as {selected.label}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <button onClick={() => setType('')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-5">
            ← Change type
          </button>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Common fields ── */}
            <Field label="Email address *">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inp} placeholder="you@example.com" />
            </Field>
            <Field label="Password *">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className={inp} placeholder="Min 8 characters" />
            </Field>

            {/* ── Citizen fields ── */}
            {type === 'citizen' && <>
              <Field label="Full Name *">
                <input value={fullName} onChange={e => setFullName(e.target.value)} required className={inp} placeholder="As on CNIC" />
              </Field>
              <Field label="CNIC (13 digits) *">
                <input value={cnic} onChange={e => setCnic(e.target.value)} required maxLength={13} pattern="\d{13}" className={inp} placeholder="3520212345678" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of Birth *">
                  <input type="date" value={dob} onChange={e => setDob(e.target.value)} required className={inp} />
                </Field>
                <Field label="CNIC Issue Date *">
                  <input type="date" value={cnicIssued} onChange={e => setCnicIssued(e.target.value)} required className={inp} />
                </Field>
              </div>
              <Field label="CNIC Expiry Date *">
                <input type="date" value={cnicExpiry} onChange={e => setCnicExpiry(e.target.value)} required className={inp} />
              </Field>
            </>}

            {/* ── Volunteer fields ── */}
            {type === 'volunteer' && <>
              <Field label="Full Name *">
                <input value={fullName} onChange={e => setFullName(e.target.value)} required className={inp} />
              </Field>
              <Field label="CNIC (13 digits) *">
                <input value={cnic} onChange={e => setCnic(e.target.value)} required maxLength={13} pattern="\d{13}" className={inp} placeholder="3520212345678" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age *">
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} required min={16} max={80} className={inp} />
                </Field>
                <Field label="Gender *">
                  <select value={gender} onChange={e => setGender(e.target.value)} required className={inp}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Skills (comma-separated)">
                <input value={skills} onChange={e => setSkills(e.target.value)} className={inp} placeholder="First Aid, Driving, Teaching" />
              </Field>
              <Field label="Bio">
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className={inp} placeholder="Tell us about yourself" />
              </Field>
            </>}

            {/* ── NGO fields ── */}
            {type === 'ngo' && <>
              <Field label="Organisation Name *">
                <input value={orgName} onChange={e => setOrgName(e.target.value)} required className={inp} />
              </Field>
              <Field label="Registration Number *">
                <input value={regNum} onChange={e => setRegNum(e.target.value)} required className={inp} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Org Type *">
                  <select value={orgType} onChange={e => setOrgType(e.target.value)} className={inp}>
                    {ORG_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Phone *">
                  <input value={phone} onChange={e => setPhone(e.target.value)} required className={inp} placeholder="+92..." />
                </Field>
              </div>
              <Field label="Mission Statement">
                <textarea value={mission} onChange={e => setMission(e.target.value)} rows={2} className={inp} placeholder="What does your organisation do?" />
              </Field>
            </>}

            {/* ── Common location ── */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="City *">
                <input value={city} onChange={e => setCity(e.target.value)} required className={inp} placeholder="Karachi" />
              </Field>
              <Field label="Province *">
                <select value={province} onChange={e => setProvince(e.target.value)} required className={inp}>
                  <option value="">Select</option>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Creating account…' : `Sign up as ${selected.label}`}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
