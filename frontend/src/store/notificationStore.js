import { create } from 'zustand'
import * as notificationsApi from '../api/notifications'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  page: 1,
  hasMore: true,
  isLoading: false,

  fetchNotifications: async (reset = false) => {
    if (get().isLoading) return
    set({ isLoading: true })
    try {
      const nextPage = reset ? 1 : get().page
      const { data } = await notificationsApi.getNotifications(nextPage)
      set((s) => ({
        notifications: reset ? data.items : [...s.notifications, ...data.items],
        page: nextPage + 1,
        unreadCount: data.unread_count,
        hasMore: data.items.length === 20,
        isLoading: false,
      }))
    } catch {
      set({ isLoading: false })
    }
  },

  markRead: async (id) => {
    try {
      await notificationsApi.markRead(id)
      set((s) => ({
        notifications: s.notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        unreadCount: Math.max(0, s.unreadCount - 1),
      }))
    } catch {}
  },

  markAllRead: async () => {
    try {
      await notificationsApi.markAllRead()
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }))
    } catch {}
  },
}))
