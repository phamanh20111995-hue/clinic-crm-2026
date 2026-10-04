import { useState, useEffect } from 'react'
import { getCustomerCourses } from '../../../api/customerDetail'

const ACCENT = '#1e40af'

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function LieuTrinhTab({ customer }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!customer?.id) return
    setLoading(true)
    getCustomerCourses(customer.id)
      .then(res => setCourses(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [customer?.id])

  const totalBuoi   = courses.reduce((s, c) => s + Number(c.so_buoi ?? 0), 0)
  const totalDaDung = courses.reduce((s, c) => s + Number(c.so_buoi_da_dung ?? 0), 0)
  const totalConLai = courses.reduce((s, c) => s + Number(c.buoi_con_lai ?? 0), 0)

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Đang tải liệu trình…</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { label: 'Tổng buổi mua', value: totalBuoi,    color: ACCENT },
          { label: 'Đã làm',        value: totalDaDung,  color: '#15803d' },
          { label: 'Còn lại',       value: totalConLai,  color: '#f59e0b' },
          { label: 'Số gói',        value: courses.length, color: '#6d28d9' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '14px 18px' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Per-course cards */}
      {courses.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '40px 16px', textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>💆</p>
          <p>Chưa có gói liệu trình nào</p>
        </div>
      ) : courses.map(c => {
        const done  = Number(c.so_buoi_da_dung ?? 0)
        const total = Number(c.so_buoi ?? 0)
        const pct   = total > 0 ? Math.round((done / total) * 100) : 0
        const sessions = Array.isArray(c.sessions) ? c.sessions : []

        return (
          <div key={c.id} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
            {/* Course header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', margin: 0 }}>{c.service_name}</p>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{done}/{total} buổi</span>
                  <p style={{ fontSize: 10, color: '#6b7280', margin: '2px 0 0' }}>{pct}% hoàn thành</p>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ marginTop: 8, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#15803d' : ACCENT, borderRadius: 99, transition: 'width .4s' }} />
              </div>
            </div>

            {/* Session list */}
            <div>
              {sessions.length === 0 ? (
                <div style={{ padding: '10px 16px' }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>Chưa thực hiện buổi nào</p>
                </div>
              ) : sessions.map((s, i) => (
                <div key={s.id ?? i} style={{ display: 'flex', alignItems: 'flex-start', padding: '9px 16px', borderBottom: i < sessions.length - 1 ? '1px solid #f1f5f9' : 'none', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 24 }}>#{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#374151', fontWeight: 600 }}>{fmtDate(s.date)}{s.time ? ' · ' + s.time : ''}</p>
                    {(s.bs_dieu_tri_name || s.ktv_name || s.room_name) && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>
                        {[s.bs_dieu_tri_name ? 'BS: ' + s.bs_dieu_tri_name : null, s.ktv_name ? 'KTV: ' + s.ktv_name : null, s.room_name].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {s.notes && (
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7280', background: '#f8fafc', borderRadius: 6, padding: '5px 8px', borderLeft: '2px solid #1e40af' }}>{s.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
