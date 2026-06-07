import api from './client'

// ── Hợp đồng chăm sóc ────────────────────────────────────────
export { getContracts as getCskhContracts, createContract as createCskhContract, submitContract as submitCskhContract } from './contracts'

// ── Hàng chờ phân CSKH ────────────────────────────────────────
export const getCustomersQueue = (params) =>
  api.get('/api/customers/', { params: { status: 'cho_phan_cskh', ...params } })

export const getCskhCustomers = (params) =>
  api.get('/api/customers/', { params })

export const assignCskh = (id, cskhId) =>
  api.post(`/api/customers/${id}/assign-cskh/`, { cskh: cskhId })

// ── Liệu trình ────────────────────────────────────────────────
export const getTreatmentCourses = (params) =>
  api.get('/api/treatment-courses/', { params })

export const createTreatmentCourse = (data) =>
  api.post('/api/treatment-courses/', data)

export const updateTreatmentCourse = (id, data) =>
  api.patch(`/api/treatment-courses/${id}/`, data)

// ── Đánh giá hài lòng ─────────────────────────────────────────
export const getSatisfactionReviews = (params) =>
  api.get('/api/satisfaction-reviews/', { params })

export const sendSatisfactionForm = (data) =>
  api.post('/api/satisfaction-reviews/send-form/', data)

// ── Tái khám ──────────────────────────────────────────────────
export const getFollowUpList = (params) =>
  api.get('/api/appointments/', { params: { visit_type: 'tai_kham', ...params } })

// ── Nhắc lịch (dùng appointment list) ────────────────────────
export const getReminders = (params) =>
  api.get('/api/appointments/', { params })

export const sendZaloReminder = (id, data) =>
  api.post(`/api/appointments/${id}/send-zalo-reminder/`, data)

// ── Ảnh chăm sóc ──────────────────────────────────────────────
export const getCarePhotos = (params) =>
  api.get('/api/care-photos/', { params })

export const uploadCarePhoto = (formData) =>
  api.post('/api/care-photos/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// ── Tái sử dụng từ letan.js ───────────────────────────────────
export { getAppointments, getServices, getUsers } from './letan'
