import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../components/layout/AppLayout'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Pagination from '../../components/ui/Pagination'
import CustomerFormModal from './CustomerFormModal'
import { getCustomers } from '../../api/customers'
import { fmtPhone, fmtDate } from '../../utils/format'
import { IconUserPlus, IconSearch } from '@tabler/icons-react'

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

const ACTIONS = (onAdd) => (
  <button
    onClick={onAdd}
    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 7, border: 'none', background: '#6d28d9', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
  >
    <IconUserPlus size={14} stroke={2.5} /> Thêm KH
  </button>
)

export default function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, page_size: 20 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await getCustomers(params)
      setCustomers(data.results ?? data)
      setCount(data.count ?? data.length)
    } catch {
      setCustomers([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

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
              placeholder="Tìm tên, SĐT, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              onKeyDown={e => e.key === 'Enter' && load()}
              style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size="lg" /></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Tên khách hàng', 'SĐT', 'Nguồn', 'Loại data', 'Trạng thái', 'Sale phụ trách', 'Tele phụ trách', 'Ngày tạo'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
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
                      <td style={{ padding: '9px 12px', fontWeight: 600, color: '#0f2044' }}>{c.full_name}</td>
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', color: '#374151' }}>{fmtPhone(c.phone)}</td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{c.source ?? '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <Badge variant={DATA_TYPE_COLORS[c.data_type] ?? 'gray'}>
                          {DATA_TYPE_LABELS[c.data_type] ?? c.data_type ?? '—'}
                        </Badge>
                      </td>
                      <td style={{ padding: '9px 12px' }}>
                        <Badge variant={STATUS_COLORS[c.status] ?? 'gray'}>
                          {STATUS_LABELS[c.status] ?? c.status ?? '—'}
                        </Badge>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{c.sale_name ?? '—'}</td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{c.tele_name ?? '—'}</td>
                      <td style={{ padding: '9px 12px', color: '#94a3b8', fontSize: 10 }}>{fmtDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && customers.length > 0 && (
            <div style={{ padding: '6px 12px', background: '#f8fafc', borderTop: '1px solid #eef1f6', fontSize: 10, color: '#94a3b8', textAlign: 'right' }}>
              {count} khách hàng tổng cộng
            </div>
          )}
        </div>

        <Pagination page={page} count={count} onChange={setPage} />
      </div>

      {showForm && (
        <CustomerFormModal
          onClose={() => { setShowForm(false); load() }}
        />
      )}
    </AppLayout>
  )
}
