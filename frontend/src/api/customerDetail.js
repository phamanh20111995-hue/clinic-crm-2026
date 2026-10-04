import api from './client'

export const getCustomerDetail   = (id)       => api.get(`/api/customers/${id}/`)
export const getCustomerContracts= (id)       => api.get('/api/contracts/', { params: { customer_id: id, page_size: 100 } })
export const getCustomerAppts   = (id)        => api.get('/api/appointments/', { params: { customer_id: id, page_size: 200 } })
export const getCustomerCourses  = (id)       => api.get('/api/treatment-courses/', { params: { customer: id } })
export const getCustomerImages   = (id)       => api.get(`/api/customers/${id}/images/`)
export const uploadCustomerImage = (id, form) => api.post(`/api/customers/${id}/images/`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
export const patchCustomer       = (id, data) => api.patch(`/api/customers/${id}/`, data)
export const getCustomerNotes    = (id, channel) => api.get('/api/customers/notes/', { params: { customer: id, ...(channel ? { channel } : {}) } })
export const createCustomerNote  = (data) => api.post('/api/customers/notes/', data)
export const deleteCustomerNote  = (id) => api.delete('/api/customers/notes/' + id + '/')
