import api from './client'

export const login = (email, password) =>
  api.post('/api/auth/login/', { email, password })

export const logout = () =>
  api.post('/api/auth/logout/', { refresh: localStorage.getItem('refresh_token') })

export const getMe = () => api.get('/api/auth/me/')
