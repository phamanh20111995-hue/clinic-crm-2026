import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconChecks, IconTrendingUp, IconClockDollar, IconPackage, IconFileCertificate, IconCoin, IconFingerprint, IconCalendarTime, IconFileInvoice, IconPlus } from '@tabler/icons-react'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import AppLayout from '../../components/layout/AppLayout'
import { getContracts } from '../../api/ketoan'
import HoaDonTab from '../sale/tabs/HoaDonTab'
import ChotHDModal from '../sale/modals/ChotHDModal'
import DuyetHDTab from './tabs/DuyetHDTab'
import DoanhThuTab from './tabs/DoanhThuTab'
import CongNoTab from './tabs/CongNoTab'
import KhoTab from './tabs/KhoTab'
import HoSoThueTab from './tabs/HoSoThueTab'
import LuongTuaTab from './tabs/LuongTuaTab'
import ChamCongTab from './tabs/ChamCongTab'
import CaLamViecTab from './tabs/CaLamViecTab'

const ACCENT = '#b45309'
const ALLOWED = ['KE_TOAN', 'QUAN_LY', 'CHU_DN']

const TABS = [
  { k: 'duyet', l: 'Duyệt HĐ', icon: IconChecks },
  { k: 'dt', l: 'Doanh thu', icon: IconTrendingUp },
  { k: 'no', l: 'Công nợ', icon: IconClockDollar },
  { k: 'luong', l: 'Lương & Tua', icon: IconCoin },
  { k: 'kho', l: 'Kho', icon: IconPackage },
  { k: 'thue', l: 'Hồ sơ thuế', icon: IconFileCertificate },
  null,
  { k: 'chamcong', l: 'Chấm công', icon: IconFingerprint },
  { k: 'ca', l: 'Ca làm việc', icon: IconCalendarTime },
  null,
  { k: 'tao_hd', l: 'Tạo HĐ', icon: IconFileInvoice },
]

export default function KetoanPage() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const [pendingCount, setPendingCount] = useState(0)
  const [showChot, setShowChot] = useState(false)
  const VALID_TABS = TABS.filter(Boolean).map(t => t.k)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'duyet'
  const setTab = (k) => setSearchParams({ tab: k }, { replace: true })

  useEffect(() => {
    if (!ALLOWED.includes(role)) return
    getContracts({ approval_status: 'pending_kt' })
      .then(r => {
        const data = r.data?.results ?? r.data ?? []
        setPendingCount(Array.isArray(data) ? data.length : data.count ?? 0)
      })
      .catch(() => {})
  }, [role])

  if (!ALLOWED.includes(role)) {
    return (
      <AppLayout title="Kế toán">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 8 }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>Bạn không có quyền truy cập màn Kế toán</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Liên hệ quản lý để được cấp quyền</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Kế toán" bare>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Subnav */}
      <div style={{ height: 40, background: '#fff', borderBottom: '1px solid #dde3ef', display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8, gap: 2, flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map((t, i) => {
          if (t === null) return <div key={`sep-${i}`} style={{ width: 1, height: 20, background: '#dde3ef', flexShrink: 0, margin: '0 4px' }} />
          const Icon = t.icon
          const active = tab === t.k
          const badge = t.k === 'duyet' && pendingCount > 0 ? pendingCount : null
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: 'none', borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`, background: 'transparent', color: active ? ACCENT : '#64748b', fontWeight: active ? 700 : 400, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .12s', flexShrink: 0, fontFamily: 'inherit', height: 40 }}>
              <Icon size={13} />
              {t.l}
              {badge && (
                <span style={{ background: '#dc2626', color: '#fff', borderRadius: 20, padding: '0 5px', fontSize: 9, fontWeight: 700, marginLeft: 2 }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', padding: '0 4px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {tab === 'tao_hd' && (
            <button onClick={() => setShowChot(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              <IconPlus size={13} /> Tạo HĐ
            </button>
          )}
          <span style={{ fontSize: 10, color: '#b45309', background: '#fef9f0', border: '1px solid #fde68a', borderRadius: 6, padding: '3px 9px', fontWeight: 600 }}>
            {user?.display_name ?? user?.email}
          </span>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'duyet'  && <DuyetHDTab />}
        {tab === 'dt'     && <DoanhThuTab />}
        {tab === 'no'     && <CongNoTab />}
        {tab === 'luong'  && <LuongTuaTab />}
        {tab === 'kho'    && <KhoTab />}
        {tab === 'thue'   && <HoSoThueTab />}
        {tab === 'chamcong' && <ChamCongTab />}
        {tab === 'ca'     && <CaLamViecTab />}
        {tab === 'tao_hd' && <HoaDonTab />}
      </div>
    </div>
    {showChot && <ChotHDModal onClose={() => setShowChot(false)} onDone={() => setShowChot(false)} />}
    </AppLayout>
  )
}
