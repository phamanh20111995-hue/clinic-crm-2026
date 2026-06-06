import { NavLink } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { getNavItems, getRoleAccent, getUserRole } from '../../utils/rolesV2'

export default function BottomNav() {
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const accent = getRoleAccent(role)
  const items = getNavItems(role).slice(0, 5)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white flex md:hidden"
      style={{ height: 56, borderTop: '1px solid #dde3ef' }}
    >
      {items.map(({ key, path, label, Icon }) => (
        <NavLink
          key={key}
          to={path}
          end={path === '/'}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
          style={({ isActive }) => ({
            color: isActive ? accent : '#94a3b8',
            textDecoration: 'none',
          })}
        >
          {({ isActive }) => (
            <>
              <Icon size={20} stroke={isActive ? 2 : 1.6} />
              <span style={{ fontSize: 9, lineHeight: '1.1' }}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
