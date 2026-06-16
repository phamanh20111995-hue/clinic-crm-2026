import { useSearchParams } from 'react-router-dom'
import { IconCalendarOff, IconClock, IconUsers } from '@tabler/icons-react'
import AppLayout from '../../components/layout/AppLayout'
import NghiPhepTab from './tabs/NghiPhepTab'
import CaLamViecTab from './tabs/CaLamViecTab'
import LichBoPhanTab from './tabs/LichBoPhanTab'

const TABS = [
  { key: 'nghiphep', label: 'Nghỉ phép', icon: IconCalendarOff },
  { key: 'calam', label: 'Ca làm việc', icon: IconClock },
  { key: 'lichbophan', label: 'Lịch bộ phận', icon: IconUsers },
]

const VALID_TABS = TABS.map(t => t.key)

export default function SchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const tab = VALID_TABS.includes(rawTab) ? rawTab : 'nghiphep'
  const setTab = (k) => setSearchParams({ tab: k }, { replace: true })

  return (
    <AppLayout title="Lịch làm việc" bare>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Subnav */}
        <div style={{ height: 40, background: '#fff', borderBottom: '1px solid #dde3ef', display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8, gap: 2, flexShrink: 0, overflowX: 'auto' }}>
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.k || tab === t.key
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: 'none', borderBottom: `2px solid ${active ? '#0369a1' : 'transparent'}`, background: 'transparent', color: active ? '#0369a1' : '#64748b', fontWeight: active ? 700 : 400, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .12s', flexShrink: 0, fontFamily: 'inherit', height: 40 }}>
                <Icon size={13} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tab === 'nghiphep' && <NghiPhepTab />}
          {tab === 'calam' && <CaLamViecTab />}
          {tab === 'lichbophan' && <LichBoPhanTab />}
        </div>
      </div>
    </AppLayout>
  )
}
