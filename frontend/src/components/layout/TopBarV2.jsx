import useAuthStore from '../../store/authStore'
import { getRoleLabel, getRoleAccent, getUserRole } from '../../utils/rolesV2'

export default function TopBarV2({ title, actions, meta }) {
  const { user } = useAuthStore()
  const role = getUserRole(user)
  const accent = getRoleAccent(role)

  return (
    <header className="topbar-v2">
      {/* Left */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <h1 className="font-semibold text-sm truncate" style={{ color: '#0f2044' }}>
          {title}
        </h1>
        {meta && meta !== 'undefined' && (
          <span className="text-xs text-gray-400 hidden sm:inline">{meta}</span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-3">
        {actions}
        <div
          className="flex items-center gap-2 ml-2 px-2.5 py-1 bg-white"
          style={{ border: '1px solid #dde3ef', borderRadius: 7 }}
        >
          <div
            className="flex items-center justify-center text-white font-semibold"
            style={{
              width: 20, height: 20, borderRadius: '50%',
              background: accent, fontSize: 9,
            }}
          >
            {user?.display_name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-xs font-medium text-gray-700 hidden sm:inline truncate max-w-[120px]">
            {user?.display_name || user?.email || ''}
          </span>
          <span
            className="font-medium text-white hidden sm:inline"
            style={{ background: accent, fontSize: 9, padding: '2px 6px', borderRadius: 99 }}
          >
            {getRoleLabel(role)}
          </span>
        </div>
      </div>
    </header>
  )
}
