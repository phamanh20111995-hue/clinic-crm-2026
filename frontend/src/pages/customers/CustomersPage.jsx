import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import CustomerFormModal from './CustomerFormModal'
import { getCustomers } from '../../api/customers'
import { fmtPhone, fmtDate } from '../../utils/format'
import { IconUserPlus, IconSearch } from '@tabler/icons-react'
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

const ALL_COLUMNS = [
  { key: 'full_name', label: 'Tên khách hàng' },
  { key: 'phone', label: 'SĐT' },
  { key: 'source', label: 'Nguồn' },
  { key: 'customer_group', label: 'Nhóm KH' },
  { key: 'province', label: 'Tỉnh/thành' },
  { key: 'gender', label: 'Giới tính' },
  { key: 'data_type', label: 'Loại data', roles: ['TELE', 'LEAD_TELE', 'SALE', 'LEAD_SALE', 'CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'status', label: 'Trạng thái' },
  { key: 'created_at', label: 'Ngày tạo' },
  { key: 'appointment_date', label: 'Ngày hẹn', roles: ['TELE', 'LEAD_TELE', 'SALE', 'LEAD_SALE', 'CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'tele_name', label: 'Tele phụ trách', roles: ['TELE', 'LEAD_TELE', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'sale_name', label: 'Sale phụ trách', roles: ['SALE', 'LEAD_SALE', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'cskh_name', label: 'CSKH phụ trách', roles: ['CSKH', 'LEAD_CSKH', 'QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
  { key: 'created_by_name', label: 'Người tạo', roles: ['QUAN_LY', 'CHU_DN', 'KE_TOAN'] },
]

function fmtLocalDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

const ACTIONS = (onAdd) => (
  <button
    onClick={onAdd}
    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 7, border: 'none', background: '#6d28d9', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
  >
    <IconUserPlus size={14} stroke={2.5} /> Thêm KH
  </button>
)

const selectStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff' }

export default function CustomersPage() {
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
  const [unassigned, setUnassigned] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const visibleCols = ALL_COLUMNS.filter(c => !c.roles || c.roles.includes(role))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: pageSize, is_customer: true }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (unassigned) params.unassigned = true
      if (timePreset === 'custom') {
        if (customFrom) params.created_after = customFrom
        if (customTo) params.created_before = customTo
      } else if (timePreset) {
        const range = getDateRange(timePreset)
        if (range.created_after) params.created_after = range.created_after
        if (range.created_before) params.created_before = range.created_before
      }
      const { data } = await getCustomers(params)
      setCustomers(data.results ?? data)
      setCount(data.count ?? data.length)
    } catch {
      setCustomers([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, statusFilter, timePreset, customFrom, customTo, unassigned])

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
      case 'created_by_name':
        return <span style={{ color: '#64748b' }}>{c.created_by_name ?? '—'}</span>
      default:
        return '—'
    }
  }

  return (
    <AppLayout
      title="Khách hàng"
      meta={`${count} khách`}
      actions={ACTIONS(() => setShowForm(true))}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
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
            onClick={() => { setUnassigned(v => !v); setPage(1) }}
            style={{
              padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: unassigned ? '1px solid #6d28d9' : '1px solid #dde3ef',
              background: unassigned ? '#ede9fe' : '#fff',
              color: unassigned ? '#6d28d9' : '#64748b',
            }}
          >
            Chưa phân công
          </button>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size="lg" /></div>
          ) : (
            <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}>
              <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse', fontSize: 12 }}>
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
                      onClick={() => navigate(`/customers/${c.id}`)}
                      style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      {visibleCols.map(col => (
                        <td key={col.key} style={{ padding: '9px 12px' }}>{renderCell(c, col)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ paddingBottom: 64 }} />
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

      {showForm && (
        <CustomerFormModal
          onClose={() => { setShowForm(false); load() }}
        />
      )}
    </AppLayout>
  )
}
