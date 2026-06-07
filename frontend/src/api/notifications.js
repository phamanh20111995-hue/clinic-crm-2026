import api from './client'

export const getNotifications = (params) => api.get('/api/chat/notifications/', { params })
export const markNotifRead    = (pk)     => api.post(`/api/chat/notifications/${pk}/read/`)
export const markAllNotifRead = ()       => api.post('/api/chat/notifications/read-all/')
