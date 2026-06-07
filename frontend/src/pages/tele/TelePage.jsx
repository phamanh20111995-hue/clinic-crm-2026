import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import useAuthStore from '../../store/authStore'
import TrucPageView from './views/TrucPageView'
import TeleMyWork from './views/TeleMyWork'
import TeleQueue from './views/TeleQueue'
import TeleHistory from './views/TeleHistory'
import TeleSchedule from './views/TeleSchedule'
import HoaDonTab from '../sale/tabs/HoaDonTab'
import NewDataModal from './modals/NewDataModal'
import ChotHDModal from '../sale/modals/ChotHDModal'
import { IconLayoutGrid, IconPhone, IconPlus, IconFileInvoice } from '@tabler/icons-react'
import { getUserRole } from '../../utils/rolesV2'

const CAN_TRUC = ['QUAN_LY', 'CHU_DN', 'LEAD_TELE', 'LEAD_SALE', 'LEAD_CSKH', 'TRUC_PAGE']
const CAN_TELE = ['TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN']

const TRUC_TABS = [{ key: 'nhap_data', label: 'Nhập data' }]

const TELE_TABS = [
  { key: 'my_work',  label: 'Việc của tôi' },
  { key: 'queue',    label: 'Hàng chờ Tele' },
  { key: 'history',  label: 'Lịch sử gọi' },
  { key: 'schedule', label: 'Lịch hẹn' },
  { key: 'hd',       label: 'Hoá đơn' },
]

export default function TelePage() {
  const { user } = useAuthStore()
  const role = getUserRole(user)

  const canTrucPage = CAN_TRUC.includes(role)
  const canTele     = CAN_TELE.includes(role)

  const defaultMode = (canTrucPage && !canTele) ? 'truc'
                    : (canTele && !canTrucPage)  ? 'tele'
                    : 'tele'

  const [showNewData, setShowNewData] = useState(false)
  const [showChot, setShowChot] = useState(false)

  const VALID_TELE_TABS = TELE_TABS.map(t => t.key)
  const [searchParams, setSearchParams] = useSearchParams()
  const rawMode = searchParams.get('mode')
  const mode = (rawMode === 'truc' || rawMode === 'tele') ? rawMode : defaultMode
  const setMode = (m) => setSearchParams(p => { const n = new URLSearchParams(p); n.set('mode', m); return n }, { replace: true })
  const rawTab = searchParams.get('tab')
  const teleTab = VALID_TELE_TABS.includes(rawTab) ? rawTab : 'my_work'
  const setTeleTab = (t) => setSearchParams(p => { const n = new URLSearchParams(p); n.set('tab', t); return n }, { replace: true })

  const isTruc = mode === 'truc'
  const trucAccent = '#6d28d9'
  const teleAccent = '#0369a1'

  // Display name — avoid template literal with undefined
  const displayName = user?.display_name || user?.email || ''

  // Mode toggle — show if role can access BOTH modes
  const ModeToggle = (canTrucPage && canTele) ? (
    <div style={{ display: 'flex', gap: 1, background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
      <button
        onClick={() => setMode('truc')}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 6, border: 'none',
          background: isTruc ? trucAccent : 'transparent',
          color: isTruc ? '#fff' : '#6b7280',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
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
          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
        }}
      >
        <IconPhone size={14} stroke={2} />
        Gọi điện
      </button>
    </div>
  ) : null

  // "Nhập data mới" button — shown in topbar when Trực page mode
  const NewDataBtn = isTruc ? (
    <button
      onClick={() => setShowNewData(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 14px', borderRadius: 7, border: 'none',
        background: trucAccent, color: '#fff',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}
    >
      <IconPlus size={14} stroke={2.5} />
      Nhập data mới
    </button>
  ) : null

  const ChotHDBtn = (!isTruc && teleTab === 'hd') ? (
    <button onClick={() => setShowChot(true)}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: teleAccent, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      <IconFileInvoice size={14} stroke={2} /> Tạo HĐ
    </button>
  ) : null

  const topbarActions = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {NewDataBtn}
      {ChotHDBtn}
      {ModeToggle}
    </div>
  )

  const tabs = isTruc ? TRUC_TABS : TELE_TABS
  const activeTab = isTruc ? 'nhap_data' : teleTab
  const handleTabChange = isTruc ? () => {} : setTeleTab

  return (
    <AppLayout
      title={isTruc ? 'Trực page — Nhập data' : 'Tele — Gọi điện'}
      meta={displayName}
      actions={topbarActions}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {/* Unauthorized */}
      {!canTrucPage && !canTele && (
        <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🔒</p>
          <p>Bạn không có quyền truy cập màn này.</p>
        </div>
      )}

      {/* Trực page */}
      {canTrucPage && isTruc && (
        <TrucPageView
          onNewData={() => setShowNewData(true)}
          hideNewBtn
        />
      )}

      {/* Tele tabs */}
      {canTele && !isTruc && (
        <>
          {teleTab === 'my_work'  && <TeleMyWork />}
          {teleTab === 'queue'    && <TeleQueue />}
          {teleTab === 'history'  && <TeleHistory />}
          {teleTab === 'schedule' && <TeleSchedule />}
          {teleTab === 'hd'       && <HoaDonTab />}
        </>
      )}

      {/* New data modal — controlled from topbar */}
      {showNewData && (
        <NewDataModal
          onClose={() => setShowNewData(false)}
          onDone={() => { setShowNewData(false) }}
        />
      )}
      {showChot && <ChotHDModal onClose={() => setShowChot(false)} onDone={() => setShowChot(false)} />}
    </AppLayout>
  )
}
