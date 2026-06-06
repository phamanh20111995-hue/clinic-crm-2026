import { useState, useEffect } from 'react'
import { getUsers, getTodayAppointments } from '../../../api/letan'

const ACCENT = '#b45309'

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8h–19h

function TimeBlock({ appt }) {
  if (!appt) return <div style={{ height: 44 }} />
  return (
    <div style={{
      background: '#fff7ed', border: `1px solid ${ACCENT}40`, borderRadius: 7,
      padding: '4px 6px', fontSize: 11, minHeight: 44,
    }}>
      <p style={{ fontWeight: 700, color: ACCENT, margin: 0, lineHeight: 1.2 }}>{appt.customer_name?.split(' ').pop()}</p>
      <p style={{ color: '#92400e', margin: 0, fontSize: 10 }}>{appt.service_name ?? '—'}</p>
    </div>
  )
}

export default function SoDoTab() {
  const [staff, setStaff]   = useState([])
  const [appts, setAppts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getUsers(), getTodayAppointments()])
      .then(([u, a]) => {
        setStaff(u.data?.results ?? u.data ?? [])
        setAppts(a.data?.results ?? a.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
  if (staff.length === 0) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Chưa có dữ liệu nhân viên</div>

  // Map: staffId → { hour: appt }
  const schedule = {}
  staff.forEach(u => { schedule[u.id] = {} })
  appts.forEach(a => {
    if (!a.scheduled_at) return
    const h = new Date(a.scheduled_at).getHours()
    const sid = a.doctor ?? a.ktv
    if (sid && schedule[sid]) schedule[sid][h] = a
  })

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #dde3ef', minWidth: 120 }}>BS / KTV</th>
            {HOURS.map(h => (
              <th key={h} style={{ padding: '10px 8px', fontSize: 11, color: '#6b7280', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #dde3ef', minWidth: 80 }}>
                {h}:00
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((u, i) => (
            <tr key={u.id} style={{ borderBottom: i < staff.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <td style={{ padding: '8px 14px', fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: '#374151' }}>{u.display_name ?? u.email}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{u.role_display ?? u.role ?? ''}</div>
              </td>
              {HOURS.map(h => (
                <td key={h} style={{ padding: 4, verticalAlign: 'top' }}>
                  <TimeBlock appt={schedule[u.id]?.[h]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
