export const ROLES = {
  QUAN_LY:   { label: 'Quản lý',    color: 'bg-purple-100 text-purple-800' },
  CHU_DN:    { label: 'Chủ DN',     color: 'bg-purple-100 text-purple-800' },
  LEAD_SALE: { label: 'Lead Sale',  color: 'bg-blue-100 text-blue-800' },
  LEAD_TELE: { label: 'Lead Tele',  color: 'bg-cyan-100 text-cyan-800' },
  LEAD_CSKH: { label: 'Lead CSKH', color: 'bg-teal-100 text-teal-800' },
  SALE:      { label: 'Sale',       color: 'bg-green-100 text-green-800' },
  TELE:      { label: 'Tele',       color: 'bg-sky-100 text-sky-800' },
  CSKH:      { label: 'CSKH',       color: 'bg-emerald-100 text-emerald-800' },
  LE_TAN:    { label: 'Lễ tân',     color: 'bg-yellow-100 text-yellow-800' },
  KE_TOAN:   { label: 'Kế toán',   color: 'bg-orange-100 text-orange-800' },
}

export const getRoleLabel = (role) => ROLES[role]?.label ?? role
export const getRoleColor = (role) => ROLES[role]?.color ?? 'bg-gray-100 text-gray-800'

export const FULL_ACCESS = ['QUAN_LY', 'CHU_DN', 'LEAD_SALE', 'LEAD_TELE', 'KE_TOAN', 'LE_TAN', 'LEAD_CSKH', 'CSKH']
export const isFullAccess = (role) => FULL_ACCESS.includes(role)

// Nav items visible per role
export const getNavItems = (role) => {
  const all = [
    { path: '/',               label: 'Dashboard',    icon: '🏠', roles: null },
    { path: '/customers',      label: 'Khách hàng',   icon: '👥', roles: null },
    { path: '/tele-queue',     label: 'Hàng chờ Tele',icon: '📞', roles: ['TELE','LEAD_TELE'] },
    { path: '/appointments',   label: 'Lịch hẹn',     icon: '📅', roles: null },
    { path: '/rooms',          label: 'Sơ đồ phòng',  icon: '🏥', roles: ['LE_TAN','QUAN_LY','CHU_DN','CSKH','LEAD_CSKH'] },
    { path: '/contracts',      label: 'Hợp đồng',     icon: '📋', roles: ['SALE','LEAD_SALE','CSKH','LEAD_CSKH','KE_TOAN','QUAN_LY','CHU_DN'] },
    { path: '/attendance',     label: 'Chấm công',    icon: '⏰', roles: ['KE_TOAN','QUAN_LY','CHU_DN'] },
    { path: '/salary',         label: 'Lương',        icon: '💰', roles: ['KE_TOAN','QUAN_LY','CHU_DN'] },
    { path: '/kpi',            label: 'KPI',          icon: '📊', roles: ['QUAN_LY','CHU_DN','LEAD_SALE','LEAD_TELE','LEAD_CSKH','KE_TOAN'] },
    { path: '/chat',           label: 'Chat',         icon: '💬', roles: null },
  ]
  return all.filter((item) => !item.roles || item.roles.includes(role))
}
