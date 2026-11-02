import api from './client'

// ===== Đề xuất chi + duyệt nhiều tầng + sổ quỹ chi =====
export const getExpenses    = (params)   => api.get('/api/contracts/expenses/', { params })
export const createExpense  = (data)     => api.post('/api/contracts/expenses/', data)
export const approveExpense = (id, data) => api.post(`/api/contracts/expenses/${id}/approve/`, data)
export const rejectExpense  = (id, data) => api.post(`/api/contracts/expenses/${id}/reject/`, data)
export const payExpense     = (id, data) => api.post(`/api/contracts/expenses/${id}/pay/`, data)
export const payPayout      = (payoutId, data) => api.post(`/api/contracts/expense-payouts/${payoutId}/pay/`, data)
export const editExpense    = (id, data) => api.post(`/api/contracts/expenses/${id}/edit/`, data)
export const deleteExpense  = (id)       => api.post(`/api/contracts/expenses/${id}/delete/`, {})

// ===== Sổ quỹ tiền mặt (thu TM − chi TM) =====
export const getCashBook    = (params)   => api.get('/api/contracts/cash-book/', { params })

// Danh mục loại chi (khớp CATEGORY_CHOICES ở backend)
export const EXPENSE_CATEGORIES = [
  { value: 'co_so', label: 'Chi phí cơ sở / chi nhánh' },
  { value: 'vat_tu', label: 'Vật tư / thuốc' },
  { value: 'van_phong_pham', label: 'Văn phòng phẩm' },
  { value: 'tele', label: 'Tele / Data' },
  { value: 'mkt', label: 'Marketing' },
  { value: 'cskh', label: 'CSKH' },
  { value: 'sale', label: 'Sale' },
  { value: 'hoa_don_vat', label: 'Lấy hóa đơn VAT về công ty' },
  { value: 'luong_ung', label: 'Tạm ứng / lương' },
  { value: 'khac', label: 'Khác' },
]
