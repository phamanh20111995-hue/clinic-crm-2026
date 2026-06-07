import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  IconListCheck, IconBell, IconStar, IconRefresh,
  IconFileInvoice, IconCamera, IconCalendar, IconUsers,
} from '@tabler/icons-react'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import AppLayout from '../../components/layout/AppLayout'
import LieuTrinhTab  from './tabs/LieuTrinhTab'
import NhacLichTab   from './tabs/NhacLichTab'
import DanhGiaTab    from './tabs/DanhGiaTab'
import TaiKhamTab    from './tabs/TaiKhamTab'
import HopDongTab    from './tabs/HopDongTab'
import AnhChamSocTab from './tabs/AnhChamSocTab'
import HangChoTab    from './tabs/HangChoTab'
import AppointmentsTab from '../shared/AppointmentsTab'

const ACCENT  = '#be185d'
const ALLOWED = ['CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN']
const LEAD_ROLES = ['LEAD_CSKH', 'QUAN_LY', 'CHU_DN']

const BASE_TABS = [
  { k: 'lt',    l: 'Liệu trình',        Icon: IconListCheck },
  { k: 'nhac',  l: 'Nhắc lịch hôm nay', Icon: IconBell },
  { k: 'dg',    l: 'Đánh giá hài lòng', Icon: IconStar },
  { k: 'taika', l: 'Tái khám',          Icon: IconRefresh },
  null,
  { k: 'hd',    l: 'Nhập HĐ chăm sóc', Icon: IconFileInvoice },
  { k: 'anh',   l: 'Ảnh chăm sóc',      Icon: IconCamera },
  null,
  { k: 'appt',  l: 'Lịch hẹn',          Icon: IconCalendar },
]

const HANGCHO_TAB = { k: 'hangcho', l: 'Hàng chờ phân', Icon: IconUsers, leadOnly: true }

export default function CskhPage() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isLead = LEAD_ROLES.includes(role)
  const ALL_TAB_KEYS = ['hangcho', 'lt', 'nhac', 'dg', 'taika', 'hd', 'anh', 'appt']
  const defaultTab = isLead ? 'hangcho' : 'lt'
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab')
  const tab = ALL_TAB_KEYS.includes(rawTab) ? rawTab : defaultTab
  const setTab = (k) => setSearchParams({ tab: k }, { replace: true })

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

  // Build tab list: lead gets Hàng chờ first, then base tabs
  const tabs = isLead
    ? [HANGCHO_TAB, null, ...BASE_TABS]
    : BASE_TABS

  const metaEl = (
    <div style={{ fontSize: 10, color: ACCENT, background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: 6, padding: '3px 9px' }}>
      {user?.display_name ?? user?.email}
    </div>
  )

  return (
    <AppLayout title="CSKH" bare>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Subnav */}
        <div style={{
          height: 40, background: '#fff', borderBottom: '1px solid #dde3ef',
          display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8,
          gap: 2, flexShrink: 0, overflowX: 'auto',
        }}>
          {tabs.map((t, idx) => {
            if (t === null) {
              return <div key={`sep-${idx}`} style={{ width: 1, height: 20, background: '#dde3ef', flexShrink: 0, margin: '0 4px' }} />
            }
            const { Icon } = t
            const active = tab === t.k
            return (
              <button key={t.k} onClick={() => setTab(t.k)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', border: 'none',
                  borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`,
                  background: 'transparent',
                  color: active ? ACCENT : '#64748b',
                  fontWeight: active ? 700 : 400,
                  fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all .12s', flexShrink: 0, fontFamily: 'inherit',
                  height: 40, position: 'relative',
                }}>
                <Icon size={13} />
                {t.l}
              </button>
            )
          })}

          {/* Right: user chip */}
          <div style={{ marginLeft: 'auto', paddingRight: 4, flexShrink: 0 }}>{metaEl}</div>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {tab === 'hangcho' && <HangChoTab />}
          {tab === 'lt'      && <LieuTrinhTab />}
          {tab === 'nhac'    && <NhacLichTab />}
          {tab === 'dg'      && <DanhGiaTab />}
          {tab === 'taika'   && <TaiKhamTab />}
          {tab === 'hd'      && <HopDongTab />}
          {tab === 'anh'     && <AnhChamSocTab />}
          {tab === 'appt'    && (
            <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
              <AppointmentsTab accent={ACCENT} />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
