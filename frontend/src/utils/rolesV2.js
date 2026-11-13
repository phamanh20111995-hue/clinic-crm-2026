// v2 role config — Tabler Icons + GROUPED sidebar nav (Phase A: cấu trúc 4 nhóm)
import {
  IconLayoutDashboard,
  IconBuildingCommunity,
  IconDatabase,
  IconPhone,
  IconSpeakerphone,
  IconHeart,
  IconShoppingCart,
  IconClipboardList,
  IconStethoscope,
  IconCalculator,
  IconUserCog,
  IconUserShield,
  IconUsers,
  IconHeadset,
  IconMessages,
  IconCalendarEvent,
  IconGift,
  IconFlask,
  IconRobot,
  IconChartBar,
  IconPlugConnected,
  IconListDetails,
  IconSettings,
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
  HCNS:      { label: 'HCNS',       short: 'HC',  accent: '#0891b2' },
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
  HCNS:      'bg-cyan-100 text-cyan-800',
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
    HCNS:      '/hcns',
    BS:        '/kpi',
    KTV:       '/kpi',
    QUAN_LY:   '/kpi',
    CHU_DN:    '/kpi',
  }
  return map[role] ?? '/kpi'
}

// ── Sidebar nav — CẤU TRÚC NHÓM (Phase A) ────────────────────
// roles: null = mọi người; mảng = chỉ các role đó.
// st: 'ok' = route thật đang chạy; 'new' = shell mới.
const ADMIN = ['QUAN_LY', 'CHU_DN']

export const NAV_GROUPS = [
  {
    header: 'Tổng quan',
    items: [
      { key: 'tongquan', path: '/kpi', label: 'Tổng quan', Icon: IconLayoutDashboard, roles: null, st: 'ok' },
    ],
  },
  {
    header: 'Công việc',
    expand: {
      key: 'cvbp', label: 'Công việc theo bộ phận', Icon: IconBuildingCommunity,
      items: [
        { key: 'data',    path: '/data',       label: 'Data',         Icon: IconDatabase,       roles: ['TELE', 'TRUC_PAGE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN'], st: 'new' },
        { key: 'tele',    path: '/tele',       label: 'Tele',         Icon: IconPhone,          roles: ['TELE', 'TRUC_PAGE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN'], st: 'ok' },
        { key: 'marketing', path: '/marketing', label: 'Marketing',   Icon: IconSpeakerphone,   roles: ['MKT', 'LEAD_MKT', 'QUAN_LY', 'CHU_DN'], st: 'ok' },
        { key: 'cskh',    path: '/cskh',       label: 'CSKH',         Icon: IconHeart,          roles: ['CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN'], st: 'ok' },
        { key: 'sale',    path: '/sale',       label: 'Sale',         Icon: IconShoppingCart,   roles: ['SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN'], st: 'ok' },
        { key: 'letan',   path: '/letan',      label: 'Lễ tân',       Icon: IconClipboardList,  roles: ['LE_TAN', 'QUAN_LY', 'CHU_DN'], st: 'ok' },
        { key: 'bskt',    path: '/bac-si-ktv', label: 'Bác sĩ / KTV', Icon: IconStethoscope,    roles: ['BS', 'KTV', 'QUAN_LY', 'CHU_DN'], st: 'new' },
        { key: 'ketoan',  path: '/ketoan',     label: 'Kế toán',      Icon: IconCalculator,     roles: ['KE_TOAN', 'QUAN_LY', 'CHU_DN'], st: 'ok' },
        { key: 'hcns',    path: '/hcns',       label: 'HCNS',         Icon: IconUserCog,        roles: ['HCNS', 'QUAN_LY', 'CHU_DN'], st: 'new' },
        { key: 'quanly',  path: '/quan-ly',    label: 'Quản lý',      Icon: IconUserShield,     roles: ADMIN, st: 'new' },
      ],
    },
  },
  {
    header: 'Hệ thống chung',
    items: [
      { key: 'khachhang', path: '/customers',    label: 'Khách hàng',          Icon: IconUsers,         roles: ['QUAN_LY', 'CHU_DN', 'KE_TOAN'], st: 'ok' },
      { key: 'livechat',  path: '/live-chat',    label: 'Live Chat',           Icon: IconHeadset,       roles: ADMIN, st: 'new', badge: '24' },
      { key: 'chatnoibo', path: '/chat',         label: 'Chat nội bộ',         Icon: IconMessages,      roles: null, st: 'ok' },
      { key: 'lichdx',    path: '/lich-lam-viec', label: 'Lịch & Đề xuất',     Icon: IconCalendarEvent, roles: null, st: 'ok' },
      { key: 'rewards',   path: '/rio-rewards',  label: 'RIO Rewards',         Icon: IconGift,          roles: ADMIN, st: 'new' },
      { key: 'rnd',       path: '/rnd',          label: 'R&D',                 Icon: IconFlask,         roles: ADMIN, st: 'new' },
      { key: 'aihub',     path: '/ai-hub',       label: 'AI Hub',              Icon: IconRobot,         roles: ADMIN, st: 'new', beta: true },
      { key: 'baocao',    path: '/bao-cao',      label: 'Báo cáo & P.tích',    Icon: IconChartBar,      roles: ADMIN, st: 'new' },
    ],
  },
  {
    header: 'Kết nối & hệ thống',
    items: [
      { key: 'ketnoi', path: '/ket-noi', label: 'Kết nối kênh',       Icon: IconPlugConnected, roles: ADMIN, st: 'new' },
      { key: 'dulieu', path: '/du-lieu', label: 'Dữ liệu & DM',       Icon: IconListDetails,   roles: ADMIN, st: 'new' },
      { key: 'caidat', path: '/cai-dat', label: 'Cài đặt',            Icon: IconSettings,      roles: ADMIN, st: 'new' },
    ],
  },
]

const canSee = (item, role) => !item.roles || item.roles.includes(role)

// Trả về các nhóm đã lọc theo role (ẩn mục/nhóm rỗng)
export const getNavGroups = (role) =>
  NAV_GROUPS
    .map((g) => {
      if (g.expand) {
        const items = g.expand.items.filter((it) => canSee(it, role))
        if (!items.length) return null
        return { header: g.header, expand: { ...g.expand, items } }
      }
      const items = (g.items || []).filter((it) => canSee(it, role))
      if (!items.length) return null
      return { header: g.header, items }
    })
    .filter(Boolean)

// v1 compat shim — flat list (một số nơi cũ còn import getNavItems)
export const getNavItems = (role) => {
  const flat = []
  for (const g of NAV_GROUPS) {
    if (g.expand) { for (const it of g.expand.items) if (canSee(it, role)) flat.push(it) }
    else for (const it of (g.items || [])) if (canSee(it, role)) flat.push(it)
  }
  return flat
}
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
