import { format, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

export const fmtDate = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'dd/MM/yyyy', { locale: vi }) }
  catch { return d }
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'HH:mm dd/MM/yyyy', { locale: vi }) }
  catch { return d }
}

export const fmtTime = (d) => {
  if (!d) return '—'
  try { return format(typeof d === 'string' ? parseISO(d) : d, 'HH:mm', { locale: vi }) }
  catch { return d }
}

export const fmtMoney = (n) => {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi-VN') + ' ₫'
}

export const fmtPhone = (p) => {
  if (!p) return '—'
  return p.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
}
