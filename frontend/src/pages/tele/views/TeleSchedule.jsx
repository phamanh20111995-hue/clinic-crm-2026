import { useState, useEffect } from 'react'
import api from '../../../api/client'
import { fmtDateTime } from '../../../utils/format'

const STATUS_MAP = {
  pending:     { label: 'Chưa đến',      bg: '#fef9c3', color: '#854d0e' },
  confirmed:   { label: 'Xác nhận đến',  bg: '#dbeafe', color: '#1d4ed8' },
  in_progress: { label: 'Đang điều trị', bg: '#ede9fe', color: '#6d28d9' },
  done:        { label: 'Hoàn thành',    bg: '#dcfce7', color: '#15803d' },
  cancelled:   { label: 'Đã hủy',        bg: '#fee2e2', color: '#dc2626' },
}

export default function TeleSchedule() {
  const [appts, setAppts]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/appointments/', { params: { page_size: 50 } })
      .then(r => setAppts(r.data?.results ?? r.data ?? []))
      .catch(() => setAppts([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Khách hàng', 'SĐT', 'Ngày hẹn', 'Dịch vụ', 'Trạng thái', 'Người đặt'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #dde3ef' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>📅</p>
                  Chưa có lịch hẹn nào
                </td>
              </tr>
            ) : appts.map(a => {
              const st = STATUS_MAP[a.status] ?? { label: a.status, bg: '#f9fafb', color: '#6b7280' }
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                    {a.customer_name ?? a.customer}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>
                    {a.customer_phone ?? '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>
                    {fmtDateTime(a.scheduled_at)}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>
                    {a.service_name ?? a.service ?? '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                      background: st.bg, color: st.color,
                    }}>
                      {st.label}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>
                    {a.booked_by_name ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
