import { NavLink } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { getNavItems, getRoleLabel, getRoleColor } from '../../utils/roles'
import { logout as apiLogout } from '../../api/auth'

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navItems = getNavItems(user?.role)

  const handleLogout = async () => {
    try { await apiLogout() } catch {}
    logout()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-gray-900 text-white flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">C</div>
          <div>
            <p className="font-semibold text-sm leading-tight">CRM Phòng Khám</p>
            <p className="text-xs text-gray-400">Da liễu + Nha khoa</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.display_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.display_name ?? user?.email}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${getRoleColor(user?.role)}`}>
              {getRoleLabel(user?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white font-medium'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span>🚪</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}
