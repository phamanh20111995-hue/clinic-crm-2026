import { getRoleAccent, getUserRole } from '../../utils/rolesV2'
import useAuthStore from '../../store/authStore'

/**
 * tabs: [{ key, label, badge? }]
 * active: key of active tab
 * onChange: (key) => void
 */
export default function SubnavTabs({ tabs = [], active, onChange }) {
  const { user } = useAuthStore()
  const accent = getRoleAccent(getUserRole(user))

  return (
    <div className="subnav-v2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`subnav-tab${active === tab.key ? ' active' : ''}`}
          style={
            active === tab.key
              ? { color: accent, borderBottomColor: accent }
              : undefined
          }
        >
          {tab.label}
          {tab.badge != null && tab.badge > 0 && (
            <span
              className="ml-1.5 rounded-full text-white font-medium"
              style={{ background: accent, fontSize: 9, padding: '2px 5px' }}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
