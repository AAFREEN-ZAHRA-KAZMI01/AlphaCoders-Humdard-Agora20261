import api from './client'

export const getMe    = ()          => api.get('/users/me')
export const updateMe = (data)      => api.put('/users/me', data)
export const getUser  = (userId)    => api.get(`/users/${userId}`)
