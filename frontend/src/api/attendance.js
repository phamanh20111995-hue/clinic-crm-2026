import api from './client'

export const getLeaves    = (params) => api.get('/api/attendance/leaves/', { params }).catch(() => ({ data: [] }))
export const createLeave  = (data)   => api.post('/api/attendance/leaves/', data)
export const approveLeave = (id, data) => api.post(`/api/attendance/leaves/${id}/approve/`, data)

export const getShifts            = (params) => api.get('/api/attendance/shifts/', { params }).catch(() => ({ data: [] }))
export const getShiftAssignments  = (params) => api.get('/api/attendance/shift-assignments/', { params }).catch(() => ({ data: [] }))
export const createShiftAssignment = (data)  => api.post('/api/attendance/shift-assignments/', data)
export const approveShiftAssignment = (id, data) => api.post(`/api/attendance/shift-assignments/${id}/approve/`, data)
export const getDepartmentWeekShifts = (params) => api.get('/api/attendance/shift-assignments/department-week/', { params }).catch(() => ({ data: { department: null, week_start: null, assignments: [] } }))
