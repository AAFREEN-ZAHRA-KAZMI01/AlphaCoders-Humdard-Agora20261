import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import OTPInput from '../components/OTPInput'
import * as authApi from '../api/auth'
import { useAuthStore } from '../store/authStore'
import * as usersApi from '../api/users'

const OTP_SECONDS = 600 // 10 min

export default function OTPVerificationPage() {
  const { state } = useLocation()
  const email     = state?.email ?? ''
  const serverMsg = state?.serverMsg ?? ''
  const navigate = useNavigate()
  const { setTokens, setUser } = useAuthStore()

  const [countdown, setCountdown] = useState(OTP_SECONDS)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    if (!email) { navigate('/signin'); return }
    const id = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => clearInterval(id)
  }, [email, navigate])

  const handleComplete = async (code) => {
    setLoading(true); setError('')
    try {
      const { data } = await authApi.verifyOtp(email, code)
      setTokens(data.access_token, data.refresh_token)
      const { data: me } = await usersApi.getMe()
      setUser(me)
      navigate('/feed')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Incorrect OTP. Try again.')
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResendMsg(''); setError('')
    try {
      await authApi.resendOtp(email)
      setCountdown(OTP_SECONDS)
      setResendMsg('A new OTP has been sent.')
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Could not resend OTP.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-primary-600">HumDard</Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-gray-500 mb-4">
            We sent a 6-digit code to<br />
            <span className="font-semibold text-gray-800">{email}</span>
          </p>
          {serverMsg && (
            <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-3 rounded-xl">
              {serverMsg}
            </div>
          )}

          <OTPInput onComplete={handleComplete} countdown={countdown} />

          {loading && <p className="text-sm text-primary-600 mt-4 animate-pulse">Verifying…</p>}
          {error   && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg mt-4">{error}</p>}
          {resendMsg && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg mt-4">{resendMsg}</p>}

          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
            <button
              onClick={handleResend}
              disabled={countdown > 0}
              className="text-sm text-primary-600 hover:underline disabled:text-gray-400 disabled:no-underline font-medium"
            >
              {countdown > 0 ? 'Resend available after timer expires' : 'Resend OTP'}
            </button>
            <br />
            <Link to="/signin" className="text-sm text-gray-400 hover:text-gray-600">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
