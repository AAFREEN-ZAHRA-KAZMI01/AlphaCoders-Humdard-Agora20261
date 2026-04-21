import api from './client'

export const getNotifications = (page = 1, size = 20) => api.get('/notifications/',          { params: { page, size } })
export const markRead         = (id)                   => api.put(`/notifications/${id}/read`)
export const markAllRead      = ()                     => api.put('/notifications/read-all')
