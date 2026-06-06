import { useState } from 'react'
import { IconDoorEnter, IconPlus } from '@tabler/icons-react'
import AppLayout from '../../components/layout/AppLayout'
import HoMnayTab from './tabs/HoMnayTab'
import SoDoTab from './tabs/SoDoTab'
import ChiaTuaTab from './tabs/ChiaTuaTab'
import AnhDieuTriTab from './tabs/AnhDieuTriTab'
import LichTuanTab from './tabs/LichTuanTab'
import WalkInModal from './modals/WalkInModal'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'

const TABS = [
  { key: 'homnay',    label: 'Hôm nay' },
  { key: 'sodo',      label: 'Sơ đồ BS/KTV' },
  { key: 'chiatua',  label: 'Chia tua' },
  { key: 'anhdieurt',label: 'Ảnh điều trị' },
  { key: 'lichtuan', label: 'Lịch tuần' },
]

const ALLOWED_ROLES = ['LE_TAN', 'QUAN_LY', 'CHU_DN']

export default function LetanPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('homnay')
  const [showWalkIn, setShowWalkIn] = useState(false)

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
      {activeTab === 'sodo'      && <SoDoTab />}
      {activeTab === 'chiatua'   && <ChiaTuaTab />}
      {activeTab === 'anhdieurt' && <AnhDieuTriTab />}
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
