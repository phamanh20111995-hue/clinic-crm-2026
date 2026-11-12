import { useState, useEffect } from 'react'
import {
  IconCoin, IconWallet, IconCheck, IconCalculator, IconDeviceFloppy,
  IconPercentage, IconStethoscope, IconUserDollar, IconClipboardCheck, IconX, IconSearch, IconFilter, IconRefresh,
} from '@tabler/icons-react'
import {
  getSalaryMonthly, calculateSalary, approveSalary,
  getCommissionRates, updateCommissionRate,
  getServiceTua, updateServiceTua,
  getSalaryConfigs, updateSalaryConfig,
  getTuaAllocations, confirmTuaAlloc,
} from '../../../api/ketoan'
import { getAllUsers } from '../../../api/letan'
import KetoanListShell from '../components/KetoanListShell'
import toast from 'react-hot-toast'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const now = new Date()
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const shiftDate = (s, delta) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + delta); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

const SUBTABS = [
  { k: 'bang',    l: 'Bảng lương',       icon: IconWallet },
  { k: 'bangtua', l: 'Bảng tua',         icon: IconClipboardCheck },
  { k: 'hh',      l: '% Hoa hồng',       icon: IconPercentage },
  { k: 'tua',     l: 'Đơn giá tua',      icon: IconStethoscope },
  { k: 'cung',    l: 'Lương cứng (P1·P2)', icon: IconUserDollar },
]

// ── Chuẩn bảng (giống CustomerTable/Tele) ──
const th  = { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }
const thR = { ...th, textAlign: 'right' }
const td  = { padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }
const tdR = { ...td, textAlign: 'right' }
const tbl = { width: '100%', borderCollapse: 'collapse', fontSize: 12 }
const inp = { width: 96, padding: '4px 7px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, textAlign: 'right', fontFamily: 'inherit', outline: 'none' }
const txtInp = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit' }
const selStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: '#fff', outline: 'none', cursor: 'pointer' }
const navBtnStyle = { border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }
const btnSave = { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 9px', border: '1px solid #00b259', borderRadius: 7, background: '#fff', color: '#00880f', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
// Ghim cột nút ở mép phải để không bị khuất khi cuộn ngang (giống CongNoTab/ChiTab)
const thAction = { ...th, right: 0, zIndex: 3, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
const tdAction = { ...td, position: 'sticky', right: 0, background: '#fff', zIndex: 2, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }

function StatCard({ label, value, sub, accent, onClick, active }) {
  return (
    <div onClick={onClick} style={{ background: '#fff', border: `1px solid ${active ? accent : '#dde3ef'}`, outline: active ? `1px solid ${accent}` : 'none', borderRadius: 10, padding: '11px 15px', cursor: onClick ? 'pointer' : 'default', minWidth: 0 }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: accent, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
    </div>
  )
}
const statsGrid = (cards) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cards.length}, minmax(0,1fr))`, gap: 10 }}>
    {cards.map((c, i) => <StatCard key={i} {...c} />)}
  </div>
)
const monthYearBar = (month, setMonth, year, setYear, extra) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
    <select value={month} onChange={e => setMonth(+e.target.value)} style={selStyle}>
      {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
    </select>
    <select value={year} onChange={e => setYear(+e.target.value)} style={selStyle}>
      {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
    </select>
    {extra}
  </div>
)
const searchBar = (q, setQ, placeholder) => (
  <div style={{ position: 'relative', width: 260 }}>
    <IconSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
    <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
  </div>
)
const usePaging = (count, deps) => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  useEffect(() => { setPage(1) }, deps) // eslint-disable-line
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  const safePage = Math.min(page, totalPages)
  return { page: safePage, pageSize, setPage, setPageSize, slice: [(safePage - 1) * pageSize, safePage * pageSize] }
}

export default function Luong3PTab() {
  const [sub, setSub] = useState('bang')
  return (
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f1f5f9' }}>
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px 0', flexShrink: 0 }}>
        {SUBTABS.map(t => {
          const Icon = t.icon; const active = sub === t.k
          return (
            <button key={t.k} onClick={() => setSub(t.k)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: '1px solid', borderColor: active ? '#6d28d9' : '#dde3ef', borderBottom: active ? '2px solid #6d28d9' : '1px solid #dde3ef', borderRadius: '8px 8px 0 0', background: active ? '#fff' : '#f8fafc', color: active ? '#6d28d9' : '#64748b', fontWeight: active ? 700 : 500, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Icon size={13} /> {t.l}
            </button>
          )
        })}
      </div>
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {sub === 'bang' && <BangLuong />}
        {sub === 'bangtua' && <BangTua />}
        {sub === 'hh'   && <HoaHong />}
        {sub === 'tua'  && <DonGiaTua />}
        {sub === 'cung' && <LuongCung />}
      </div>
    </div>
  )
}

/* ─── 1. Bảng lương tháng (3P) ─────────────────────────────────────────── */
function BangLuong() {
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear]   = useState(now.getFullYear())
  const [data, setData]   = useState({ records: [], total_payout: 0, total_staff: 0, approved: 0, paid: 0, draft: 0 })
  const [loading, setLoading] = useState(false)

  const load = () => getSalaryMonthly({ year, month }).then(r => {
    const d = r.data || {}
    setData({ records: d.records ?? (Array.isArray(d) ? d : []), total_payout: d.total_payout ?? 0, total_staff: d.total_staff ?? 0, approved: d.approved ?? 0, paid: d.paid ?? 0, draft: d.draft ?? 0 })
  }).catch(() => {})
  useEffect(() => { load() }, [month, year])

  const doCalc = () => {
    setLoading(true)
    calculateSalary({ month, year, overwrite: true })
      .then(r => { toast.success(`Đã tính ${r.data?.calculated ?? 0} bảng lương`); load() })
      .catch(e => toast.error(e.response?.data?.detail || 'Lỗi tính lương'))
      .finally(() => setLoading(false))
  }
  const doApprove = (rec, action) => {
    approveSalary(rec.id, { action })
      .then(() => { toast.success(action === 'approve' ? 'Đã duyệt' : 'Đã thanh toán'); load() })
      .catch(e => toast.error(e.response?.data?.detail || 'Lỗi'))
  }

  const recs = data.records || []
  const p2 = r => Number(r.competency || 0) + Number(r.allowance || 0)
  const p3 = r => Number(r.commission || 0) + Number(r.tua_income || 0) + Number(r.bonus || 0)
  const pg = usePaging(recs.length, [month, year, recs.length])
  const paged = recs.slice(pg.slice[0], pg.slice[1])

  const stats = statsGrid([
    { label: 'Tổng chi lương', value: fmt(data.total_payout) + 'đ', sub: `${data.total_staff} nhân sự · T${month}/${year}`, accent: '#6d28d9' },
    { label: 'Nháp', value: String(data.draft), sub: 'Chờ duyệt', accent: '#1e40af' },
    { label: 'Đã duyệt', value: String(data.approved), sub: 'Chờ thanh toán', accent: '#854d0e' },
    { label: 'Đã thanh toán', value: String(data.paid), sub: 'Hoàn tất', accent: '#15803d' },
  ])
  const toolbar = monthYearBar(month, setMonth, year, setYear, (
    <>
      <button onClick={doCalc} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', border: 'none', borderRadius: 7, background: '#6d28d9', color: '#fff', fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: loading ? .6 : 1 }}>
        <IconCalculator size={14} /> {loading ? 'Đang tính…' : 'Tính lương tháng'}
      </button>
      <span style={{ fontSize: 10, color: '#94a3b8' }}>Tính lại cập nhật bản <b>nháp</b>; đã duyệt/đã trả giữ nguyên.</span>
    </>
  ))

  return (
    <KetoanListShell stats={stats} toolbar={toolbar}
      pagination={{ page: pg.page, pageSize: pg.pageSize, count: recs.length, onPage: pg.setPage, onPageSize: pg.setPageSize }}>
      <table style={{ ...tbl, minWidth: 1240 }}>
        <thead><tr>
          <th style={th}>Nhân sự</th><th style={th}>Vai trò</th><th style={thR}>Công</th>
          <th style={thR}>P1 · Vị trí</th><th style={thR}>P2 · Năng lực+PC</th><th style={thR}>P3 · Hiệu suất</th>
          <th style={thR}>Khấu trừ</th><th style={thR}>BH (10.5%)</th><th style={thR}>TNCN</th><th style={thR}>Thực nhận</th><th style={th}>Trạng thái</th><th style={thAction}></th>
        </tr></thead>
        <tbody>
          {paged.length === 0 ? (
            <tr><td style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: 40 }} colSpan={12}>Chưa có bảng lương — bấm <b>Tính lương tháng</b></td></tr>
          ) : paged.map(r => (
            <tr key={r.id} style={{ cursor: 'default' }}>
              <td style={td}><b style={{ color: '#0f2044' }}>{r.user_name}</b></td>
              <td style={td}><span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{r.user_role}</span></td>
              <td style={tdR}>{r.actual_days}/{r.working_days}</td>
              <td style={tdR}>{fmt(r.base)}</td>
              <td style={tdR} title={`Năng lực ${fmt(r.competency)} + Phụ cấp ${fmt(r.allowance)}`}>{fmt(p2(r))}</td>
              <td style={tdR} title={`Hoa hồng ${fmt(r.commission)} + Tua ${fmt(r.tua_income)} + Thưởng ${fmt(r.bonus)}`}><b style={{ color: '#6d28d9' }}>{fmt(p3(r))}</b></td>
              <td style={{ ...tdR, color: r.deductions > 0 ? '#dc2626' : '#94a3b8' }}>{r.deductions > 0 ? '−' + fmt(r.deductions) : '0'}</td>
              <td style={{ ...tdR, color: r.bh_deduct > 0 ? '#dc2626' : '#94a3b8' }} title="BHXH 8% + BHYT 1.5% + BHTN 1%">{r.bh_deduct > 0 ? '−' + fmt(r.bh_deduct) : '0'}</td>
              <td style={{ ...tdR, color: r.tncn_deduct > 0 ? '#dc2626' : '#94a3b8' }} title="Thuế TNCN lũy tiến">{r.tncn_deduct > 0 ? '−' + fmt(r.tncn_deduct) : '0'}</td>
              <td style={{ ...tdR, fontWeight: 700, color: '#0f2044' }}>{fmt(r.total)}đ</td>
              <td style={td}>
                <span style={{ background: r.status === 'paid' ? '#dcfce7' : r.status === 'approved' ? '#fef9c3' : '#e0f2fe', color: r.status === 'paid' ? '#15803d' : r.status === 'approved' ? '#854d0e' : '#0369a1', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{r.status_display || r.status}</span>
              </td>
              <td style={tdAction}>
                {r.status === 'draft' && <button onClick={() => doApprove(r, 'approve')} style={btnSave}>Duyệt</button>}
                {r.status === 'approved' && <button onClick={() => doApprove(r, 'pay')} style={{ ...btnSave, borderColor: '#1e40af', color: '#1e40af' }}>Thanh toán</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </KetoanListShell>
  )
}

/* ─── 2. Bảng tua KT (chia tua 2 lớp) ──────────────────────────────────── */
const TUA_STYLE = {
  cho_xac_nhan: { bg: '#fef9c3', c: '#854d0e', l: 'Chờ xác nhận' },
  da_xac_nhan:  { bg: '#dcfce7', c: '#15803d', l: 'Đã xác nhận' },
  tu_choi:      { bg: '#fee2e2', c: '#991b1b', l: 'Từ chối' },
  huy:          { bg: '#f1f5f9', c: '#64748b', l: 'Đã hủy' },
}
const ROLE_BG = {
  BS_TU_VAN: { bg: '#eff6ff', c: '#1d4ed8' }, BS_DIEU_TRI: { bg: '#f0fdf4', c: '#15803d' },
  KTV: { bg: '#faf5ff', c: '#7c3aed' }, SALE: { bg: '#fff7ed', c: '#b45309' },
}
const TUA_SHORT = { cho_xac_nhan: 'Chờ', da_xac_nhan: '✓', tu_choi: '✗', huy: 'Hủy' }

// ── Thông tin KH đồng bộ từ Lịch hẹn (giống bảng tua Lễ tân / bảng Khách hàng) ──
const SOURCES = [
  { value: 'facebook', label: 'Facebook' }, { value: 'zalo', label: 'Zalo' },
  { value: 'google', label: 'Google/Maps' }, { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' }, { value: 'gioi_thieu', label: 'Giới thiệu' },
  { value: 'walkin', label: 'Walk-in' }, { value: 'khac', label: 'Khác' },
]
const CUSTOMER_GROUPS = ['Khách mới', 'Khách thường', 'Khách thân thiết', 'VIP', 'VVIP', 'Khách giới thiệu', 'Khách nội bộ']
const PROVINCES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế', 'Tuyên Quang', 'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình', 'Quảng Trị', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hòa', 'Lâm Đồng', 'Đắk Lắk', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang', 'Cao Bằng', 'Điện Biên', 'Hà Tĩnh', 'Lai Châu', 'Lạng Sơn', 'Nghệ An', 'Quảng Ninh', 'Thanh Hóa', 'Sơn La']
const DATA_TYPE_LABELS = { nong: '🔥 Nóng', am: '🌤 Ấm', thuong: '❄ Thường' }
const DATA_TYPE_COLORS = { nong: { bg: '#fee2e2', c: '#991b1b' }, am: { bg: '#fef9c3', c: '#854d0e' }, thuong: { bg: '#f1f5f9', c: '#475569' } }
const VISIT_LABELS = { tu_van: 'Tư vấn', dieu_tri: 'Điều trị', tai_kham: 'Tái khám', khieu_nai: 'Khiếu nại' }
const VISIT_COLORS = { tu_van: { bg: '#dbeafe', c: '#1d4ed8' }, dieu_tri: { bg: '#dcfce7', c: '#15803d' }, tai_kham: { bg: '#ede9fe', c: '#6d28d9' }, khieu_nai: { bg: '#fee2e2', c: '#991b1b' } }
function fmtPhone(p) {
  if (!p) return '—'
  const s = String(p).replace(/\D/g, '')
  if (s.length === 10) return `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}`
  return p
}
function Pill({ children, bg = '#f1f5f9', c = '#475569' }) {
  return <span style={{ display: 'inline-block', background: bg, color: c, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>{children}</span>
}

function RoleCell({ a }) {
  if (!a) return <span style={{ color: '#cbd5e1' }}>—</span>
  const st = TUA_STYLE[a.status] || TUA_STYLE.cho_xac_nhan
  return (
    <div style={{ lineHeight: 1.3, opacity: a.status === 'huy' ? 0.5 : 1 }}>
      <div style={{ fontWeight: 600, color: '#0f2044' }}>{a.user_name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' }}>
        <span style={{ background: st.bg, color: st.c, padding: '0 6px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{TUA_SHORT[a.status]}</span>
        {a.role === 'SALE'
          ? <span style={{ fontSize: 10, color: '#cbd5e1' }}>—</span>
          : <span style={{ fontSize: 10, fontWeight: a.counts_salary ? 700 : 400, color: a.counts_salary ? '#15803d' : '#94a3b8' }}>{fmt(a.amount)}đ</span>}
        {a.status === 'da_xac_nhan' && !a.counts_salary && <span style={{ fontSize: 9, color: '#b45309', background: '#fff7ed', padding: '0 5px', borderRadius: 99 }}>chờ check-out</span>}
        {a.counts_salary && a.role !== 'SALE' && <span style={{ fontSize: 9, color: '#15803d' }}>✓ tính lương</span>}
      </div>
    </div>
  )
}

function BangTua() {
  const [date, setDate]   = useState(todayStr())
  const [data, setData]   = useState({ results: [], cho_xac_nhan: 0, da_xac_nhan: 0, tu_choi: 0, huy: 0, tong_tua: 0, cho_checkout: 0, da_tinh_luong: 0, tong_tinh_luong: 0 })
  const [f, setF] = useState({ q: '', role: '', person: '', service: '', status: '', source: '', group: '', province: '', data_type: '', visit_type: '' })
  const [showPanel, setShowPanel] = useState(false)
  const [detail, setDetail] = useState(null)
  const isToday = date === todayStr()

  const load = () => getTuaAllocations({ date }).then(r => {
    const d = r.data || {}
    setData({ results: d.results || [], cho_xac_nhan: d.cho_xac_nhan || 0, da_xac_nhan: d.da_xac_nhan || 0, tu_choi: d.tu_choi || 0, huy: d.huy || 0, tong_tua: d.tong_tua || 0, cho_checkout: d.cho_checkout || 0, da_tinh_luong: d.da_tinh_luong || 0, tong_tinh_luong: d.tong_tinh_luong || 0 })
  }).catch(() => {})
  useEffect(() => { load() }, [date])

  // Gộp 1 dòng / buổi (appointment) — thông tin KH đồng bộ từ Lịch hẹn
  const allocs = data.results || []
  const groups = Object.values(allocs.reduce((m, a) => {
    const k = a.appointment
    if (!m[k]) m[k] = {
      appointment: k, date: a.date, customer: a.customer, phone: a.phone, source: a.source, source_display: a.source_display,
      customer_group: a.customer_group, province: a.province, data_type: a.data_type,
      visit_type: a.visit_type, visit_type_display: a.visit_type_display, service: a.service, roles: {}, tong: 0, allocs: [],
    }
    m[k].roles[a.role] = a; m[k].allocs.push(a)
    // Tổng = CHỈ tua đã xác nhận + ĐÃ check-out (đúng cái vào lương)
    if (a.counts_salary && a.role !== 'SALE') m[k].tong += Number(a.amount || 0)
    return m
  }, {}))
  const persons = [...new Set(allocs.map(a => a.user_name).filter(Boolean))].sort()
  const services = [...new Set(allocs.map(a => a.service).filter(Boolean))].sort()
  const qq = f.q.trim().toLowerCase()
  const shown = groups.filter(g =>
    (!f.status || g.allocs.some(a => a.status === f.status)) &&
    (!f.role || g.allocs.some(a => a.role === f.role)) &&
    (!f.person || g.allocs.some(a => a.user_name === f.person)) &&
    (!f.service || g.service === f.service) &&
    (!f.source || g.source === f.source) &&
    (!f.group || g.customer_group === f.group) &&
    (!f.province || g.province === f.province) &&
    (!f.data_type || g.data_type === f.data_type) &&
    (!f.visit_type || g.visit_type === f.visit_type) &&
    (!qq || (g.customer || '').toLowerCase().includes(qq) || (g.phone || '').toLowerCase().includes(qq) || (g.service || '').toLowerCase().includes(qq) || g.allocs.some(a => (a.user_name || '').toLowerCase().includes(qq)))
  )
  const pg = usePaging(shown.length, [date, JSON.stringify(f), shown.length])
  const paged = shown.slice(pg.slice[0], pg.slice[1])

  const setStatus = (s) => setF(x => ({ ...x, status: x.status === s ? '' : s }))
  const stats = statsGrid([
    { label: 'Chờ xác nhận', value: data.cho_xac_nhan, accent: '#854d0e', onClick: () => setStatus('cho_xac_nhan'), active: f.status === 'cho_xac_nhan' },
    { label: 'Đã xác nhận', value: data.da_xac_nhan, accent: '#15803d', onClick: () => setStatus('da_xac_nhan'), active: f.status === 'da_xac_nhan' },
    { label: 'Chờ check-out', value: data.cho_checkout, sub: 'đã duyệt, chưa tính lương', accent: '#b45309' },
    { label: 'Từ chối', value: data.tu_choi, accent: '#991b1b', onClick: () => setStatus('tu_choi'), active: f.status === 'tu_choi' },
    { label: 'Tổng tua tính lương', value: fmt(data.tong_tinh_luong) + 'đ', sub: 'đã xác nhận + đã check-out', accent: '#6d28d9' },
  ])
  const clearFilter = () => setF({ q: '', role: '', person: '', service: '', status: '', source: '', group: '', province: '', data_type: '', visit_type: '' })
  const hasAdv = f.person || f.service || f.source || f.group || f.province || f.data_type || f.visit_type
  const hasFilter = f.q || f.role || f.status || hasAdv
  const toolbar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setDate(d => shiftDate(d, -1))} style={navBtnStyle}>←</button>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }} />
        <button onClick={() => setDate(d => shiftDate(d, 1))} style={navBtnStyle}>→</button>
        <button onClick={() => setDate(todayStr())} disabled={isToday}
          style={{ ...navBtnStyle, opacity: isToday ? 0.4 : 1, cursor: isToday ? 'default' : 'pointer', fontWeight: 600, color: '#6d28d9', borderColor: isToday ? '#dde3ef' : '#6d28d9' }}>Hôm nay</button>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
          <IconRefresh size={13} /> Làm mới
        </button>
        {searchBar(f.q, v => setF(x => ({ ...x, q: v })), 'Tìm khách, SĐT, dịch vụ, người…')}
        <select value={f.role} onChange={e => setF(x => ({ ...x, role: e.target.value }))} style={selStyle}>
          <option value="">Tất cả vai trò</option>
          <option value="BS_TU_VAN">BS tư vấn</option><option value="BS_DIEU_TRI">BS điều trị</option><option value="KTV">KTV</option><option value="SALE">Sale</option>
        </select>
        <select value={f.status} onChange={e => setF(x => ({ ...x, status: e.target.value }))} style={selStyle}>
          <option value="">Tất cả trạng thái</option>
          <option value="cho_xac_nhan">Chờ xác nhận</option><option value="da_xac_nhan">Đã xác nhận</option><option value="tu_choi">Từ chối</option><option value="huy">Đã hủy</option>
        </select>
        <button onClick={() => setShowPanel(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            border: (showPanel || hasAdv) ? '1px solid #6d28d9' : '1px solid #dde3ef', background: (showPanel || hasAdv) ? '#ede9fe' : '#fff', color: (showPanel || hasAdv) ? '#6d28d9' : '#64748b' }}>
          <IconFilter size={13} stroke={2} /> Bộ lọc{hasAdv ? ' •' : ''}
        </button>
        {hasFilter && <button onClick={clearFilter} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}><IconX size={13} /> Xóa lọc</button>}
      </div>
      {showPanel && (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
            <select value={f.visit_type} onChange={e => setF(x => ({ ...x, visit_type: e.target.value }))} style={selStyle}>
              <option value="">Tất cả loại lượt</option>
              {Object.entries(VISIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={f.person} onChange={e => setF(x => ({ ...x, person: e.target.value }))} style={selStyle}>
              <option value="">Tất cả người nhận</option>
              {persons.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={f.service} onChange={e => setF(x => ({ ...x, service: e.target.value }))} style={selStyle}>
              <option value="">Tất cả dịch vụ</option>
              {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={f.source} onChange={e => setF(x => ({ ...x, source: e.target.value }))} style={selStyle}>
              <option value="">Tất cả nguồn</option>
              {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={f.group} onChange={e => setF(x => ({ ...x, group: e.target.value }))} style={selStyle}>
              <option value="">Tất cả nhóm KH</option>
              {CUSTOMER_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select value={f.province} onChange={e => setF(x => ({ ...x, province: e.target.value }))} style={selStyle}>
              <option value="">Tất cả tỉnh/thành</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={f.data_type} onChange={e => setF(x => ({ ...x, data_type: e.target.value }))} style={selStyle}>
              <option value="">Tất cả loại data</option>
              <option value="nong">🔥 Nóng</option><option value="am">🌤 Ấm</option><option value="thuong">❄ Thường</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <KetoanListShell stats={stats} toolbar={toolbar}
        pagination={{ page: pg.page, pageSize: pg.pageSize, count: shown.length, onPage: pg.setPage, onPageSize: pg.setPageSize }}>
        <table style={{ ...tbl, minWidth: 1640 }}>
          <thead><tr>
            <th style={th}>Khách hàng</th><th style={th}>Loại lượt</th><th style={th}>SĐT</th><th style={th}>Nguồn</th>
            <th style={th}>Nhóm KH</th><th style={th}>Tỉnh/thành</th><th style={th}>Loại data</th><th style={th}>Dịch vụ</th>
            <th style={th}>BS tư vấn</th><th style={th}>BS điều trị</th><th style={th}>KTV</th><th style={th}>Sale</th>
            <th style={thR}>Tính lương</th><th style={thAction}></th>
          </tr></thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: 40 }} colSpan={14}>Chưa có chia tua</td></tr>
            ) : paged.map(g => {
              const dt = DATA_TYPE_COLORS[g.data_type]
              const vt = VISIT_COLORS[g.visit_type]
              return (
                <tr key={g.appointment} onClick={() => setDetail(g)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={td}><b style={{ color: '#0f2044' }}>{g.customer || '—'}</b></td>
                  <td style={td}>{vt ? <Pill bg={vt.bg} c={vt.c}>{g.visit_type_display || VISIT_LABELS[g.visit_type]}</Pill> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={{ ...td, fontFamily: 'monospace', color: '#374151' }}>{fmtPhone(g.phone)}</td>
                  <td style={{ ...td, color: '#64748b' }}>{g.source_display || '—'}</td>
                  <td style={{ ...td, color: '#64748b' }}>{g.customer_group || '—'}</td>
                  <td style={{ ...td, color: '#64748b' }}>{g.province || '—'}</td>
                  <td style={td}>{dt ? <Pill bg={dt.bg} c={dt.c}>{DATA_TYPE_LABELS[g.data_type]}</Pill> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  <td style={td}>{g.service || '—'}</td>
                  <td style={td}><RoleCell a={g.roles.BS_TU_VAN} /></td>
                  <td style={td}><RoleCell a={g.roles.BS_DIEU_TRI} /></td>
                  <td style={td}><RoleCell a={g.roles.KTV} /></td>
                  <td style={td}><RoleCell a={g.roles.SALE} /></td>
                  <td style={{ ...tdR, fontWeight: 700, color: '#6d28d9' }}>{fmt(g.tong)}đ</td>
                  <td style={tdAction}><button onClick={e => { e.stopPropagation(); setDetail(g) }} style={{ padding: '3px 10px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Chi tiết</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </KetoanListShell>
      {detail && <TuaDetailModal group={detail} onClose={() => setDetail(null)} onChanged={() => { load() }} setGroup={setDetail} allocs={allocs} />}
    </>
  )
}

/* Modal chi tiết chia tua 1 buổi — xác nhận/từ chối từng người */
function TuaDetailModal({ group, onClose, onChanged, allocs }) {
  const [rejectId, setRejectId] = useState(null)
  const [reason, setReason] = useState('')
  // Lấy lại allocs mới nhất của buổi này
  const list = allocs.filter(a => a.appointment === group.appointment)
  const doConfirm = (a) => confirmTuaAlloc(a.id, { action: 'confirm' })
    .then(() => { toast.success('Đã xác nhận'); onChanged() }).catch(e => toast.error(e.response?.data?.detail || 'Lỗi'))
  const doReject = (a) => {
    if (!reason.trim()) { toast.error('Nhập lý do'); return }
    confirmTuaAlloc(a.id, { action: 'reject', reason: reason.trim() })
      .then(() => { toast.success('Đã từ chối'); setRejectId(null); setReason(''); onChanged() }).catch(e => toast.error(e.response?.data?.detail || 'Lỗi'))
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,.35)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 560, maxWidth: '92vw', maxHeight: '86vh', overflow: 'auto', boxShadow: '0 12px 40px rgba(0,0,0,.2)' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #eef1f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>Chia tua — {group.customer}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{group.service} · {group.date}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '8px 18px 18px' }}>
          {list.map(a => {
            const st = TUA_STYLE[a.status] || TUA_STYLE.cho_xac_nhan
            const rb = ROLE_BG[a.role] || { bg: '#f1f5f9', c: '#64748b' }
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ background: rb.bg, color: rb.c, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, minWidth: 78, textAlign: 'center' }}>{a.role_display}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2044' }}>{a.user_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{a.role === 'SALE' ? 'Không tính tiền tua' : fmt(a.amount) + 'đ'}{a.status === 'tu_choi' && a.reject_reason ? ` · Lý do: ${a.reject_reason}` : ''}</div>
                </div>
                <span style={{ background: st.bg, color: st.c, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{st.l}</span>
                <div style={{ minWidth: 150, textAlign: 'right' }}>
                  {rejectId === a.id ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <input autoFocus value={reason} onChange={e => setReason(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') doReject(a); if (e.key === 'Escape') { setRejectId(null); setReason('') } }}
                        placeholder="Lý do…" style={{ width: 90, padding: '3px 6px', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 11, outline: 'none', fontFamily: 'inherit' }} />
                      <button onClick={() => doReject(a)} style={{ ...btnSave, borderColor: '#dc2626', color: '#dc2626' }}>Gửi</button>
                      <button onClick={() => { setRejectId(null); setReason('') }} style={{ ...btnSave, borderColor: '#cbd5e1', color: '#64748b' }}>×</button>
                    </span>
                  ) : a.status !== 'huy' && (
                    <>
                      {['cho_xac_nhan', 'tu_choi'].includes(a.status) && <button onClick={() => doConfirm(a)} style={{ ...btnSave, marginRight: 4 }}><IconCheck size={11} /> Xác nhận</button>}
                      {a.status === 'cho_xac_nhan' && <button onClick={() => { setRejectId(a.id); setReason('') }} style={{ ...btnSave, borderColor: '#dc2626', color: '#dc2626' }}><IconX size={11} /></button>}
                    </>
                  )}
                </div>
              </div>
            )
          })}
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 10 }}>Chỉ phần <b>Đã xác nhận</b> + buổi đã check-out mới tính vào lương. Thông thường mỗi người tự xác nhận trên điện thoại; KT/QL có thể xác nhận hộ tại đây.</div>
        </div>
      </div>
    </div>
  )
}

/* ─── 3. % Hoa hồng theo vai trò ───────────────────────────────────────── */
function HoaHong() {
  const [rows, setRows] = useState([])
  const [edit, setEdit] = useState({})
  useEffect(() => { getCommissionRates().then(r => setRows(r.data || [])).catch(() => {}) }, [])
  const setV = (role, f, v) => setEdit(e => ({ ...e, [role]: { ...e[role], [f]: v } }))
  const save = (row) => {
    const e = edit[row.role] || {}
    updateCommissionRate(row.role, { percent: e.percent ?? row.percent, percent_upsale: e.percent_upsale ?? row.percent_upsale, note: e.note ?? row.note })
      .then(r => { toast.success(`Đã lưu ${row.role_display}`); setRows(rs => rs.map(x => x.role === row.role ? r.data : x)); setEdit(ed => { const n = { ...ed }; delete n[row.role]; return n }) })
      .catch(err => toast.error(err.response?.data?.detail || 'Lỗi lưu'))
  }
  const pg = usePaging(rows.length, [rows.length])
  const paged = rows.slice(pg.slice[0], pg.slice[1])
  const toolbar = <div style={{ fontSize: 11, color: '#64748b' }}><b>P3 – Hiệu suất.</b> Hoa hồng = <b>thực thu trong tháng</b> × % vai trò. HĐ upsale dùng cột <b>% upsale</b>. Tele chỉ HĐ đầu; Sale/CSKH/BS/KTV theo <b>người bán</b>; Tele/MKT/Trực page theo gán doanh thu.</div>

  return (
    <KetoanListShell toolbar={toolbar}
      pagination={{ page: pg.page, pageSize: pg.pageSize, count: rows.length, onPage: pg.setPage, onPageSize: pg.setPageSize }}>
      <table style={{ ...tbl, minWidth: 720 }}>
        <thead><tr>
          <th style={th}>Vai trò</th><th style={thR}>% thường (vòng 1)</th><th style={thR}>% upsale (bán thêm)</th><th style={th}>Ghi chú</th><th style={th}></th>
        </tr></thead>
        <tbody>
          {paged.map(r => {
            const e = edit[r.role] || {}; const dirty = r.role in edit
            return (
              <tr key={r.role} style={{ background: dirty ? '#fefce8' : '#fff' }}>
                <td style={td}><b style={{ color: '#0f2044' }}>{r.role_display}</b> <span style={{ color: '#94a3b8', fontSize: 10 }}>{r.role}</span></td>
                <td style={tdR}><input style={{ ...inp, width: 72 }} type="number" step="0.1" value={e.percent ?? r.percent} onChange={ev => setV(r.role, 'percent', ev.target.value)} /> %</td>
                <td style={tdR}><input style={{ ...inp, width: 72 }} type="number" step="0.1" value={e.percent_upsale ?? r.percent_upsale} onChange={ev => setV(r.role, 'percent_upsale', ev.target.value)} /> %</td>
                <td style={td}><input style={{ ...txtInp, width: 200 }} value={e.note ?? r.note ?? ''} onChange={ev => setV(r.role, 'note', ev.target.value)} placeholder="…" /></td>
                <td style={td}>{dirty && <button style={btnSave} onClick={() => save(r)}><IconDeviceFloppy size={12} /> Lưu</button>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </KetoanListShell>
  )
}

/* ─── 4. Đơn giá tua theo dịch vụ ──────────────────────────────────────── */
function DonGiaTua() {
  const [rows, setRows] = useState([])
  const [edit, setEdit] = useState({})
  const [q, setQ] = useState('')
  useEffect(() => { getServiceTua().then(r => setRows(r.data || [])).catch(() => {}) }, [])
  const save = (row) => {
    const v = edit[row.id] ?? row.tua_rate
    updateServiceTua(row.id, { tua_rate: v })
      .then(() => { toast.success(`Đã lưu tua ${row.name}`); setRows(rs => rs.map(x => x.id === row.id ? { ...x, tua_rate: Number(v) } : x)); setEdit(ed => { const n = { ...ed }; delete n[row.id]; return n }) })
      .catch(err => toast.error(err.response?.data?.detail || 'Lỗi lưu'))
  }
  const shown = rows.filter(r => !q || r.name.toLowerCase().includes(q.toLowerCase()) || (r.category || '').toLowerCase().includes(q.toLowerCase()))
  const pg = usePaging(shown.length, [q, shown.length])
  const paged = shown.slice(pg.slice[0], pg.slice[1])

  return (
    <KetoanListShell toolbar={searchBar(q, setQ, 'Tìm dịch vụ…')}
      pagination={{ page: pg.page, pageSize: pg.pageSize, count: shown.length, onPage: pg.setPage, onPageSize: pg.setPageSize }}>
      <table style={{ ...tbl, minWidth: 720 }}>
        <thead><tr>
          <th style={th}>Dịch vụ</th><th style={th}>Danh mục</th><th style={thR}>Đơn giá DV</th><th style={thR}>Tua / buổi</th><th style={th}></th>
        </tr></thead>
        <tbody>
          {paged.length === 0 ? (
            <tr><td style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: 40 }} colSpan={5}>Không có dịch vụ</td></tr>
          ) : paged.map(r => {
            const dirty = r.id in edit
            return (
              <tr key={r.id} style={{ background: dirty ? '#fefce8' : '#fff' }}>
                <td style={td}><b style={{ color: '#0f2044' }}>{r.name}</b></td>
                <td style={td}>{r.category}</td>
                <td style={tdR}>{fmt(r.unit_price)}đ</td>
                <td style={tdR}><input style={inp} type="number" step="1000" value={edit[r.id] ?? r.tua_rate} onChange={e => setEdit(ed => ({ ...ed, [r.id]: e.target.value }))} /> đ</td>
                <td style={td}>{dirty && <button style={btnSave} onClick={() => save(r)}><IconDeviceFloppy size={12} /> Lưu</button>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </KetoanListShell>
  )
}

/* ─── 5. Lương cứng P1·P2 từng người ───────────────────────────────────── */
function LuongCung() {
  const [users, setUsers] = useState([])
  const [cfg, setCfg]     = useState({})
  const [edit, setEdit]   = useState({})
  const [q, setQ]         = useState('')

  useEffect(() => {
    Promise.all([getAllUsers(), getSalaryConfigs()]).then(([ru, rc]) => {
      const us = ru.data?.results ?? ru.data ?? []
      setUsers(Array.isArray(us) ? us : [])
      const cs = rc.data?.results ?? rc.data ?? []
      const map = {}; (Array.isArray(cs) ? cs : []).forEach(c => { map[c.user] = c })
      setCfg(map)
    }).catch(() => {})
  }, [])

  const val = (uid, f) => (edit[uid] && f in edit[uid]) ? edit[uid][f] : (cfg[uid]?.[f] ?? 0)
  const setV = (uid, f, v) => setEdit(e => ({ ...e, [uid]: { ...e[uid], [f]: v } }))
  const save = (u) => {
    const uid = u.id, c = cfg[uid] || {}, e = edit[uid] || {}
    updateSalaryConfig(uid, {
      base_salary: e.base_salary ?? c.base_salary ?? 0,
      competency_salary: e.competency_salary ?? c.competency_salary ?? 0,
      allowance: e.allowance ?? c.allowance ?? 0,
      late_deduct_per_minute: e.late_deduct_per_minute ?? c.late_deduct_per_minute ?? 0,
      absent_deduct_per_day: e.absent_deduct_per_day ?? c.absent_deduct_per_day ?? 0,
      bh_salary: e.bh_salary ?? c.bh_salary ?? 0,
      dependents: e.dependents ?? c.dependents ?? 0,
    })
      .then(r => { toast.success(`Đã lưu lương ${u.name}`); setCfg(m => ({ ...m, [uid]: r.data })); setEdit(ed => { const n = { ...ed }; delete n[uid]; return n }) })
      .catch(err => toast.error(err.response?.data?.detail || 'Lỗi lưu'))
  }
  const shown = users.filter(u => !q || (u.name || '').toLowerCase().includes(q.toLowerCase()) || (u.role || '').toLowerCase().includes(q.toLowerCase()))
  const pg = usePaging(shown.length, [q, shown.length])
  const paged = shown.slice(pg.slice[0], pg.slice[1])

  return (
    <KetoanListShell toolbar={searchBar(q, setQ, 'Tìm nhân sự…')}
      pagination={{ page: pg.page, pageSize: pg.pageSize, count: shown.length, onPage: pg.setPage, onPageSize: pg.setPageSize }}>
      <table style={{ ...tbl, minWidth: 1180 }}>
        <thead><tr>
          <th style={th}>Nhân sự</th><th style={th}>Vai trò</th>
          <th style={thR}>P1 · Vị trí</th><th style={thR}>P2 · Năng lực</th><th style={thR}>Phụ cấp</th>
          <th style={thR}>Trừ muộn/phút</th><th style={thR}>Trừ vắng/ngày</th>
          <th style={thR} title="Để 0 = tính BH theo P1">Lương đóng BH</th><th style={thR}>Số NPT</th><th style={th}></th>
        </tr></thead>
        <tbody>
          {paged.length === 0 ? (
            <tr><td style={{ ...td, textAlign: 'center', color: '#9ca3af', padding: 40 }} colSpan={10}>Không có nhân sự</td></tr>
          ) : paged.map(u => {
            const dirty = u.id in edit
            return (
              <tr key={u.id} style={{ background: dirty ? '#fefce8' : '#fff' }}>
                <td style={td}><b style={{ color: '#0f2044' }}>{u.name}</b></td>
                <td style={td}><span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>{u.role}</span></td>
                <td style={tdR}><input style={inp} type="number" step="100000" value={val(u.id, 'base_salary')} onChange={e => setV(u.id, 'base_salary', e.target.value)} /></td>
                <td style={tdR}><input style={inp} type="number" step="100000" value={val(u.id, 'competency_salary')} onChange={e => setV(u.id, 'competency_salary', e.target.value)} /></td>
                <td style={tdR}><input style={inp} type="number" step="50000" value={val(u.id, 'allowance')} onChange={e => setV(u.id, 'allowance', e.target.value)} /></td>
                <td style={tdR}><input style={inp} type="number" step="500" value={val(u.id, 'late_deduct_per_minute')} onChange={e => setV(u.id, 'late_deduct_per_minute', e.target.value)} /></td>
                <td style={tdR}><input style={inp} type="number" step="50000" value={val(u.id, 'absent_deduct_per_day')} onChange={e => setV(u.id, 'absent_deduct_per_day', e.target.value)} /></td>
                <td style={tdR}><input style={inp} type="number" step="100000" placeholder="theo P1" value={val(u.id, 'bh_salary')} onChange={e => setV(u.id, 'bh_salary', e.target.value)} /></td>
                <td style={tdR}><input style={{ ...inp, width: 56 }} type="number" step="1" min="0" value={val(u.id, 'dependents')} onChange={e => setV(u.id, 'dependents', e.target.value)} /></td>
                <td style={td}>{dirty && <button style={btnSave} onClick={() => save(u)}><IconDeviceFloppy size={12} /> Lưu</button>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </KetoanListShell>
  )
}
