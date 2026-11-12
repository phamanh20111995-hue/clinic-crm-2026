import api from './client'

// Danh sách chi nhánh / cơ sở (accounts.Clinic) — mount tại /api/auth/clinics/
export const getClinics = (params) => api.get('/api/auth/clinics/', { params }).catch(() => ({ data: [] }))
