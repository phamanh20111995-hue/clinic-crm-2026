import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { IconPlus, IconBriefcase, IconFileInvoice, IconPhoto, IconCreditCard, IconUsers, IconCalendar } from '@tabler/icons-react'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import AppLayout from '../../components/layout/AppLayout'
import ViecHomNayTab from './tabs/ViecHomNayTab'
import HoaDonTab from './tabs/HoaDonTab'
import AnhDieuTriTab from './tabs/AnhDieuTriTab'
import CongNoTab from './tabs/CongNoTab'
import ChotHDModal from './modals/ChotHDModal'
import AppointmentsTab from '../shared/AppointmentsTab'

const ACCENT = '#15803d'
const ALLOWED = ['SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN']

const TABS = [
  { k: 'viec',  l: 'Việc hôm nay', icon: IconBriefcase },
  { k: 'hd',    l: 'Hoá đơn',      icon: IconFileInvoice },
  { k: 'anh',   l: 'Ảnh điều trị', icon: IconPhoto },
  { k: 'no',    l: 'Công nợ',      icon: IconCreditCard },
  { k: 'appt',  l: 'Lịch hẹn',     icon: IconCalendar },
]

export default function SalePage() {
  const navigate = useNavigate()
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const [showChot, setShowChot] = useState(false)
  const VALID_TABS = TABS.map(t => t.k)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = VALID_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'viec'
  const setTab = (k) => setSearchParams({ tab: k }, { replace: true })

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

  return (
    <AppLayout title="Sale" bare>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Subnav */}
      <div style={{ height: 40, background: '#fff', borderBottom: '1px solid #dde3ef', display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8, gap: 2, flexShrink: 0 }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.k
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: 'none', background: active ? '#f0fdf4' : 'transparent', color: active ? ACCENT : '#64748b', fontWeight: active ? 700 : 400, fontSize: 12, cursor: 'pointer', transition: 'all .12s' }}>
              <Icon size={13} />
              {t.l}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#64748b', padding: '3px 8px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontWeight: 600 }}>
            {user?.display_name ?? user?.email}
          </span>
          <button onClick={() => setShowChot(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <IconPlus size={13} /> Tạo HĐ
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'viec' && <ViecHomNayTab onOpenChotHD={() => setShowChot(true)} />}
        {tab === 'hd'   && <HoaDonTab />}
        {tab === 'anh'  && <AnhDieuTriTab />}
        {tab === 'no'   && <CongNoTab />}
        {tab === 'appt' && <AppointmentsTab accent={ACCENT} />}
      </div>

      {/* Bottom nav (mobile) */}
      <div style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, height: 56, background: '#fff', borderTop: '1px solid #dde3ef', zIndex: 100 }} className="sale-bottom-nav">
        {[
          { k: 'viec', l: 'Việc', icon: IconBriefcase },
          { k: 'chot', l: 'Tạo HĐ', icon: IconPlus, action: () => setShowChot(true) },
          { k: 'kh', l: 'KH tôi', icon: IconUsers, action: () => navigate('/customers') },
          { k: 'hd', l: 'Hoá đơn', icon: IconFileInvoice },
          { k: 'no', l: 'Công nợ', icon: IconCreditCard },
        ].map(item => {
          const Icon = item.icon
          const active = !item.action && tab === item.k
          return (
            <button key={item.k} onClick={() => item.action ? item.action() : setTab(item.k)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, border: 'none', background: 'transparent', cursor: 'pointer', color: active ? ACCENT : '#64748b' }}>
              <Icon size={18} />
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 400 }}>{item.l}</span>
            </button>
          )
        })}
      </div>

      {showChot && <ChotHDModal onClose={() => setShowChot(false)} onDone={() => setShowChot(false)} />}
    </div>
    </AppLayout>
  )
}
