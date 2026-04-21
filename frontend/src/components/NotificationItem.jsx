const ICONS = { like: '❤️', comment: '💬', opportunity: '🎯', ngo_post: '🏢' }

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60)    return `${m}m ago`
  if (m < 1440)  return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

export default function NotificationItem({ notification, onRead }) {
  return (
    <div
      onClick={() => !notification.is_read && onRead(notification.id)}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${!notification.is_read ? 'bg-primary-50/60' : ''}`}
    >
      <span className="text-2xl flex-shrink-0 mt-0.5">{ICONS[notification.type] ?? '🔔'}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(notification.created_at)}</p>
      </div>
      {!notification.is_read && <div className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0" />}
    </div>
  )
}
