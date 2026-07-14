import api from './client'

export const getCustomers = (params) =>
  api.get('/api/customers/', { params })

export const getPageStats = (params) =>
  api.get('/api/customers/page-stats/', { params })

export const getCustomerDetail = (id) =>
  api.get(`/api/customers/${id}/`)

export const assignCustomer = (id, data) =>
  api.post(`/api/customers/${id}/assign/`, data)
