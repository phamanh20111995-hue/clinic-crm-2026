import { useState, useEffect } from 'react'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import api from '../../../api/client'

const ACCENT = '#b45309'

const DAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const STATUS_COLOR = {
  pending:     { bg: '#f0f9ff', border: '#bae6fd', text: '#0369a1' },
  confirmed:   { bg: '#f5f3ff', border: '#ddd6fe', text: '#6d28d9' },
  in_progress: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  done:        { bg: '#f0fdf4', border: '#a7f3d0', text: '#15803d' },
  cancelled:   { bg: '#f9fafb', border: '#e5e7eb', text: '#9ca3af' },
}

function getWeekDates(offset = 0) {
  const now = new Date()
  const day = now.getDay() || 7 // Mon=1..Sun=7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1 + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function LichTuanTab() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [appts, setAppts]           = useState([])
  const [loading, setLoading]       = useState(false)

  const weekDates = getWeekDates(weekOffset)

  useEffect(() => {
    setLoading(true)
    const from = weekDates[0].toISOString().slice(0, 10)
    const to   = weekDates[6].toISOString().slice(0, 10)
    api.get('/api/appointments/', { params: { date_from: from, date_to: to, page_size: 200 } })
      .then(res => setAppts(res.data?.results ?? res.data ?? []))
      .catch(() => setAppts([]))
      .finally(() => setLoading(false))
  }, [weekOffset])

  const weekLabel = (() => {
    const a = weekDates[0], b = weekDates[6]
    return `${a.getDate()}/${a.getMonth()+1} – ${b.getDate()}/${b.getMonth()+1}/${b.getFullYear()}`
  })()

  const today = new Date().toDateString()

  return (
    <div>
      {/* Week nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={() => setWeekOffset(o => o - 1)}
          style={{ border: '1px solid #dde3ef', background: '#fff', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <IconChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', minWidth: 160, textAlign: 'center' }}>
          {weekLabel}
        </span>
        <button onClick={() => setWeekOffset(o => o + 1)}
          style={{ border: '1px solid #dde3ef', background: '#fff', borderRadius: 7, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <IconChevronRight size={16} />
        </button>
        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)}
            style={{ fontSize: 11, color: ACCENT, background: '#fff7ed', border: `1px solid ${ACCENT}40`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
            Tuần này
          </button>
        )}
        {loading && <span style={{ fontSize: 11, color: '#9ca3af' }}>Đang tải...</span>}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
        {weekDates.map((d, i) => {
          const dateStr = d.toISOString().slice(0, 10)
          const isToday = d.toDateString() === today
          const dayAppts = appts.filter(a => a.scheduled_at?.slice(0, 10) === dateStr)
          return (
            <div key={dateStr} style={{
              background: '#fff', borderRadius: 10,
              border: `1.5px solid ${isToday ? ACCENT : '#dde3ef'}`,
              overflow: 'hidden', minHeight: 160,
            }}>
              {/* Day header */}
              <div style={{
                padding: '6px 10px', textAlign: 'center',
                background: isToday ? ACCENT : '#f8fafc',
                borderBottom: `1px solid ${isToday ? ACCENT : '#dde3ef'}`,
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: isToday ? '#fff' : '#6b7280', margin: 0 }}>{DAYS_VI[i]}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: isToday ? '#fff' : '#374151', margin: 0 }}>{d.getDate()}</p>
              </div>

              {/* Appointments */}
              <div style={{ padding: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dayAppts.length === 0 ? (
                  <p style={{ fontSize: 10, color: '#d1d5db', textAlign: 'center', marginTop: 8 }}>—</p>
                ) : (
                  dayAppts.slice(0, 5).map(a => {
                    const cfg = STATUS_COLOR[a.status] ?? STATUS_COLOR.pending
                    return (
                      <div key={a.id} style={{
                        background: cfg.bg, border: `1px solid ${cfg.border}`,
                        borderRadius: 5, padding: '3px 6px',
                      }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: cfg.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.scheduled_at ? new Date(a.scheduled_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' }) : ''} {a.customer_name?.split(' ').pop()}
                        </p>
                        <p style={{ fontSize: 9, color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.service_name ?? ''}</p>
                      </div>
                    )
                  })
                )}
                {dayAppts.length > 5 && (
                  <p style={{ fontSize: 10, color: ACCENT, textAlign: 'center', fontWeight: 600, margin: 0 }}>+{dayAppts.length - 5} nữa</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
        {Object.entries({ pending: 'Chưa đến', confirmed: 'Tư vấn', in_progress: 'Đang ĐT', done: 'Đã về', cancelled: 'Huỷ' }).map(([k, label]) => {
          const cfg = STATUS_COLOR[k]
          return (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'inline-block' }} />
              <span style={{ color: cfg.text, fontWeight: 600 }}>{label}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
