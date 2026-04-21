import api from './client'

export const createCase        = (data)         => api.post('/cases/', data)
export const listCases         = (params)        => api.get('/cases/', { params })
export const getCase           = (id)            => api.get(`/cases/${id}`)
export const fundCase          = (id, data)      => api.post(`/cases/${id}/fund`, data)
export const getCaseLedger     = (id)            => api.get(`/cases/${id}/ledger`)
export const getCaseTransparency = (id)          => api.get(`/cases/${id}/transparency`)
export const addMilestone      = (id, data)      => api.post(`/cases/${id}/milestones`, data)
export const completeMilestone = (id, mId)       => api.put(`/cases/${id}/milestones/${mId}/complete`)
export const updateCaseStatus  = (id, status)    => api.put(`/cases/${id}/status`, { status })
