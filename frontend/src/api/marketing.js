import api from './client'

export const getMktOverview   = (params) => api.get('/api/marketing/overview/', { params }).catch(() => ({ data: null }))
export const getMktByPlatform = (params) => api.get('/api/marketing/by-platform/', { params }).catch(() => ({ data: [] }))
export const getMktDaily      = (params) => api.get('/api/marketing/daily/', { params }).catch(() => ({ data: [] }))
export const saveMktDaily     = (data)   => api.post('/api/marketing/daily/', data)
export const getMktCampaigns  = (params) => api.get('/api/marketing/campaigns/', { params }).catch(() => ({ data: [] }))
export const createCampaign   = (data)   => api.post('/api/marketing/campaigns/', data)
export const updateCampaign   = (id, d)  => api.patch(`/api/marketing/campaigns/${id}/`, d)
export const getMktReport     = (params) => api.get('/api/marketing/report/', { params }).catch(() => ({ data: [] }))
export const pullFromMeta     = (data)   => api.post('/api/marketing/pull-meta/', data)
