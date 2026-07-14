import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import useAuthStore from '../../store/authStore'
import TrucPageView from './views/TrucPageView'
import TelePageView from './views/TelePageView'
import CustomerFormModal from '../customers/CustomerFormModal'
import ChotHDModal from '../sale/modals/ChotHDModal'
import { IconLayoutGrid, IconPhone, IconPlus } from '@tabler/icons-react'
import { getUserRole } from '../../utils/rolesV2'

const CAN_TRUC = ['QUAN_LY', 'CHU_DN', 'LEAD_TELE', 'LEAD_SALE', 'LEAD_CSKH', 'TRUC_PAGE']
const CAN_TELE = ['TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN']

export default function TelePage() {
  const { user } = useAuthStore()
  const role = getUserRole(user)

  const canTrucPage = CAN_TRUC.includes(role)
  const canTele     = CAN_TELE.includes(role)

  const defaultMode = (canTrucPage && !canTele) ? 'truc'
                    : (canTele && !canTrucPage)  ? 'tele'
                    : 'tele'

  const [showNewData, setShowNewData] = useState(false)
  const [reloadKey, setReloadKey]     = useState(0)
  const [showChot, setShowChot]       = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const rawMode = searchParams.get('mode')
  const mode = (rawMode === 'truc' || rawMode === 'tele') ? rawMode : defaultMode
  const setMode = (m) => setSearchParams(p => { const n = new URLSearchParams(p); n.set('mode', m); return n }, { replace: true })

  const isTruc = mode === 'truc'
  const trucAccent = '#6d28d9'
  const teleAccent = '#0369a1'

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

  const NewDataBtn = (
    <button
      onClick={() => setShowNewData(true)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 14px', borderRadius: 7, border: 'none',
        background: isTruc ? trucAccent : teleAccent, color: '#fff',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}
    >
      <IconPlus size={14} stroke={2.5} />
      Nhập data mới
    </button>
  )

  const topbarActions = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {NewDataBtn}
      {ModeToggle}
    </div>
  )

  return (
    <AppLayout
      title={isTruc ? 'Trực page — Nhập data' : 'Tele'}
      meta={displayName}
      actions={topbarActions}
      bare
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
          reloadKey={reloadKey}
        />
      )}

      {/* Tele */}
      {canTele && !isTruc && (
        <TelePageView
          onNewData={() => setShowNewData(true)}
          reloadKey={reloadKey}
        />
      )}

      {showNewData && (
        <CustomerFormModal
          onClose={() => setShowNewData(false)}
          onSaved={() => { setReloadKey(k => k + 1); setShowNewData(false) }}
        />
      )}
      {showChot && <ChotHDModal onClose={() => setShowChot(false)} onDone={() => setShowChot(false)} />}
    </AppLayout>
  )
}
