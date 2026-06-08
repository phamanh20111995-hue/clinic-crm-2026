// v2 role config — Tabler Icons + menu map
import {
  IconUsers,
  IconPhone,
  IconChartBar,
  IconMessages,
  IconClipboardList,
  IconShoppingCart,
  IconCalculator,
  IconSpeakerphone,
  IconStethoscope,
  IconHeart,
  IconCalendarEvent,
} from '@tabler/icons-react'

export const ROLES = {
  QUAN_LY:   { label: 'Quản lý',    short: 'QL',  accent: '#6d28d9' },
  CHU_DN:    { label: 'Chủ DN',     short: 'CDN', accent: '#6d28d9' },
  LEAD_SALE: { label: 'Lead Sale',  short: 'LS',  accent: '#15803d' },
  LEAD_TELE: { label: 'Lead Tele',  short: 'LT',  accent: '#0369a1' },
  LEAD_CSKH: { label: 'Lead CSKH', short: 'LC',  accent: '#0f766e' },
  LEAD_MKT:  { label: 'Lead MKT',  short: 'LM',  accent: '#059669' },
  SALE:      { label: 'Sale',       short: 'SL',  accent: '#15803d' },
  TELE:      { label: 'Tele',       short: 'TE',  accent: '#0369a1' },
  TRUC_PAGE: { label: 'Trực page',  short: 'TP',  accent: '#6d28d9' },
  CSKH:      { label: 'CSKH',       short: 'CS',  accent: '#0f766e' },
  LE_TAN:    { label: 'Lễ tân',     short: 'LT2', accent: '#b45309' },
  KE_TOAN:   { label: 'Kế toán',   short: 'KT',  accent: '#9a3412' },
  MKT:       { label: 'Marketing',  short: 'MK',  accent: '#059669' },
  BS:        { label: 'Bác sĩ',     short: 'BS',  accent: '#991b1b' },
  KTV:       { label: 'KTV',        short: 'KTV', accent: '#0369a1' },
}

export const getRoleInfo   = (role) => ROLES[role] ?? { label: role, short: '?', accent: '#6b7280' }
export const getRoleLabel  = (role) => getRoleInfo(role).label
export const getRoleAccent = (role) => getRoleInfo(role).accent

// role → tailwind badge classes (kept for v1 compat)
const ROLE_BADGE = {
  QUAN_LY:   'bg-purple-100 text-purple-800',
  CHU_DN:    'bg-purple-100 text-purple-800',
  LEAD_SALE: 'bg-green-100 text-green-800',
  LEAD_TELE: 'bg-blue-100 text-blue-800',
  LEAD_CSKH: 'bg-teal-100 text-teal-800',
  LEAD_MKT:  'bg-emerald-100 text-emerald-800',
  SALE:      'bg-emerald-100 text-emerald-800',
  TELE:      'bg-sky-100 text-sky-800',
  TRUC_PAGE: 'bg-purple-100 text-purple-800',
  CSKH:      'bg-teal-100 text-teal-800',
  LE_TAN:    'bg-yellow-100 text-yellow-800',
  KE_TOAN:   'bg-orange-100 text-orange-800',
  MKT:       'bg-emerald-100 text-emerald-800',
  BS:        'bg-red-100 text-red-800',
  KTV:       'bg-sky-100 text-sky-800',
}
export const getRoleColor = (role) => ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-800'

// ── Home route per role (login redirect) ─────────────────────
export const getHomeRoute = (role) => {
  const map = {
    SALE:      '/sale',
    LEAD_SALE: '/sale',
    TELE:      '/tele',
    TRUC_PAGE: '/tele',
    LEAD_TELE: '/tele',
    LE_TAN:    '/letan',
    KE_TOAN:   '/ketoan',
    MKT:       '/marketing',
    LEAD_MKT:  '/marketing',
    CSKH:      '/cskh',
    LEAD_CSKH: '/cskh',
    BS:        '/kpi',
    KTV:       '/kpi',
    QUAN_LY:   '/kpi',
    CHU_DN:    '/kpi',
  }
  return map[role] ?? '/kpi'
}

// ── Sidebar nav items (v2 — only v2 screens) ─────────────────
// v1 pages (rooms, contracts, attendance, salary, appointments standalone) removed from sidebar;
// their files still exist but are not linked.
const ALL_NAV = [
  {
    key: 'customers',
    path: '/customers',
    label: 'Khách hàng',
    Icon: IconUsers,
    roles: null, // all roles
  },
  {
    key: 'tele',
    path: '/tele',
    label: 'Tele / Data',
    Icon: IconPhone,
    roles: ['TELE', 'TRUC_PAGE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'letan',
    path: '/letan',
    label: 'Lễ tân',
    Icon: IconClipboardList,
    roles: ['LE_TAN', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'cskh',
    path: '/cskh',
    label: 'CSKH',
    Icon: IconHeart,
    roles: ['CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'sale',
    path: '/sale',
    label: 'Sale',
    Icon: IconShoppingCart,
    roles: ['SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'ketoan',
    path: '/ketoan',
    label: 'Kế toán',
    Icon: IconCalculator,
    roles: ['KE_TOAN', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'marketing',
    path: '/marketing',
    label: 'Marketing',
    Icon: IconSpeakerphone,
    roles: ['MKT', 'LEAD_MKT', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'kpi',
    path: '/kpi',
    label: 'KPI',
    Icon: IconChartBar,
    // All roles see KPI (their own dashboard)
    roles: null,
  },
  {
    key: 'chat',
    path: '/chat',
    label: 'Chat',
    Icon: IconMessages,
    roles: null,
  },
  {
    key: 'lich-lam-viec',
    path: '/lich-lam-viec',
    label: 'Lịch làm việc',
    Icon: IconCalendarEvent,
    roles: null,
  },
]

export const getNavItems = (role) =>
  ALL_NAV.filter((item) => !item.roles || item.roles.includes(role))

// v1 compat shim
export { getNavItems as getNavItemsV1 }

/**
 * Safely read the role string from a user object stored in authStore.
 * Handles both flat { role: 'LE_TAN' } and nested { role: { code: 'LE_TAN' } }.
 */
export const getUserRole = (user) => {
  if (!user) return null
  const r = user.role
  if (!r) return null
  if (typeof r === 'string') return r
  return r.code ?? r.value ?? r.key ?? null
}

/** Returns true if user has one of the given roles */
export const hasRole = (user, ...roles) => roles.includes(getUserRole(user))
