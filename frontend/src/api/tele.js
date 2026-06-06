import api from './client'

// Customers / Data
export const getCustomers = (params) => api.get('/api/customers/', { params })
export const createCustomer = (data) => api.post('/api/customers/', data)
export const assignCustomer = (id, data) => api.post(`/api/customers/${id}/assign/`, data)
export const checkPhone = (phone) => api.get('/api/customers/check-phone/', { params: { phone } })

// Tele queue
export const getTeleQueue = (params) => api.get('/api/calls/queue/', { params })

// Call history
export const logCall = (data) => api.post('/api/calls/', data)

// Return requests
export const createReturnRequest = (formData) =>
  api.post('/api/calls/return-request/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// Appointments
export const createAppointment = (data) => api.post('/api/appointments/', data)

// Auth users (for tele assignment)
export const getTeleUsers = () =>
  api.get('/api/auth/users/', { params: { role: 'TELE' } })

// Services
export const getServices = () => api.get('/api/services/')
