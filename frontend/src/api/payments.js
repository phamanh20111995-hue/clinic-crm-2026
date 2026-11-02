import api from './client'

// ===== Thu tiền cho hợp đồng (TM + CK + trả góp) =====
export const getContractPayments = (contractId) => api.get(`/api/contracts/${contractId}/payments/`)
export const createPayment       = (contractId, data) => api.post(`/api/contracts/${contractId}/payments/`, data)

// ===== Công nợ (HĐ còn dư nợ) =====
export const getCongNo = () => api.get('/api/contracts/cong-no/')

// ===== Trả góp =====
export const getInstallments           = (params) => api.get('/api/contracts/installments/', { params })
export const confirmInstallment        = (id, data) => api.post(`/api/contracts/installments/${id}/confirm/`, data)
export const confirmInstallmentsBatch  = (ids, actual_date) => api.post('/api/contracts/installments/confirm-batch/', { ids, actual_date })

// ===== Đối soát (KT/QL) =====
export const getPendingPayments = () => api.get('/api/contracts/payments/pending/')
export const verifyPayment      = (id, data) => api.post(`/api/contracts/payments/${id}/verify/`, data)

// ===== Khoản thu của Sale =====
export const getPaymentsMine = (params) => api.get('/api/contracts/payments/mine/', { params })
export const editPayment     = (id, data) => api.post(`/api/contracts/payments/${id}/edit/`, data)

// ===== Doanh thu chi tiết (quy theo người/vai trò/cơ sở/miền) =====
export const getDoanhThuChiTiet = (params) => api.get('/api/contracts/doanh-thu-chi-tiet/', { params })

// ===== Đối soát tiền về bank (thẻ VNPAY + trả góp) + két TM cuối ngày =====
export const getBankSettlement   = (params)   => api.get('/api/contracts/bank-settlement/', { params })
export const confirmCardSettled  = (id, data) => api.post(`/api/contracts/payments/${id}/card-settled/`, data)
export const getCashRecon        = (params)   => api.get('/api/contracts/cash-recon/', { params })
export const saveCashRecon       = (data)     => api.post('/api/contracts/cash-recon/', data)
