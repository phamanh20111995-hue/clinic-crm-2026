import { useState } from 'react'
import AppLayout from '../../components/layout/AppLayout'
import useAuthStore from '../../store/authStore'
import TrucPageView from './views/TrucPageView'
import TeleMyWork from './views/TeleMyWork'
import TeleQueue from './views/TeleQueue'
import TeleHistory from './views/TeleHistory'
import TeleSchedule from './views/TeleSchedule'
import { IconLayoutGrid, IconPhone } from '@tabler/icons-react'

// Role → mode mapping
const CAN_TRUC  = ['QUAN_LY', 'CHU_DN', 'LEAD_TELE', 'LEAD_SALE', 'LEAD_CSKH']
const CAN_TELE  = ['TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN']

const TELE_TABS = [
  { key: 'my_work',  label: 'Việc của tôi' },
  { key: 'queue',    label: 'Hàng chờ Tele' },
  { key: 'history',  label: 'Lịch sử gọi' },
  { key: 'schedule', label: 'Lịch hẹn' },
]

export default function TelePage() {
  const { user } = useAuthStore()
  const role = user?.role

  const canTrucPage = CAN_TRUC.includes(role) || role === 'LEAD_TELE'
  const canTele     = CAN_TELE.includes(role)

  // Default mode based on role
  const defaultMode = canTrucPage && !canTele ? 'truc' :
                      canTele && !canTrucPage ? 'tele' : 'tele'

  const [mode, setMode]       = useState(defaultMode)
  const [teleTab, setTeleTab] = useState('my_work')

  const isTruc = mode === 'truc'

  const trucAccent = '#6d28d9'
  const teleAccent = '#0369a1'
  const accent = isTruc ? trucAccent : teleAccent

  // Topbar toggle buttons (if user can switch modes)
  const ModeToggle = (canTrucPage && canTele) ? (
    <div style={{ display: 'flex', gap: 1, background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
      <button
        onClick={() => setMode('truc')}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 6, border: 'none',
          background: isTruc ? trucAccent : 'transparent',
          color: isTruc ? '#fff' : '#6b7280',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <IconLayoutGrid size={14} stroke={2} />
        Trực page
      </button>
      <button
        onClick={() => setMode('tele')}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 6, border: 'none',
          background: !isTruc ? teleAccent : 'transparent',
          color: !isTruc ? '#fff' : '#6b7280',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <IconPhone size={14} stroke={2} />
        Gọi điện
      </button>
    </div>
  ) : null

  // Subnav tabs for Tele mode
  const tabs = !isTruc ? TELE_TABS : []

  return (
    <AppLayout
      title={isTruc ? 'Trực page — Nhập data' : 'Tele — Gọi điện'}
      meta={`${user?.display_name ?? user?.email}`}
      actions={ModeToggle}
      tabs={tabs}
      activeTab={teleTab}
      onTabChange={setTeleTab}
    >
      {/* Role not authorized */}
      {!canTrucPage && !canTele && (
        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔒</p>
          <p>Bạn không có quyền truy cập màn này.</p>
        </div>
      )}

      {/* Trực page view */}
      {canTrucPage && isTruc && <TrucPageView />}

      {/* Tele tabs */}
      {canTele && !isTruc && (
        <>
          {teleTab === 'my_work'  && <TeleMyWork />}
          {teleTab === 'queue'    && <TeleQueue />}
          {teleTab === 'history'  && <TeleHistory />}
          {teleTab === 'schedule' && <TeleSchedule />}
        </>
      )}
    </AppLayout>
  )
}
