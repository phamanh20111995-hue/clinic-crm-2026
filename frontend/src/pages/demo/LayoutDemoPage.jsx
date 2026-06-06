import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import useAuthStore from '../../store/authStore'
import { getNavItems, getRoleAccent, ROLES } from '../../utils/rolesV2'
import { IconInfoCircle } from '@tabler/icons-react'

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'detail',   label: 'Chi tiết', badge: 3 },
  { key: 'history',  label: 'Lịch sử' },
]

export default function LayoutDemoPage() {
  const { user, setUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')

  const accent = getRoleAccent(user?.role)
  const navItems = getNavItems(user?.role)

  return (
    <AppLayout
      title="Demo Layout v2"
      meta="Ca sáng: 08:00–12:00"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        <button className="btn-primary flex items-center gap-1.5">
          <IconInfoCircle size={15} stroke={2} />
          Thao tác
        </button>
      }
    >
      {/* Role switcher */}
      <div className="card mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Chuyển role để test sidebar
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLES).map(([role, info]) => {
            const isActive = user?.role === role
            const roleAccent = getRoleAccent(role)
            return (
              <button
                key={role}
                onClick={() => setUser({ ...user, role })}
                className="text-xs font-medium transition-colors"
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  border: `1px solid ${isActive ? roleAccent : '#dde3ef'}`,
                  background: isActive ? roleAccent : '#fff',
                  color: isActive ? '#fff' : '#4b5563',
                  cursor: 'pointer',
                }}
              >
                {info.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active tab content */}
      <div className="card mb-4">
        <p className="font-semibold mb-1">
          Tab: <span style={{ color: accent }}>{activeTab}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Role <strong>{user?.role}</strong> — {navItems.length} mục trong sidebar
        </p>
        <ul className="space-y-1.5">
          {navItems.map(({ label, path, Icon }) => (
            <li key={path} className="flex items-center gap-2.5 text-sm text-gray-700">
              <span style={{ color: accent }}><Icon size={16} stroke={2} /></span>
              <span>{label}</span>
              <span className="text-xs text-gray-400 ml-auto">{path}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Design tokens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Navy',    bg: '#0f2044', text: '#fff' },
          { label: 'Violet',  bg: '#6d28d9', text: '#fff' },
          { label: 'App BG',  bg: '#eef1f6', text: '#1e293b' },
          { label: 'Border',  bg: '#dde3ef', text: '#1e293b' },
        ].map((c) => (
          <div
            key={c.label}
            className="p-3 text-center text-xs font-medium"
            style={{
              background: c.bg, color: c.text,
              borderRadius: 10, border: '1px solid #dde3ef',
              boxShadow: '0 1px 4px rgba(0,0,0,.07)',
            }}
          >
            {c.label}<br />
            <span style={{ opacity: .7 }}>{c.bg}</span>
          </div>
        ))}
      </div>

      {/* Badge showcase */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Badges</p>
        <div className="flex flex-wrap gap-2">
          <span className="badge-ok">OK / Đã duyệt</span>
          <span className="badge-warn">Cảnh báo</span>
          <span className="badge-err">Lỗi / Hủy</span>
          <span className="badge-blue">Đang xử lý</span>
          <span className="badge-purple">Trực trang</span>
          <span className="badge-gray">Nháp</span>
        </div>
      </div>
    </AppLayout>
  )
}
