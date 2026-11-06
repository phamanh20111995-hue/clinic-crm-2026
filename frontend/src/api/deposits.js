import api from './client'

// ===== Đặt cọc (giữ chỗ cấp khách) =====
export const getDeposits          = (params)   => api.get('/api/contracts/deposits/', { params })
export const createDeposit        = (data)     => api.post('/api/contracts/deposits/', data)
export const getDepositContracts  = (customerId) => api.get('/api/contracts/deposits/customer-contracts/', { params: { customer_id: customerId } })
export const applyDeposit         = (id, data) => api.post(`/api/contracts/deposits/${id}/apply/`, data)
export const settleDeposit        = (id, data) => api.post(`/api/contracts/deposits/${id}/settle/`, data)
export const verifyDeposit        = (id, data) => api.post(`/api/contracts/deposits/${id}/verify/`, data)
export const editDeposit          = (id, data) => api.post(`/api/contracts/deposits/${id}/edit/`, data)
export const deleteDeposit        = (id)       => api.post(`/api/contracts/deposits/${id}/delete/`, {})
