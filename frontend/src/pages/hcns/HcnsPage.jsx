import { useSearchParams } from 'react-router-dom'
import {
  IconLayoutDashboard, IconUsers, IconFingerprint, IconCalendarTime, IconCalendarOff,
  IconChartBar, IconCoin, IconFileText, IconUserPlus, IconSchool, IconDeviceLaptop,
  IconReportAnalytics, IconRobot,
} from '@tabler/icons-react'
import useAuthStore from '../../store/authStore'
import { getUserRole } from '../../utils/rolesV2'
import AppLayout from '../../components/layout/AppLayout'

const ACCENT = '#0891b2'
const ALLOWED = ['HCNS', 'QUAN_LY', 'CHU_DN']

// Phase A: tất cả tab là shell. Tab có reuse ghi rõ sẽ nối ở Phase B.
const TABS = [
  { k: 'tongquan', l: 'Tổng quan',        icon: IconLayoutDashboard },
  { k: 'nhansu',   l: 'Nhân sự',          icon: IconUsers },
  { k: 'chamcong', l: 'Chấm công',        icon: IconFingerprint,   reuse: 'ChamCongTab + modal Chi tiết công' },
  { k: 'lichca',   l: 'Lịch & Ca',        icon: IconCalendarTime,  reuse: 'CaLamViecTab + LichBoPhanTab (scope all-departments)' },
  { k: 'phepvang', l: 'Phép & Vắng mặt',  icon: IconCalendarOff,   reuse: 'NghiPhepTab (mode hr) + thống kê quỹ phép' },
  { k: 'kpi',      l: 'KPI & Đánh giá',   icon: IconChartBar },
  { k: 'luong',    l: 'Lương & Chính sách', icon: IconCoin,        reuse: 'Luong3PTab = Bảng lương dự thảo' },
  { k: 'hdld',     l: 'Hợp đồng lao động', icon: IconFileText },
  { k: 'tuyendung', l: 'Tuyển dụng',      icon: IconUserPlus },
  { k: 'daotao',   l: 'Đào tạo',          icon: IconSchool },
  { k: 'taisan',   l: 'Tài sản & Thiết bị', icon: IconDeviceLaptop },
  { k: 'baocao',   l: 'Báo cáo',          icon: IconReportAnalytics },
  { k: 'hcnsai',   l: 'HCNS AI',          icon: IconRobot },
]

export default function HcnsPage() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const VALID = TABS.map(t => t.k)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = VALID.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'tongquan'
  const setTab = (k) => setSearchParams({ tab: k }, { replace: true })

  if (!ALLOWED.includes(role)) {
    return (
      <AppLayout title="HCNS">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 8 }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>Bạn không có quyền truy cập workspace HCNS</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Liên hệ quản lý để được cấp quyền</div>
        </div>
      </AppLayout>
    )
  }

  const cur = TABS.find(t => t.k === tab)

  return (
    <AppLayout title="HCNS — Hành chính · Nhân sự" bare>
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Subnav */}
      <div className="subnav-scroll" style={{ height: 40, background: '#fff', borderBottom: '1px solid #dde3ef', display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 8, gap: 2, flexShrink: 0, overflowX: 'auto', overflowY: 'hidden' }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.k
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: 'none', borderBottom: `2px solid ${active ? ACCENT : 'transparent'}`, background: 'transparent', color: active ? ACCENT : '#64748b', fontWeight: active ? 700 : 400, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'inherit', height: 40 }}>
              <Icon size={13} />
              {t.l}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: 'auto', padding: 20 }}>
        {/* Dòng nhắc tách nghiệp vụ HCNS ≠ Kế toán */}
        <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#155e63', marginBottom: 16 }}>
          <b>HCNS quản lý con người.</b> HCNS lập <b>bảng lương dự thảo</b> (công + KPI + chính sách) → người có quyền duyệt → <b>Kế toán</b> kiểm tra số &amp; chi trả. HCNS không thực hiện thanh toán.
        </div>

        <div style={{ background: '#fff', border: '1px solid #eef1f6', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30 }}>{cur?.reuse ? '♻️' : '🧩'}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#334155' }}>Tab “{cur?.l}”</div>
            {cur?.reuse ? (
              <>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>Sẽ tái dùng component có sẵn — không dựng mới, không duplicate.</div>
                <div style={{ marginTop: 6, fontSize: 11.5, background: '#f1f5f9', color: '#475569', borderRadius: 7, padding: '5px 11px' }}>Phase B — nối: {cur.reuse}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>UI shell — chưa có backend. Dựng khung trước, nối dữ liệu sau.</div>
                <div style={{ marginTop: 6, fontSize: 11.5, background: '#f1f5f9', color: '#475569', borderRadius: 7, padding: '5px 11px' }}>Trạng thái: placeholder</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
    </AppLayout>
  )
}
