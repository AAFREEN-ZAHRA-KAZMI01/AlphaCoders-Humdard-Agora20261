import api from './client'

export const getFeed       = (page = 1, size = 20) => api.get('/posts/',                         { params: { page, size } })
export const getPost       = (id)                  => api.get(`/posts/${id}`)
export const createPost    = (formData)            => api.post('/posts/', formData,               { headers: { 'Content-Type': 'multipart/form-data' } })
export const deletePost    = (id)                  => api.delete(`/posts/${id}`)

export const toggleLike    = (postId)              => api.post(`/posts/${postId}/like`)
export const getLikes      = (postId)              => api.get(`/posts/${postId}/likes`)

export const addComment    = (postId, content)     => api.post(`/posts/${postId}/comments`,      { content })
export const getComments   = (postId, page = 1)    => api.get(`/posts/${postId}/comments`,       { params: { page, size: 20 } })
export const deleteComment     = (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`)

export const triggerAnalysis   = (mediaId)           => api.post(`/media/analyze/${mediaId}`)
export const getAnalysisResult = (mediaId)           => api.get(`/media/${mediaId}/result`)
