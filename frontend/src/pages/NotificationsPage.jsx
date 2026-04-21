import { useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import NotificationItem from '../components/NotificationItem'
import { useNotificationStore } from '../store/notificationStore'

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, hasMore, fetchNotifications, markRead, markAllRead } =
    useNotificationStore()

  useEffect(() => { fetchNotifications(true) }, [])

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 flex-1 py-6 px-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && <p className="text-sm text-primary-600 font-medium">{unreadCount} unread</p>}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-sm text-primary-600 hover:underline font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoading && notifications.length === 0 && (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {notifications.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🔔</p>
                <p className="text-gray-500 font-medium">No notifications yet</p>
              </div>
            )}
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markRead} />
            ))}
          </div>

          {!isLoading && hasMore && (
            <button
              onClick={() => fetchNotifications(false)}
              className="w-full py-3 mt-4 text-primary-600 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
