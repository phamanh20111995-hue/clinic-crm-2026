import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Spinner from '../ui/Spinner'
import Badge from '../ui/Badge'
import { getCustomers } from '../../api/customers'
import { getServices, getAllUsers } from '../../api/letan'
import { fmtPhone, fmtDate } from '../../utils/format'
import { IconSearch, IconFilter, IconX } from '@tabler/icons-react'
import useAuthStore from '../../store/authStore'

const STATUS_COLORS = {
  moi: 'blue', dang_tu_van: 'yellow', da_tu_van: 'yellow',
  dat_lich: 'green', da_den: 'green', dang_dieu_tri: 'purple',
  hoan_thanh: 'green', hoan_so: 'orange', sai_so: 'red',
  khong_lien_lac: 'gray', tu_choi: 'red',
}
const STATUS_LABELS = {
  moi: 'Mới', dang_tu_van: 'Đang tư vấn', da_tu_van: 'Đã tư vấn',
  dat_lich: 'Đặt lịch', da_den: 'Đã đến', dang_dieu_tri: 'Điều trị',
  hoan_thanh: 'Hoàn thành', hoan_so: 'Hoàn số', sai_so: 'Sai số',
  khong_lien_lac: 'Không liên lạc', tu_choi: 'Từ chối',
}
const DATA_TYPE_LABELS = { nong: '🔥 Nóng', am: '🌤 Âm', thuong: '❄ Thường' }
const DATA_TYPE_COLORS = { nong: 'red', am: 'yellow', thuong: 'gray' }
const GENDER_LABELS = { M: 'Nam', F: 'Nữ' }

const SOURCES = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'google', label: 'Google/Maps' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'gioi_thieu', label: 'Giới thiệu' },
  { value: 'walkin', label: 'Walk-in' },
  { value: 'khac', label: 'Khác' },
]
const CUSTOMER_GROUPS = ['Khách mới','Khách thường','Khách thân thiết','VIP','VVIP','Khách giới thiệu','Khách nội bộ']
const PROVINCES = ['Hà Nội','TP. Hồ Chí Minh','Hải Phòng','Đà Nẵng','Cần Thơ','Huế','Tuyên Quang','Lào Cai','Thái Nguyên','Phú Thọ','Bắc Ninh','Hưng Yên','Ninh Bình','Quảng Trị','Quảng Ngãi','Gia Lai','Khánh Hòa','Lâm Đồng','Đắk Lắk','Đồng Nai','Tây Ninh','Vĩnh Long','Đồng Tháp','Cà Mau','An Giang','Cao Bằng','Điện Biên','Hà Tĩnh','Lai Châu','Lạng Sơn','Nghệ An','Quảng Ninh','Thanh Hóa','Sơn La']
const UNASSIGNED_ROLE_OPTIONS = [
  { value: 'tele', label: 'Chưa có Tele' },
  { value: 'sale', label: 'Chưa có Sale' },
  { value: 'cskh', label: 'Chưa có CSKH' },
  { value: 'ads', label: 'Chưa có Ads' },
]

const HD_STATUS_CFG = {
  draft:      { bg: '#f1f5f9', color: '#64748b', label: 'Nháp' },
  pending_kt: { bg: '#fff7ed', color: '#d97706', label: 'Chờ duyệt' },
  approved:   { bg: '#f0fdf4', color: '#15803d', label: 'Đã duyệt' },
  rejected:   { bg: '#fef2f2', color: '#dc2626', label: 'Từ chối' },
}

const ALL_COLUMNS = [
  { key: 'full_name', label: 'Tên khách hàng' },
  { key: 'phone', label: 'SĐT' },
  { key: 'source', label: 'Nguồn' },
  { key: 'customer_group', label: 'Nhóm KH' },
  { key: 'province', label: 'Tỉnh/thành' },
  { key: 'gender', label: 'Giới tính' },
  { key: 'services_interest_names', label: 'Dịch vụ quan tâm', roles: ['TELE', 'LEAD_TELE', 'SALE', 'LEAD_SALE', 'CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'data_type', label: 'Loại data', roles: ['TELE', 'LEAD_TELE', 'SALE', 'LEAD_SALE', 'CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'status', label: 'Trạng thái' },
  { key: 'created_at', label: 'Ngày tạo' },
  { key: 'appointment_date', label: 'Ngày hẹn', roles: ['TELE', 'LEAD_TELE', 'SALE', 'LEAD_SALE', 'CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'tele_name', label: 'Tele phụ trách', roles: ['TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'sale_name', label: 'Sale phụ trách', roles: ['SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'cskh_name', label: 'CSKH phụ trách', roles: ['CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'ads_name', label: 'Ads phụ trách', roles: ['MKT', 'LEAD_MKT', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'last_bs_name', label: 'BS gần nhất', roles: ['BS', 'KTV', 'LE_TAN', 'CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'last_ktv_name', label: 'KTV gần nhất', roles: ['BS', 'KTV', 'LE_TAN', 'CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN', 'TRUC_PAGE'] },
  { key: 'hd_status',   label: 'Tình trạng HĐ',      roles: ['SALE', 'LEAD_SALE', 'CSKH', 'LEAD_CSKH', 'KE_TOAN', 'TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN'] },
  { key: 'round1_value', label: 'Giá trị HĐ vòng 1', roles: ['TELE', 'QUAN_LY', 'CHU_DN'] },
  { key: 'round1_paid',  label: 'Đã thu V1',          roles: ['TELE', 'QUAN_LY', 'CHU_DN'] },
  { key: 'round1_debt',  label: 'Còn nợ V1',          roles: ['TELE', 'QUAN_LY', 'CHU_DN'] },
  { key: 'total_value',  label: 'Tổng giá trị HĐ',    roles: ['CSKH', 'LEAD_CSKH', 'SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'total_paid',   label: 'Tổng đã thu',        roles: ['CSKH', 'LEAD_CSKH', 'SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'total_debt',   label: 'Tổng còn nợ',        roles: ['CSKH', 'LEAD_CSKH', 'SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'upsale_value', label: 'Doanh thu upsale',   roles: ['CSKH', 'LEAD_CSKH', 'SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'created_by_name', label: 'Người tạo', roles: ['QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
]

function fmtLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi') + ' ₫'
}

function getDateRange(preset) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (preset) {
    case 'today':
      return { created_after: fmtLocalDate(today), created_before: fmtLocalDate(today) }
    case 'yesterday': {
      const d = new Date(today); d.setDate(d.getDate() - 1)
      return { created_after: fmtLocalDate(d), created_before: fmtLocalDate(d) }
    }
    case 'this_week': {
      const dow = today.getDay() || 7
      const mon = new Date(today); mon.setDate(mon.getDate() - (dow - 1))
      return { created_after: fmtLocalDate(mon), created_before: fmtLocalDate(today) }
    }
    case 'this_month': {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      return { created_after: fmtLocalDate(first), created_before: fmtLocalDate(today) }
    }
    case 'this_quarter': {
      const q = Math.floor(today.getMonth() / 3)
      const first = new Date(today.getFullYear(), q * 3, 1)
      return { created_after: fmtLocalDate(first), created_before: fmtLocalDate(today) }
    }
    case 'this_year': {
      const first = new Date(today.getFullYear(), 0, 1)
      return { created_after: fmtLocalDate(first), created_before: fmtLocalDate(today) }
    }
    default:
      return {}
  }
}

const TIME_PRESETS = [
  { value: '', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'this_week', label: 'Tuần này' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'this_quarter', label: 'Quý này' },
  { value: 'this_year', label: 'Năm nay' },
  { value: 'custom', label: 'Tùy chọn' },
]

const selectStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff' }

export default function CustomerTable({ baseParams = {}, columnKeys, onCountChange, onAdd, addLabel = 'Thêm', reloadKey, hideMoneyColumns = false, fromContext }) {
  const navigate = useNavigate()
  const role = useAuthStore(s => s.user)?.role || ''
  const [customers, setCustomers] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [timePreset, setTimePreset] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('')
  const [groupFilter, setGroupFilter] = useState('')
  const [provinceFilter, setProvinceFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [unassignedRole, setUnassignedRole] = useState('')
  const [services, setServices] = useState([])
  const [allUsers, setAllUsers] = useState([])

  useEffect(() => {
    getServices().then(res => setServices(res.data?.results ?? res.data ?? [])).catch(() => {})
    getAllUsers().then(res => setAllUsers(res.data?.results ?? res.data ?? [])).catch(() => {})
  }, [])

  const MONEY_KEYS = ['round1_value', 'round1_paid', 'round1_debt', 'total_value', 'total_paid', 'total_debt', 'upsale_value']
  const visibleCols = ALL_COLUMNS
    .filter(c => !columnKeys || columnKeys.includes(c.key))
    .filter(c => !c.roles || c.roles.includes(role))
    .filter(c => !hideMoneyColumns || !MONEY_KEYS.includes(c.key))
    .filter(c => !(fromContext === 'truc' && c.key === 'hd_status'))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize, ...baseParams }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (timePreset === 'custom') {
        if (customFrom) params.created_after = customFrom
        if (customTo) params.created_before = customTo
      } else if (timePreset) {
        const range = getDateRange(timePreset)
        if (range.created_after) params.created_after = range.created_after
        if (range.created_before) params.created_before = range.created_before
      }
      if (sourceFilter) params.source = sourceFilter
      if (groupFilter) params.customer_group = groupFilter
      if (provinceFilter) params.province = provinceFilter
      if (genderFilter) params.gender = genderFilter
      if (serviceFilter) params.services_interest = serviceFilter
      if (assignedTo) params.assigned_to = assignedTo
      if (unassignedRole) params.unassigned_role = unassignedRole
      const { data } = await getCustomers(params)
      setCustomers(data.results ?? data)
      const c = data.count ?? data.length
      setCount(c)
      if (onCountChange) onCountChange(c)
    } catch {
      setCustomers([])
      setCount(0)
      if (onCountChange) onCountChange(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter, timePreset, customFrom, customTo, sourceFilter, groupFilter, provinceFilter, genderFilter, serviceFilter, assignedTo, unassignedRole, reloadKey])

  useEffect(() => { load() }, [load])

  const renderCell = (c, col) => {
    switch (col.key) {
      case 'full_name':
        return <span style={{ fontWeight: 600, color: '#0f2044' }}>{c.full_name}</span>
      case 'phone':
        return <span style={{ fontFamily: 'monospace', color: '#374151' }}>{fmtPhone(c.phone)}</span>
      case 'source':
        return <span style={{ color: '#64748b' }}>{c.source_display ?? c.source ?? '—'}</span>
      case 'customer_group':
        return <span style={{ color: '#64748b' }}>{c.customer_group || '—'}</span>
      case 'province':
        return <span style={{ color: '#64748b' }}>{c.province || '—'}</span>
      case 'gender':
        return <span style={{ color: '#64748b' }}>{GENDER_LABELS[c.gender] ?? '—'}</span>
      case 'data_type':
        return <Badge variant={DATA_TYPE_COLORS[c.data_type] ?? 'gray'}>{DATA_TYPE_LABELS[c.data_type] ?? c.data_type ?? '—'}</Badge>
      case 'status':
        return <Badge variant={STATUS_COLORS[c.status] ?? 'gray'}>{STATUS_LABELS[c.status] ?? c.status ?? '—'}</Badge>
      case 'created_at':
        return <span style={{ color: '#94a3b8', fontSize: 10 }}>{fmtDate(c.created_at)}</span>
      case 'appointment_date':
        return <span style={{ color: '#64748b', fontSize: 11 }}>{c.appointment_date ? fmtDate(c.appointment_date) : '—'}</span>
      case 'tele_name':
        return <span style={{ color: '#64748b' }}>{c.tele_name ?? '—'}</span>
      case 'sale_name':
        return <span style={{ color: '#64748b' }}>{c.sale_name ?? '—'}</span>
      case 'cskh_name':
        return <span style={{ color: '#64748b' }}>{c.cskh_name ?? '—'}</span>
      case 'ads_name':
        return <span style={{ color: '#64748b' }}>{c.ads_name ?? '—'}</span>
      case 'last_bs_name':
        return <span style={{ color: '#64748b' }}>{c.last_bs_name ?? '—'}</span>
      case 'last_ktv_name':
        return <span style={{ color: '#64748b' }}>{c.last_ktv_name ?? '—'}</span>
      case 'services_interest_names':
        return <span style={{ color: '#64748b' }}>{(c.services_interest_names && c.services_interest_names.length) ? c.services_interest_names.join(', ') : '—'}</span>
      case 'round1_value':
        return <span style={{ color: '#64748b' }}>{fmtMoney(c.round1_value)}</span>
      case 'round1_paid':
        return <span style={{ color: '#64748b' }}>{fmtMoney(c.round1_paid)}</span>
      case 'round1_debt':
        return <span style={{ color: c.round1_debt > 0 ? '#dc2626' : '#64748b' }}>{fmtMoney(c.round1_debt)}</span>
      case 'hd_status': {
        const hs = c.hd_status
        if (!hs || hs.latest === null) return <span style={{ color: '#94a3b8' }}>—</span>
        const cfg = HD_STATUS_CFG[hs.latest] ?? { bg: '#f1f5f9', color: '#64748b', label: hs.latest }
        const suffix = hs.pending_count > 0 ? ` ·${hs.pending_count}` : ''
        return (
          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
            {cfg.label}{suffix}
          </span>
        )
      }
      case 'total_value':
        return <span style={{ color: '#64748b' }}>{fmtMoney(c.total_value)}</span>
      case 'total_paid':
        return <span style={{ color: '#15803d' }}>{fmtMoney(c.total_paid)}</span>
      case 'total_debt':
        return <span style={{ color: c.total_debt > 0 ? '#dc2626' : '#64748b' }}>{fmtMoney(c.total_debt)}</span>
      case 'upsale_value':
        return <span style={{ color: '#6d28d9' }}>{fmtMoney(c.upsale_value)}</span>
      case 'created_by_name':
        return <span style={{ color: '#64748b' }}>{c.created_by_name ?? '—'}</span>
      default:
        return '—'
    }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0 }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 220 }}>
            <IconSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              placeholder="Tìm tên, SĐT..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              onKeyDown={e => e.key === 'Enter' && load()}
              style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            style={selectStyle}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={timePreset}
            onChange={e => { setTimePreset(e.target.value); setPage(1) }}
            style={selectStyle}
          >
            {TIME_PRESETS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {timePreset === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={e => { setCustomFrom(e.target.value); setPage(1) }}
                style={{ ...selectStyle, width: 130 }}
              />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>→</span>
              <input
                type="date"
                value={customTo}
                onChange={e => { setCustomTo(e.target.value); setPage(1) }}
                style={{ ...selectStyle, width: 130 }}
              />
            </>
          )}
          <button
            onClick={() => setShowFilterPanel(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: showFilterPanel ? '1px solid #6d28d9' : '1px solid #dde3ef',
              background: showFilterPanel ? '#ede9fe' : '#fff',
              color: showFilterPanel ? '#6d28d9' : '#64748b',
            }}
          >
            <IconFilter size={13} stroke={2} />
            Bộ lọc
          </button>
          {onAdd && (
            <button
              onClick={onAdd}
              style={{
                padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                border: '1px solid #dde3ef', background: '#fff', color: '#64748b',
              }}
            >
              {addLabel}
            </button>
          )}
        </div>

        {/* Advanced filter panel */}
        {showFilterPanel && (
          <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: 16, marginTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <select value={sourceFilter} onChange={e => { setSourceFilter(e.target.value); setPage(1) }} style={selectStyle}>
                <option value="">Tất cả nguồn</option>
                {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={groupFilter} onChange={e => { setGroupFilter(e.target.value); setPage(1) }} style={selectStyle}>
                <option value="">Tất cả nhóm</option>
                {CUSTOMER_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={provinceFilter} onChange={e => { setProvinceFilter(e.target.value); setPage(1) }} style={selectStyle}>
                <option value="">Tất cả tỉnh</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1) }} style={selectStyle}>
                <option value="">Tất cả giới tính</option>
                <option value="M">Nam</option>
                <option value="F">Nữ</option>
              </select>
              <select value={serviceFilter} onChange={e => { setServiceFilter(e.target.value); setPage(1) }} style={selectStyle}>
                <option value="">Tất cả dịch vụ</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select value={assignedTo} onChange={e => { setAssignedTo(e.target.value); setPage(1) }} style={selectStyle}>
                <option value="">Tất cả người phụ trách</option>
                {allUsers.map(u => <option key={u.id} value={u.id}>{u.display_name ?? u.full_name ?? u.email}</option>)}
              </select>
              <select value={unassignedRole} onChange={e => { setUnassignedRole(e.target.value); setPage(1) }} style={selectStyle}>
                <option value="">Chưa phân công (—)</option>
                {UNASSIGNED_ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={{ marginTop: 10, textAlign: 'right' }}>
              <button
                onClick={() => { setSourceFilter(''); setGroupFilter(''); setProvinceFilter(''); setGenderFilter(''); setServiceFilter(''); setAssignedTo(''); setUnassignedRole(''); setPage(1) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit' }}
              >
                <IconX size={12} stroke={2} />
                Xóa lọc
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size="lg" /></div>
          ) : (
            <div style={{ overflowX: 'auto', overflowY: 'scroll', flex: 1, minHeight: 0 }}>
              <table style={{ width: '100%', minWidth: 1700, borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>
                    {visibleCols.map(col => (
                      <th key={col.key} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', background: '#f8fafc' }}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={visibleCols.length} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
                        Không có khách hàng
                      </td>
                    </tr>
                  ) : customers.map(c => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/customers/${c.id}` + (fromContext ? `?from=${fromContext}` : ''))}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      {visibleCols.map(col => (
                        <td key={col.key} style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{renderCell(c, col)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {(() => {
        const totalPages = Math.max(1, Math.ceil(count / pageSize))
        return (
          <div style={{
            position: 'fixed', bottom: 0, left: 'var(--sidebar-w)', right: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 24px', background: '#fff',
            borderTop: '1px solid #dde3ef',
          }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Trang {page} / {totalPages} ({count} kết quả)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                style={selectStyle}
              >
                {[20, 50, 100, 200, 500, 1000].map(opt => (
                  <option key={opt} value={opt}>Hiển thị {opt}/trang</option>
                ))}
              </select>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: page <= 1 ? 'default' : 'pointer', opacity: page <= 1 ? 0.4 : 1, fontFamily: 'inherit' }}
              >← Trước</button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: page >= totalPages ? 'default' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, fontFamily: 'inherit' }}
              >Tiếp →</button>
            </div>
          </div>
        )
      })()}
    </>
  )
}
