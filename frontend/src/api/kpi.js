import api from './client'

export const getKpiDashboard = (params) => api.get('/api/kpi/dashboard/', { params })
export const getKpiTele = (params) => api.get('/api/kpi/tele/', { params })
export const getKpiSale = (params) => api.get('/api/kpi/sale/', { params })
export const getKpiTrucPage = (params) => api.get('/api/kpi/truc-page/', { params })
