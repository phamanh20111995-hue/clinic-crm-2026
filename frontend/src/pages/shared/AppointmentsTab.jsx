import { useState, useEffect } from 'react'
import api from '../../api/client'

const STATUS_MAP = {
  pending:     { label: 'Chưa đến',      bg: '#fef9c3', c: '#854d0e' },
  confirmed:   { label: 'Xác nhận đến',  bg: '#dbeafe', c: '#1d4ed8' },
  in_progress: { label: 'Đang điều trị', bg: '#ede9fe', c: '#6d28d9' },
  done:        { label: 'Hoàn thành',    bg: '#dcfce7', c: '#15803d' },
  cancelled:   { label: 'Đã hủy',        bg: '#fee2e2', c: '#dc2626' },
}

function fmtDT(s) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d)) return s
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AppointmentsTab({ accent = '#0284c7' }) {
  const [appts, setAppts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    api.get('/api/appointments/', { params: { page_size: 100 } })
      .then(r => setAppts(r.data?.results ?? r.data ?? []))
      .catch(() => setAppts([]))
      .finally(() => setLoading(false))
  }, [])

  const rows = appts.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || (a.customer_name ?? '').toLowerCase().includes(q)
      || (a.customer_phone ?? '').includes(q)
    const matchStatus = !filterStatus || a.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          placeholder="Tìm khách hàng / SĐT..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', padding: '6px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 11, outline: 'none', fontFamily: 'inherit' }}
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '6px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 11, outline: 'none', fontFamily: 'inherit', background: '#fff' }}>
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Đang tải lịch hẹn...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Khách hàng', 'SĐT', 'Ngày & giờ hẹn', 'Dịch vụ', 'Trạng thái', 'BS / KTV', 'Người đặt'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
                      {loading ? 'Đang tải...' : 'Không có lịch hẹn'}
                    </td>
                  </tr>
                ) : rows.map(a => {
                  const st = STATUS_MAP[a.status] ?? { label: a.status, bg: '#f1f5f9', c: '#475569' }
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '9px 12px', fontWeight: 600 }}>{a.customer_name ?? a.customer ?? '—'}</td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{a.customer_phone ?? '—'}</td>
                      <td style={{ padding: '9px 12px', color: '#374151' }}>{fmtDT(a.scheduled_at)}</td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{a.service_name ?? a.service ?? '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.c }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{a.doctor_name ?? a.doctor ?? '—'}</td>
                      <td style={{ padding: '9px 12px', color: '#94a3b8', fontSize: 10 }}>{a.booked_by_name ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && rows.length > 0 && (
          <div style={{ padding: '7px 12px', background: '#f8fafc', borderTop: '1px solid #eef1f6', fontSize: 10, color: '#94a3b8', textAlign: 'right' }}>
            {rows.length} lịch hẹn · dữ liệu từ /api/appointments/
          </div>
        )}
      </div>
    </div>
  )
}
