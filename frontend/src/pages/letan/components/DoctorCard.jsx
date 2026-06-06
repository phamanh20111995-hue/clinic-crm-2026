const ACCENT = '#b45309'

function StatusDot({ status }) {
  const cfg = {
    free:   { color: '#15803d', label: 'Trống' },
    soon:   { color: '#d97706', label: 'Sắp xong' },
    busy:   { color: '#dc2626', label: 'Bận' },
  }[status] ?? { color: '#9ca3af', label: 'N/A' }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: cfg.color,
        boxShadow: status === 'free' ? `0 0 0 2px ${cfg.color}30` : 'none',
        display: 'inline-block',
      }} />
      <span style={{ color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
    </span>
  )
}

export default function DoctorCard({ person, onAssign, currentAppt }) {
  const initial = (person.display_name || person.email || '?')[0].toUpperCase()
  const busyWith = person.current_appointment
  const status = busyWith ? (person.soon_done ? 'soon' : 'busy') : 'free'

  return (
    <div style={{
      background: '#fff', borderRadius: 10, border: '1px solid #dde3ef',
      padding: '10px 12px', cursor: onAssign ? 'pointer' : 'default',
      transition: 'box-shadow .15s, border-color .15s',
      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
    }}
    onMouseEnter={e => { if (onAssign) { e.currentTarget.style.boxShadow = '0 3px 12px rgba(180,83,9,.15)'; e.currentTarget.style.borderColor = ACCENT } }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.05)'; e.currentTarget.style.borderColor = '#dde3ef' }}
    onClick={() => onAssign?.(person)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', background: ACCENT,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 12, margin: 0, truncate: true }}>{person.display_name || person.email}</p>
          <StatusDot status={status} />
        </div>
      </div>

      {busyWith && (
        <>
          <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 3px', truncate: true }}>
            {busyWith.customer_name} · {busyWith.service_name ?? '—'}
          </p>
          {/* Progress bar */}
          <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: status === 'soon' ? '#d97706' : '#dc2626',
              width: `${Math.min(100, (person.progress_pct ?? 60))}%`,
              transition: 'width .5s',
            }} />
          </div>
          {person.remaining_min != null && (
            <p style={{ fontSize: 10, color: status === 'soon' ? '#d97706' : '#dc2626', marginTop: 3, fontWeight: 600 }}>
              Còn ~{person.remaining_min} phút
            </p>
          )}
        </>
      )}

      {onAssign && status === 'free' && (
        <div style={{ marginTop: 4, fontSize: 10, color: ACCENT, fontWeight: 600, textAlign: 'center' }}>
          Nhấn để chỉ định →
        </div>
      )}
    </div>
  )
}
