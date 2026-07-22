import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import AppLayout from '../../components/layout/AppLayout'
import SalePageView from './views/SalePageView'
import ChotHDModal from './modals/ChotHDModal'

const ACCENT = '#15803d'
const ALLOWED = ['SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN']

export default function SalePage() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const [showChot,  setShowChot]  = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  if (!ALLOWED.includes(role)) {
    return (
      <AppLayout title="Sale">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 8 }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>Bạn không có quyền truy cập màn Sale</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Liên hệ quản lý để được cấp quyền</div>
        </div>
      </AppLayout>
    )
  }

  const actions = (
    <button onClick={() => setShowChot(true)}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
      <IconPlus size={14} stroke={2.5} /> Tạo HĐ
    </button>
  )

  return (
    <AppLayout title="Sale" meta={user?.display_name ?? user?.email} actions={actions} bare>
      <SalePageView reloadKey={reloadKey} />
      {showChot && (
        <ChotHDModal
          onClose={() => setShowChot(false)}
          onDone={() => { setReloadKey(k => k + 1); setShowChot(false) }}
        />
      )}
    </AppLayout>
  )
}
