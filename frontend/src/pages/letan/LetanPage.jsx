import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconPlus } from '@tabler/icons-react'
import AppLayout from '../../components/layout/AppLayout'
import HoMnayTab from './tabs/HoMnayTab'
import SoDoTab from './tabs/SoDoTab'
import ChiaTuaTab from './tabs/ChiaTuaTab'
import LichTuanTab from './tabs/LichTuanTab'
import PhongNhanSuTab from './tabs/PhongNhanSuTab'
import WalkInModal from './modals/WalkInModal'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'

const TABS = [
  { key: 'homnay',    label: 'Lịch hẹn' },
  { key: 'phong',     label: 'Phòng & Nhân sự realtime' },
  { key: 'sodo',      label: 'Lịch làm việc cơ sở' },
  { key: 'chiatua',  label: 'Bảng tua' },
  { key: 'lichtuan', label: 'Lịch tuần' },
]

const ALLOWED_ROLES = ['LE_TAN', 'CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN']

export default function LetanPage() {
  const { user } = useAuthStore()
  const [showWalkIn, setShowWalkIn] = useState(false)

  const VALID_TABS = TABS.map(t => t.key)
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const activeTab = VALID_TABS.includes(rawTab) ? rawTab : 'homnay'
  const setActiveTab = (k) => setSearchParams({ tab: k }, { replace: true })

  if (user && !ALLOWED_ROLES.includes(getUserRole(user))) {
    return (
      <AppLayout title="Lễ tân">
        <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>🚫</p>
          <p>Bạn không có quyền truy cập màn Lễ tân.</p>
        </div>
      </AppLayout>
    )
  }

  const actions = (
    <button onClick={() => setShowWalkIn(true)}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 7, border: 'none', background: '#b45309', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      <IconPlus size={14} stroke={2.5} /> Walk-in
    </button>
  )

  return (
    <AppLayout
      title="Lễ tân"
      meta={new Date().toLocaleDateString('vi', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
      actions={actions}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === 'homnay'    && <HoMnayTab onWalkIn={() => setShowWalkIn(true)} />}
      {activeTab === 'phong'     && <PhongNhanSuTab />}
      {activeTab === 'sodo'      && <SoDoTab />}
      {activeTab === 'chiatua'   && <ChiaTuaTab />}
      {activeTab === 'lichtuan'  && <LichTuanTab />}

      {showWalkIn && (
        <WalkInModal onClose={() => setShowWalkIn(false)} onDone={() => {
          setShowWalkIn(false)
          setActiveTab('homnay')
        }} />
      )}
    </AppLayout>
  )
}
