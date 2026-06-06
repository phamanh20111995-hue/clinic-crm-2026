const ACCENT = '#1e40af'

function fmtDateTime(s) {
  if (!s) return '—'
  return new Date(s).toLocaleString('vi', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const CALL_RESULT_CFG = {
  no_answer:    { color: '#9ca3af', icon: '📵' },
  wrong_number: { color: '#ef4444', icon: '❌' },
  callback:     { color: '#f59e0b', icon: '🔄' },
  interested:   { color: '#10b981', icon: '✅' },
  not_interested: { color: '#6b7280', icon: '👎' },
  booked:       { color: '#3b82f6', icon: '📅' },
  default:      { color: '#9ca3af', icon: '📞' },
}

const APPT_STATUS_CFG = {
  pending:     { color: '#9ca3af', icon: '⏳' },
  confirmed:   { color: '#8b5cf6', icon: '💬' },
  in_progress: { color: '#ef4444', icon: '🩺' },
  done:        { color: '#10b981', icon: '✅' },
  cancelled:   { color: '#6b7280', icon: '🚫' },
}

function TimelineItem({ icon, iconBg, title, sub, time, person, content, last }) {
  return (
    <div style={{ display: 'flex', gap: 14, position: 'relative' }}>
      {/* Line */}
      {!last && <div style={{ position: 'absolute', left: 17, top: 36, bottom: 0, width: 2, background: '#e5e7eb' }} />}
      {/* Dot */}
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: iconBg ?? '#dbeafe', color: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, zIndex: 1, border: '2px solid #fff', boxShadow: '0 0 0 2px #e5e7eb' }}>
        {icon}
      </div>
      <div style={{ flex: 1, paddingBottom: last ? 0 : 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{title}</span>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{time}</span>
        </div>
        {sub && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>{sub}</p>}
        {person && <p style={{ fontSize: 12, color: ACCENT, fontWeight: 600, margin: '2px 0' }}>👤 {person}</p>}
        {content && <p style={{ fontSize: 12, color: '#374151', margin: '4px 0 0', background: '#f8fafc', borderRadius: 6, padding: '6px 10px', borderLeft: `3px solid ${ACCENT}` }}>{content}</p>}
      </div>
    </div>
  )
}

export default function HanhTrinhTab({ customer, appointments }) {
  // Build combined timeline events
  const events = []

  // Customer created
  events.push({ ts: customer.created_at, type: 'created', icon: '🆕', iconBg: '#dbeafe', title: 'Hồ sơ được tạo', sub: `Nguồn: ${customer.source_display ?? customer.source}`, person: customer.created_by_name })

  // Calls
  ;(customer.calls ?? []).forEach(c => {
    const cfg = CALL_RESULT_CFG[c.result] ?? CALL_RESULT_CFG.default
    events.push({
      ts: c.called_at,
      type: 'call',
      icon: cfg.icon,
      iconBg: '#ede9fe',
      title: `Cuộc gọi #${c.call_number} — ${c.result_display ?? c.result}`,
      person: c.tele_name,
      content: [c.consult_result, c.notes].filter(Boolean).join(' · ') || undefined,
    })
  })

  // Appointments
  appointments.forEach(a => {
    const cfg = APPT_STATUS_CFG[a.status] ?? APPT_STATUS_CFG.pending
    const people = [a.doctor_name, a.ktv_name].filter(Boolean).join(' / ')
    events.push({
      ts: a.scheduled_at ?? a.created_at,
      type: 'appointment',
      icon: cfg.icon,
      iconBg: '#dcfce7',
      title: `Lịch hẹn: ${a.service_name ?? '—'} — ${a.status_display ?? a.status}`,
      sub: [a.room_name, people ? `BS/KTV: ${people}` : null].filter(Boolean).join(' · ') || undefined,
      person: a.booked_by_name,
      content: a.notes || undefined,
    })
  })

  // Sort by time desc
  events.sort((a, b) => new Date(b.ts ?? 0) - new Date(a.ts ?? 0))

  if (events.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>
        <p style={{ fontSize: 28, margin: '0 0 8px' }}>📋</p>
        <p>Chưa có hành trình nào</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '20px 24px' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 20px' }}>
        Toàn bộ hành trình ({events.length} mốc, mới nhất trước)
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {events.map((ev, i) => (
          <TimelineItem key={i} {...ev} time={fmtDateTime(ev.ts)} last={i === events.length - 1} />
        ))}
      </div>
    </div>
  )
}
