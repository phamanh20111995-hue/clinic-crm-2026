import api from './client'

export const getAppointments = (params) => api.get('/api/appointments/', { params })
export const getTodayAppointments = () => api.get('/api/appointments/today/')
export const getAppointment = (id) => api.get(`/api/appointments/${id}/`)
export const createAppointment = (data) => api.post('/api/appointments/', data)
export const updateAppointment = (id, data) => api.patch(`/api/appointments/${id}/`, data)
export const checkinAppointment = (id) => api.post(`/api/appointments/${id}/checkin/`)
export const confirmTua = (id, data) => api.post(`/api/appointments/${id}/confirm-tua/`, data)
export const assignRoom = (id, data) => api.post(`/api/appointments/${id}/assign-room/`, data)
export const createWalkIn = (data) => api.post('/api/appointments/walkin/', data)
