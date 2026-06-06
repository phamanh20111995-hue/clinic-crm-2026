import { useState, useEffect } from 'react'
import api from '../../../api/client'
import { fmtDateTime } from '../../../utils/format'

const ACCENT = '#0369a1'

const RESULT_LABEL = {
  chua_goi:   { label: 'Chưa gọi',         color: '#9ca3af' },
  da_goi:     { label: 'Đã gọi',            color: '#15803d' },
  khong_nghe: { label: 'Không nghe máy',    color: '#d97706' },
  thue_bao:   { label: 'Thuê bao',          color: '#6b7280' },
  sai_so:     { label: 'Sai số',            color: '#6b7280' },
  hoan_so:    { label: 'Hoàn số',           color: '#dc2626' },
  dat_lich:   { label: 'Đặt lịch ✅',       color: '#15803d' },
  hen_goi:    { label: 'Hẹn gọi lại',       color: '#2563eb' },
  can_tv:     { label: 'Cần tư vấn thêm',   color: '#7c3aed' },
  khong_qt:   { label: 'Không quan tâm',    color: '#9ca3af' },
}

export default function TeleHistory() {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/customers/', { params: { page_size: 100 } })
      .then(r => {
        // Flatten call histories from customers
        const all = (r.data?.results ?? r.data ?? [])
        setCalls(all)
      })
      .catch(() => setCalls([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Giờ gọi', 'Khách hàng', 'SĐT', 'Lần', 'KQ cuộc gọi', 'KQ tư vấn', 'Tele'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #dde3ef' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
                  Chưa có lịch sử gọi
                </td>
              </tr>
            ) : calls.map(c => {
              const ri = RESULT_LABEL[c.status] ?? { label: c.status, color: '#6b7280' }
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>
                    {fmtDateTime(c.updated_at)}
                  </td>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{c.full_name}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{c.phone}</td>
                  <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                    <span style={{ background: ACCENT + '20', color: ACCENT, borderRadius: 99, padding: '2px 8px', fontWeight: 700, fontSize: 12 }}>
                      {c.call_count}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ color: ri.color, fontWeight: 600, fontSize: 12 }}>{ri.label}</span>
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>
                    {c.notes ? c.notes.slice(0, 40) + (c.notes.length > 40 ? '...' : '') : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>
                    {c.tele_name ?? '—'}
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
