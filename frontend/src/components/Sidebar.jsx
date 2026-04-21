import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import UserTypeBadge from './UserTypeBadge'

const NAV = [
  { path: '/feed',          icon: '🏠', label: 'Feed' },
  { path: '/cases',         icon: '💚', label: 'Cases & Funding' },
  { path: '/notifications', icon: '🔔', label: 'Notifications', badge: true },
  { path: '/settings',      icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const { user, accessToken, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const location = useLocation()
  const navigate = useNavigate()

  const profilePath = user?.id ? `/profile/${user.id}` : '/feed'

  const handleLogout = async () => {
    try {
      const { default: authApi } = await import('../api/auth')
      if (accessToken) await authApi.logout(accessToken)
    } catch {}
    logout()
    navigate('/')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col z-20">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <p className="text-2xl font-bold text-primary-600 leading-none">HumDard</p>
        <p className="text-xs text-gray-400 mt-0.5">ہم درد</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Profile link */}
        <Link
          to={profilePath}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
            location.pathname.startsWith('/profile') ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-xl">👤</span>
          <span>Profile</span>
        </Link>

        {NAV.map(({ path, icon, label, badge }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              location.pathname === path ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span className="flex-1">{label}</span>
            {badge && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.email ?? '—'}</p>
            {user?.user_type && <UserTypeBadge type={user.user_type} />}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
