import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { getNavGroups, getUserRole, getRoleLabel } from '../../utils/rolesV2'
import { logout as apiLogout } from '../../api/auth'

// ── Sidebar v2 — nhóm + menu "Công việc theo bộ phận" xổ + hồ sơ ở đáy ──
export default function SidebarV2() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const role = getUserRole(user)
  const groups = getNavGroups(role)
  const [openDept, setOpenDept] = useState(true)

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = async () => {
    try { await apiLogout() } catch {}
    logout()
    navigate('/login', { replace: true })
  }

  const initials = (name) => (name ?? 'Tôi').trim().split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()

  // ── styles ──
  const headerStyle = { fontSize: 9.5, fontWeight: 700, letterSpacing: '.7px', color: '#5b6b86', textTransform: 'uppercase', padding: '9px 16px 3px' }
  const itemBase = { display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', margin: '1px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, color: '#cbd5e1', border: 'none', background: 'transparent', width: 'calc(100% - 16px)', textAlign: 'left', fontFamily: 'inherit', textDecoration: 'none' }
  const activeStyle = { background: 'var(--violet)', color: '#fff', fontWeight: 600 }

  const RightTag = ({ it }) => {
    if (it.badge) return <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 99, padding: '1px 6px' }}>{it.badge}</span>
    if (it.beta)  return <span style={{ marginLeft: 'auto', background: '#1e293b', color: '#a5b4fc', fontSize: 8.5, fontWeight: 700, border: '1px solid #4f46e5', borderRadius: 99, padding: '1px 6px' }}>Beta</span>
    return null
  }

  const NavItem = ({ it }) => {
    const active = isActive(it.path)
    const Icon = it.Icon
    return (
      <button
        onClick={() => navigate(it.path)}
        title={it.label}
        style={{ ...itemBase, ...(active ? activeStyle : {}) }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        {Icon && <Icon size={18} stroke={1.6} style={{ flexShrink: 0, opacity: .9 }} />}
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
        <RightTag it={it} />
      </button>
    )
  }

  // mục con bộ phận (thụt lề + chấm)
  const SubItem = ({ it }) => {
    const active = isActive(it.path)
    return (
      <button
        onClick={() => navigate(it.path)}
        title={it.label}
        style={{ ...itemBase, paddingLeft: 28, fontSize: 12.5, ...(active ? activeStyle : {}) }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.06)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : '#475569', flexShrink: 0 }} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
      </button>
    )
  }

  return (
    <aside className="sidebar-v2" style={{ alignItems: 'stretch', overflow: 'hidden', background: 'linear-gradient(180deg,#0f2044,#0b1731)' }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px 10px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🪷</div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 800, color: '#fff', fontSize: 15, letterSpacing: '.3px' }}>RIO CRM</div>
          <div style={{ fontSize: 9.5, color: '#8294b4', fontWeight: 500 }}>Phòng Khám Da liễu</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '4px 0 10px' }}>
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.header && <div style={headerStyle}>{g.header}</div>}
            {g.expand ? (
              <>
                <button
                  onClick={() => setOpenDept(o => !o)}
                  style={{ ...itemBase }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {g.expand.Icon && <g.expand.Icon size={18} stroke={1.6} style={{ flexShrink: 0, opacity: .9 }} />}
                  <span style={{ whiteSpace: 'nowrap' }}>{g.expand.label}</span>
                  <span style={{ marginLeft: 'auto', transition: 'transform .15s', transform: openDept ? 'rotate(90deg)' : 'none', opacity: .7 }}>▸</span>
                </button>
                <div style={{ overflow: 'hidden', maxHeight: openDept ? 600 : 0, transition: 'max-height .22s ease' }}>
                  {g.expand.items.map(it => <SubItem key={it.key} it={it} />)}
                </div>
              </>
            ) : (
              g.items.map(it => <NavItem key={it.key} it={it} />)
            )}
          </div>
        ))}
      </nav>

      {/* Hồ sơ ở đáy */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ position: 'relative', width: 32, height: 32, borderRadius: '50%', background: '#5b4b9e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12.5, flexShrink: 0 }}>
          {initials(user?.display_name)}
          <span style={{ position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #0b1731' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.display_name ?? 'Tôi'}</div>
          <div style={{ fontSize: 10.5, color: '#8294b4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getRoleLabel(role)}</div>
        </div>
        <button onClick={handleLogout} title="Đăng xuất"
          style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>⎋</button>
      </div>
    </aside>
  )
}
