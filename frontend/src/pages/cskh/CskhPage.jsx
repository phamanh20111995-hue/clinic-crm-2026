import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import AppLayout from '../../components/layout/AppLayout'
import CskhPageView from './views/CskhPageView'
import CustomerFormModal from '../customers/CustomerFormModal'

const ACCENT  = '#be185d'
const ALLOWED = ['CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN']

export default function CskhPage() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const [reloadKey, setReloadKey] = useState(0)
  const [showForm, setShowForm]   = useState(false)

  if (!ALLOWED.includes(role)) {
    return (
      <AppLayout title="CSKH">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 8 }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>Bạn không có quyền truy cập màn CSKH</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Liên hệ quản lý để được cấp quyền</div>
        </div>
      </AppLayout>
    )
  }

  const displayName = user?.display_name || user?.email || ''

  return (
    <AppLayout
      title="CSKH"
      meta={displayName}
      bare
    >
      <CskhPageView reloadKey={reloadKey} />

      {showForm && (
        <CustomerFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => { setReloadKey(k => k + 1); setShowForm(false) }}
        />
      )}
    </AppLayout>
  )
}