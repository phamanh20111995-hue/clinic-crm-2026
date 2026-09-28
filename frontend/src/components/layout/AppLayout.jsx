import SidebarV2 from './SidebarV2'
import TopBarV2 from './TopBarV2'
import SubnavTabs from './SubnavTabs'
import BottomNav from './BottomNav'

/**
 * AppLayout Ã¢â‚¬â€ v2 layout shell
 *
 * Props:
 *   title       string           Ã¢â‚¬â€ topbar module name
 *   actions     ReactNode        Ã¢â‚¬â€ topbar right-side buttons
 *   meta        string           Ã¢â‚¬â€ small label next to title
 *   tabs        array            Ã¢â‚¬â€ [{ key, label, badge? }]  (managed subnav)
 *   activeTab   string
 *   onTabChange (key) => void
 *   noPadding   bool             Ã¢â‚¬â€ skip content padding (for card-style pages)
 *   bare        bool             Ã¢â‚¬â€ skip inner wrapper; page manages its own flex layout
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
  bare = false,
  children,
}) {
  const hasSubnav = tabs && tabs.length > 0

  // Offset for content area top
  const contentPaddingTop = hasSubnav
    ? 'calc(var(--topbar-h) + var(--subnav-h))'
    : 'var(--topbar-h)'

  return (
    <div style={{ minHeight: '100vh', background: '#eef1f6' }}>
      {/* Sidebar Ã¢â‚¬â€ desktop only */}
      <div className="hidden md:block">
        <SidebarV2 />
      </div>

      {/* Topbar */}
      <TopBarV2 title={title} actions={actions} meta={meta} />

      {/* Managed subnav (optional) */}
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
      {bare ? (
        /* bare mode: page owns its flex layout (inline subnav + scrollable content) */
        <div style={{
          marginLeft: 'var(--sidebar-w)',
          paddingTop: contentPaddingTop,
          height: 'calc(100vh - (' + contentPaddingTop + '))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {children}
        </div>
      ) : hasSubnav ? (
        /* subnav mode: content fills height so inner tables/pagination anchor to bottom */
        <div className="app-content-with-subnav" style={{
          marginLeft: 'var(--sidebar-w)',
          height: 'calc(100vh - (' + contentPaddingTop + ') - 40px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div className={noPadding ? 'pb-16 md:pb-0' : 'p-5'} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      ) : (
        <div className={hasSubnav ? 'app-content-with-subnav' : 'app-content'}>
          <div className={noPadding ? 'pb-16 md:pb-0' : 'p-5 pb-20 md:pb-5'}>
            {children}
          </div>
        </div>
      )}

      {/* Bottom nav Ã¢â‚¬â€ mobile only */}
      <BottomNav />
    </div>
  )
}
