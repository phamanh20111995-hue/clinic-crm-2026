import api from './client'

export const getContracts = (params) => api.get('/api/contracts/', { params })
export const getContract = (id) => api.get(`/api/contracts/${id}/`)
export const createContract = (data) => api.post('/api/contracts/', data)
export const updateContract = (id, data) => api.patch(`/api/contracts/${id}/`, data)
export const submitContract = (id) => api.post(`/api/contracts/${id}/submit/`)
export const approveContract = (id) => api.post(`/api/contracts/${id}/approve/`)
export const rejectContract = (id, data) => api.post(`/api/contracts/${id}/reject/`, data)
export const deleteContract = (id) => api.post(`/api/contracts/${id}/delete/`)
export const getPendingContracts = () => api.get('/api/contracts/pending/')
