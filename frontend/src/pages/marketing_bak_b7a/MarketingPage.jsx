import { useState } from 'react'
import { IconChartBar, IconEdit, IconSpeakerphone, IconFileAnalytics } from '@tabler/icons-react'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import TongQuanTab  from './tabs/TongQuanTab'
import NhapChiPhiTab from './tabs/NhapChiPhiTab'
import ChienDichTab from './tabs/ChienDichTab'
import BaoCaoTab    from './tabs/BaoCaoTab'

const ACCENT  = '#0284c7'
const ALLOWED = ['MKT', 'LEAD_MKT', 'QUAN_LY', 'CHU_DN']

const TABS = [
  { k: 'tq',     l: 'Tổng quan',         icon: IconChartBar },
  { k: 'nhap',   l: 'Nhập chi phí ngày', icon: IconEdit },
  { k: 'cd',     l: 'Chiến dịch',        icon: IconSpeakerphone },
  { k: 'baocao', l: 'Báo cáo tổng hợp', icon: IconFileAnalytics },
]

export default function MarketingPage() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const [tab, setTab] = useState('tq')
  const [nhapPlatform, setNhapPlatform] = useState('fb')

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  if (!ALLOWED.includes(role)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 8 }}>
        <div style={{ fontSize: 32 }}>🔒</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>Bạn không có quyền truy cập màn Marketing</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>Liên hệ quản lý để được cấp quyền</div>
      </div>
    )
  }

  const handleGoNhap = (platform) => {
    setNhapPlatform(platform)
    setTab('nhap')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Subnav */}
      <div style={{ height: 40, background: '#fff', borderBottom: '1px solid #dde3ef', display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8, gap: 2, flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.k
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: 'none', borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`, background: 'transparent', color: active ? ACCENT : '#64748b', fontWeight: active ? 700 : 400, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all .12s', flexShrink: 0, fontFamily: 'inherit', height: 40 }}>
              <Icon size={13} />
              {t.l}
            </button>
          )
        })}

        {/* Month selector + user label */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <select style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '3px 8px', fontSize: 10, fontFamily: 'inherit', outline: 'none', background: '#fff', cursor: 'pointer' }}>
            <option>Tháng {String(now.getMonth() + 1).padStart(2, '0')}/{now.getFullYear()}</option>
            <option>Tháng {String(now.getMonth()).padStart(2, '0') || '12'}/{now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}</option>
          </select>
          <span style={{ fontSize: 10, color: ACCENT, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '3px 9px', fontWeight: 600 }}>
            {user?.display_name ?? user?.email}
          </span>
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'tq'     && <TongQuanTab  onGoNhap={handleGoNhap} month={month} />}
        {tab === 'nhap'   && <NhapChiPhiTab initPlatform={nhapPlatform} month={month} />}
        {tab === 'cd'     && <ChienDichTab  month={month} />}
        {tab === 'baocao' && <BaoCaoTab />}
      </div>
    </div>
  )
}
