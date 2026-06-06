import SidebarV2 from './SidebarV2'
import TopBarV2 from './TopBarV2'
import SubnavTabs from './SubnavTabs'
import BottomNav from './BottomNav'

/**
 * AppLayout — v2 layout shell
 *
 * Props:
 *   title       string           — topbar module name
 *   actions     ReactNode        — topbar right-side buttons
 *   meta        string           — small label next to title
 *   tabs        array            — [{ key, label, badge? }]
 *   activeTab   string
 *   onTabChange (key) => void
 *   noPadding   bool
 *   children    ReactNode
 */
export default function AppLayout({
  title,
  actions,
  meta,
  tabs,
  activeTab,
  onTabChange,
  noPadding = false,
  children,
}) {
  const hasSubnav = tabs && tabs.length > 0

  return (
    <div style={{ minHeight: '100vh', background: '#eef1f6' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <SidebarV2 />
      </div>

      {/* Topbar */}
      <TopBarV2 title={title} actions={actions} meta={meta} />

      {/* Subnav (optional) */}
      {hasSubnav && (
        <div
          className="fixed z-20 right-0 bg-white"
          style={{
            top: 'var(--topbar-h)',
            left: 'var(--sidebar-w)',
            borderBottom: '1px solid #dde3ef',
          }}
        >
          <SubnavTabs tabs={tabs} active={activeTab} onChange={onTabChange} />
        </div>
      )}

      {/* Content */}
      <div className={hasSubnav ? 'app-content-with-subnav' : 'app-content'}>
        <div className={noPadding ? 'pb-16 md:pb-0' : 'p-5 pb-20 md:pb-5'}>
          {children}
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />
    </div>
  )
}
