import api from './client'

// ===== Sản phẩm =====
export const getProducts   = (params)   => api.get('/api/inventory/products/', { params })
export const getProduct    = (id)       => api.get(`/api/inventory/products/${id}/`)
export const createProduct = (data)     => api.post('/api/inventory/products/', data)
export const updateProduct = (id, data) => api.patch(`/api/inventory/products/${id}/`, data)

// ===== Nhà cung cấp =====
export const getSuppliers   = (params) => api.get('/api/inventory/suppliers/', { params })
export const createSupplier = (data)   => api.post('/api/inventory/suppliers/', data)

// ===== Nhập kho =====
export const getStockEntries  = (params) => api.get('/api/inventory/stock-entries/', { params })
export const createStockEntry = (data)   => api.post('/api/inventory/stock-entries/', data)

// ===== Thanh toán NCC =====
export const getSupplierPayments   = (params) => api.get('/api/inventory/supplier-payments/', { params })
export const createSupplierPayment = (data)   => api.post('/api/inventory/supplier-payments/', data)

// ===== Biến động kho (lịch sử nhập/xuất) =====
export const getStockMovements = (params) => api.get('/api/inventory/movements/', { params })
