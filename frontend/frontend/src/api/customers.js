import api from './client'

export const getCustomers = (params) => api.get('/api/customers/', { params })
export const getCustomer = (id) => api.get(`/api/customers/${id}/`)
export const createCustomer = (data) => api.post('/api/customers/', data)
export const updateCustomer = (id, data) => api.patch(`/api/customers/${id}/`, data)
export const checkPhone = (phone) => api.get('/api/customers/check-phone/', { params: { phone } })
export const assignCustomer = (id, data) => api.post(`/api/customers/${id}/assign/`, data)
export const uploadImage = (id, formData) =>
  api.post(`/api/customers/${id}/images/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
