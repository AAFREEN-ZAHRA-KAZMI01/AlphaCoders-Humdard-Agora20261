import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LandingPage          from './pages/LandingPage'
import SignInPage           from './pages/SignInPage'
import SignupPage           from './pages/SignupPage'
import CitizenSignupPage    from './pages/CitizenSignupPage'
import NGOSignupPage        from './pages/NGOSignupPage'
import VolunteerSignupPage  from './pages/VolunteerSignupPage'
import OTPVerificationPage  from './pages/OTPVerificationPage'
import FeedPage             from './pages/FeedPage'
import PostDetailPage       from './pages/PostDetailPage'
import ProfilePage          from './pages/ProfilePage'
import NotificationsPage    from './pages/NotificationsPage'
import SettingsPage             from './pages/SettingsPage'
import CaseFeedPage            from './pages/CaseFeedPage'
import CaseFundingDetailPage   from './pages/CaseFundingDetailPage'

function Protected({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/signin" replace />
}

function PublicOnly({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/feed" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"               element={<LandingPage />} />
        <Route path="/signin"         element={<PublicOnly><SignInPage /></PublicOnly>} />
        <Route path="/signup"         element={<PublicOnly><SignupPage /></PublicOnly>} />
        <Route path="/signup/citizen" element={<PublicOnly><CitizenSignupPage /></PublicOnly>} />
        <Route path="/signup/ngo"     element={<PublicOnly><NGOSignupPage /></PublicOnly>} />
        <Route path="/signup/volunteer" element={<PublicOnly><VolunteerSignupPage /></PublicOnly>} />
        <Route path="/verify-otp"     element={<OTPVerificationPage />} />

        <Route path="/feed"               element={<Protected><FeedPage /></Protected>} />
        <Route path="/post/:postId"        element={<Protected><PostDetailPage /></Protected>} />
        <Route path="/profile/:userId"     element={<Protected><ProfilePage /></Protected>} />
        <Route path="/notifications"       element={<Protected><NotificationsPage /></Protected>} />
        <Route path="/settings"            element={<Protected><SettingsPage /></Protected>} />
        <Route path="/cases"               element={<Protected><CaseFeedPage /></Protected>} />
        <Route path="/cases/:caseId"       element={<Protected><CaseFundingDetailPage /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
