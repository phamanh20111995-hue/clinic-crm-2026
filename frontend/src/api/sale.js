import api from './client'

export const getSaleKpi         = (params) => api.get('/api/kpi/sale/', { params })
export const getContracts       = (params) => api.get('/api/contracts/', { params })
export const submitContract     = (id)     => api.post(`/api/contracts/${id}/submit/`)
export const deleteContract     = (id)     => api.post(`/api/contracts/${id}/delete/`)
export const createContract     = (data)   => api.post('/api/contracts/', data)
export const updateContract     = (id, d)  => api.patch(`/api/contracts/${id}/`, d)
export const getTodayAppts      = (params) => api.get('/api/appointments/today/', { params })
export const getAppointments    = (params) => api.get('/api/appointments/', { params })
export const getServices        = ()       => api.get('/api/services/')
export const getMyCustomers     = (params) => api.get('/api/customers/', { params })
export const uploadCustomerImg  = (id, fd) => api.post(`/api/customers/${id}/images/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateAppointment  = (id, d)  => api.patch(`/api/appointments/${id}/`, d)
