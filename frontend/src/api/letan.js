import api from './client'

const today = () => new Date().toISOString().slice(0, 10)

export const getTodayAppointments = (params) =>
  api.get('/api/appointments/today/', { params })

export const getAppointments = (params) =>
  api.get('/api/appointments/', { params })

export const checkinAppointment = (id) =>
  api.post(`/api/appointments/${id}/checkin/`)

export const assignRoom = (id, data) =>
  api.post(`/api/appointments/${id}/assign-room/`, data)

export const updateAppointment = (id, data) =>
  api.patch(`/api/appointments/${id}/`, data)

export const confirmTua = (id, data) =>
  api.post(`/api/appointments/${id}/confirm-tua/`, data)

export const createWalkIn = (data) =>
  api.post('/api/appointments/walkin/', data)

export const getRooms = (params) =>
  api.get('/api/rooms/', { params })

export const getUsers = (params) =>
  api.get('/api/auth/users/', { params })

export const getMktUsers = () =>
  api.get('/api/auth/users/', { params: { role: 'MKT' } })

export const getAvailableStaff = (params) =>
  api.get('/api/appointments/available-staff/', { params }).catch(() => ({ data: [] }))

export const getServices = () =>
  api.get('/api/services/')

export const checkPhone = (phone) =>
  api.get('/api/customers/check-phone/', { params: { phone } })

export const enqueueAppointment = (id, visitType) =>
  api.post(`/api/appointments/${id}/enqueue/`, { visit_type: visitType })

export const toTreatment = (id) =>
  api.post(`/api/appointments/${id}/to-treatment/`)

export const checkoutAppointment = (id) =>
  api.post(`/api/appointments/${id}/checkout/`)
