import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { IconBell, IconUserCircle, IconLogout } from '@tabler/icons-react'
import useAuthStore from '../../store/authStore'
import { getNavItems, getRoleAccent, getUserRole } from '../../utils/rolesV2'
import { logout as apiLogout } from '../../api/auth'

export default function SidebarV2() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const _fromParam = new URLSearchParams(location.search).get('from'); const fromTruc = _fromParam === 'truc' || _fromParam === 'tele' || _fromParam === 'cskh'
  const role = getUserRole(user)
  const navItems = getNavItems(role)
  const accent = getRoleAccent(role)

  const handleLogout = async () => {
    try { await apiLogout() } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="sidebar-v2">
      {/* Logo */}
      <div style={{
        width: '100%', padding: '12px 0',
        borderBottom: '1px solid rgba(255,255,255,.1)',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: 16,
        }}>
          C
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, width: '100%', overflowY: 'auto', marginTop: 4 }}>
        {navItems.map(({ key, path, label, Icon }) => (
          <NavLink
            key={key}
            to={path}
            end={path === '/'}
            className={({ isActive }) => { const eff = (_fromParam === 'cskh' && key === 'cskh') ? true : (((_fromParam === 'truc' || _fromParam === 'tele') && key === 'tele') ? true : (fromTruc && key === 'customers' ? false : isActive)); return `sidebar-item${eff ? ' active' : ''}` }}
            style={({ isActive }) => { const eff = (_fromParam === 'cskh' && key === 'cskh') ? true : (((_fromParam === 'truc' || _fromParam === 'tele') && key === 'tele') ? true : (fromTruc && key === 'customers' ? false : isActive)); return eff ? { background: accent } : undefined }}
            title={label}
          >
            <Icon size={20} stroke={1.6} />
            <span className="sidebar-item-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom — bell + user + logout */}
      <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,.1)', paddingBottom: 4 }}>
        <button className="sidebar-item" title="Tài khoản">
          <IconUserCircle size={20} stroke={1.6} />
          <span className="sidebar-item-label">
            {user?.display_name?.split(' ').pop() ?? 'Tôi'}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="sidebar-item"
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          title="Đăng xuất"
        >
          <IconLogout size={20} stroke={1.6} />
          <span className="sidebar-item-label">Thoát</span>
        </button>
      </div>
    </aside>
  )
}