// v2 role config — Tabler Icons + menu map
import {
  IconLayoutDashboard,
  IconUsers,
  IconPhone,
  IconCalendar,
  IconDoorEnter,
  IconFileText,
  IconClockHour4,
  IconCash,
  IconChartBar,
  IconMessages,
  IconBell,
  IconUserCircle,
} from '@tabler/icons-react'

export const ROLES = {
  QUAN_LY:   { label: 'Quản lý',   short: 'QL',  accent: '#6d28d9' },
  CHU_DN:    { label: 'Chủ DN',    short: 'CDN', accent: '#6d28d9' },
  LEAD_SALE: { label: 'Lead Sale', short: 'LS',  accent: '#15803d' },
  LEAD_TELE: { label: 'Lead Tele', short: 'LT',  accent: '#0369a1' },
  LEAD_CSKH: { label: 'Lead CSKH',short: 'LC',  accent: '#0f766e' },
  SALE:      { label: 'Sale',      short: 'SL',  accent: '#15803d' },
  TELE:      { label: 'Tele',      short: 'TE',  accent: '#0369a1' },
  CSKH:      { label: 'CSKH',      short: 'CS',  accent: '#0f766e' },
  LE_TAN:    { label: 'Lễ tân',    short: 'LT2', accent: '#b45309' },
  KE_TOAN:   { label: 'Kế toán',  short: 'KT',  accent: '#9a3412' },
}

export const getRoleInfo  = (role) => ROLES[role] ?? { label: role, short: '?', accent: '#6b7280' }
export const getRoleLabel = (role) => getRoleInfo(role).label
export const getRoleAccent = (role) => getRoleInfo(role).accent

// role → tailwind badge classes (kept for v1 compat)
const ROLE_BADGE = {
  QUAN_LY:   'bg-purple-100 text-purple-800',
  CHU_DN:    'bg-purple-100 text-purple-800',
  LEAD_SALE: 'bg-green-100 text-green-800',
  LEAD_TELE: 'bg-blue-100 text-blue-800',
  LEAD_CSKH: 'bg-teal-100 text-teal-800',
  SALE:      'bg-emerald-100 text-emerald-800',
  TELE:      'bg-sky-100 text-sky-800',
  CSKH:      'bg-teal-100 text-teal-800',
  LE_TAN:    'bg-yellow-100 text-yellow-800',
  KE_TOAN:   'bg-orange-100 text-orange-800',
}
export const getRoleColor = (role) => ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-800'

// ── Menu items ──────────────────────────────────────────────
const ALL_NAV = [
  {
    key: 'dashboard',
    path: '/',
    label: 'Dashboard',
    Icon: IconLayoutDashboard,
    roles: null, // all
  },
  {
    key: 'customers',
    path: '/customers',
    label: 'Khách hàng',
    Icon: IconUsers,
    roles: null,
  },
  {
    key: 'tele',
    path: '/tele',
    label: 'Tele / Data',
    Icon: IconPhone,
    roles: ['TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'appointments',
    path: '/appointments',
    label: 'Lịch hẹn',
    Icon: IconCalendar,
    roles: null,
  },
  {
    key: 'rooms',
    path: '/rooms',
    label: 'Sơ đồ phòng',
    Icon: IconDoorEnter,
    roles: ['LE_TAN', 'QUAN_LY', 'CHU_DN', 'CSKH', 'LEAD_CSKH'],
  },
  {
    key: 'contracts',
    path: '/contracts',
    label: 'Hợp đồng',
    Icon: IconFileText,
    roles: ['SALE', 'LEAD_SALE', 'CSKH', 'LEAD_CSKH', 'KE_TOAN', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'attendance',
    path: '/attendance',
    label: 'Chấm công',
    Icon: IconClockHour4,
    roles: ['KE_TOAN', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'salary',
    path: '/salary',
    label: 'Lương & Tua',
    Icon: IconCash,
    roles: ['KE_TOAN', 'QUAN_LY', 'CHU_DN'],
  },
  {
    key: 'kpi',
    path: '/kpi',
    label: 'KPI',
    Icon: IconChartBar,
    roles: ['QUAN_LY', 'CHU_DN', 'LEAD_SALE', 'LEAD_TELE', 'LEAD_CSKH', 'KE_TOAN'],
  },
  {
    key: 'chat',
    path: '/chat',
    label: 'Chat',
    Icon: IconMessages,
    roles: null,
  },
]

export const getNavItems = (role) =>
  ALL_NAV.filter((item) => !item.roles || item.roles.includes(role))

// v1 compat shim
export { getNavItems as getNavItemsV1 }
