import api from './client'

export const getContracts      = (params) => api.get('/api/contracts/', { params })
export const approveContract   = (id, data) => api.post(`/api/contracts/${id}/approve/`, data)
export const rejectContract    = (id, data) => api.post(`/api/contracts/${id}/reject/`, data)
export const updateContract    = (id, data) => api.patch(`/api/contracts/${id}/`, data)
export const getKpiDashboard   = (params) => api.get('/api/kpi/dashboard/', { params })
export const getInventory      = (params) => api.get('/api/inventory/', { params }).catch(() => ({ data: { results: [] } }))
export const addInventory      = (data)   => api.post('/api/inventory/', data)

// Lương & Tua
export const getSalaryMonthly  = (params) => api.get('/api/salary/monthly/', { params }).catch(() => ({ data: [] }))

// Chấm công
export const getAttendanceToday   = (params) => api.get('/api/attendance/today/', { params }).catch(() => ({ data: [] }))
export const getAttendanceMonthly = (params) => api.get('/api/attendance/monthly/', { params }).catch(() => ({ data: [] }))
export const manualAttendance     = (data)   => api.post('/api/attendance/manual/', data)

// Ca làm việc
export const getShifts    = (params) => api.get('/api/shifts/', { params }).catch(() => ({ data: [] }))
export const createShift  = (data)   => api.post('/api/shifts/', data)
export const getLeaves    = (params) => api.get('/api/leaves/', { params }).catch(() => ({ data: [] }))
export const approveLeave = (id, data) => api.post(`/api/leaves/${id}/approve/`, data)
