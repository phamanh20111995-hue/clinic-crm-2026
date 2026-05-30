import api from './client'

export const getTeleQueue = () => api.get('/api/calls/queue/')
export const logCall = (data) => api.post('/api/calls/', data)
export const createReturnRequest = (data) => api.post('/api/calls/return-request/', data)
export const getReturnRequests = () => api.get('/api/calls/return-requests/')
export const reviewReturnRequest = (id, data) =>
  api.post(`/api/calls/return-request/${id}/approve/`, data)
