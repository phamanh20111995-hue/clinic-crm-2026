import api from './client'

// ===== Nghỉ phép (LeaveRequest) =====
// GET: HR xem tất cả, nhân viên xem của mình. Lọc ?status=pending
export const getLeaves     = (params)    => api.get('/api/attendance/leaves/', { params }).catch(() => ({ data: [] }))
// POST đăng ký đơn: { start_date, end_date, leave_type, reason }
export const createLeave   = (data)      => api.post('/api/attendance/leaves/', data)
// POST duyệt/từ chối: { action: 'approve'|'reject', reason }
export const approveLeave  = (id, data)  => api.post(`/api/attendance/leaves/${id}/approve/`, data)

// ===== Ca làm việc (WorkShift / ShiftAssignment) =====
export const getShifts              = (params) => api.get('/api/attendance/shifts/', { params }).catch(() => ({ data: [] }))
export const createShift            = (data)   => api.post('/api/attendance/shifts/', data)
export const getShiftAssignments    = (params) => api.get('/api/attendance/shift-assignments/', { params }).catch(() => ({ data: [] }))
export const createShiftAssignment  = (data)   => api.post('/api/attendance/shift-assignments/', data)
