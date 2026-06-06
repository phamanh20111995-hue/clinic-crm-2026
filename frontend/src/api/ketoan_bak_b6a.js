import api from './client'

export const getContracts      = (params) => api.get('/api/contracts/', { params })
export const approveContract   = (id, data) => api.post(`/api/contracts/${id}/approve/`, data)
export const rejectContract    = (id, data) => api.post(`/api/contracts/${id}/reject/`, data)
export const updateContract    = (id, data) => api.patch(`/api/contracts/${id}/`, data)
export const getKpiDashboard   = (params) => api.get('/api/kpi/dashboard/', { params })
export const getInventory      = (params) => api.get('/api/inventory/', { params }).catch(() => ({ data: { results: [] } }))
export const addInventory      = (data)   => api.post('/api/inventory/', data)
