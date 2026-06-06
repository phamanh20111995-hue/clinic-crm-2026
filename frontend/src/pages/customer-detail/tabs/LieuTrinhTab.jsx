const ACCENT = '#1e40af'

function fmtDateTime(s) {
  if (!s) return '—'
  return new Date(s).toLocaleString('vi', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CFG = {
  pending:     { bg: '#f0f9ff', color: '#0369a1', label: 'Chờ' },
  confirmed:   { bg: '#f5f3ff', color: '#6d28d9', label: 'Tư vấn' },
  in_progress: { bg: '#fef2f2', color: '#dc2626', label: 'Đang ĐT' },
  done:        { bg: '#f0fdf4', color: '#15803d', label: 'Hoàn thành' },
  cancelled:   { bg: '#f9fafb', color: '#9ca3af', label: 'Huỷ' },
}

export default function LieuTrinhTab({ appointments }) {
  // Group by service
  const byService = {}
  appointments.forEach(a => {
    const svc = a.service_name ?? `Dịch vụ #${a.service ?? '?'}`
    if (!byService[svc]) byService[svc] = []
    byService[svc].push(a)
  })

  const services = Object.entries(byService)

  const doneCount   = appointments.filter(a => a.status === 'done').length
  const totalCount  = appointments.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { label: 'Tổng buổi',      value: totalCount,  color: ACCENT },
          { label: 'Đã hoàn thành',  value: doneCount,   color: '#15803d' },
          { label: 'Còn lại',        value: totalCount - doneCount, color: '#f59e0b' },
          { label: 'Loại dịch vụ',   value: services.length, color: '#6d28d9' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '14px 18px' }}>
            <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Per-service breakdown */}
      {services.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '40px 16px', textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ fontSize: 28, margin: '0 0 8px' }}>💆</p>
          <p>Chưa có buổi điều trị nào</p>
        </div>
      ) : services.map(([svcName, appts]) => {
        const done = appts.filter(a => a.status === 'done').length
        const pct  = appts.length > 0 ? Math.round((done / appts.length) * 100) : 0
        const staff = [...new Set(appts.flatMap(a => [a.doctor_name, a.ktv_name].filter(Boolean)))].join(', ')

        return (
          <div key={svcName} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
            {/* Service header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', margin: 0 }}>{svcName}</p>
                  {staff && <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0 0' }}>BS/KTV: {staff}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>{done}/{appts.length} buổi</span>
                  <p style={{ fontSize: 10, color: '#6b7280', margin: '2px 0 0' }}>{pct}% hoàn thành</p>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ marginTop: 8, height: 6, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#15803d' : ACCENT, borderRadius: 99, transition: 'width .4s' }} />
              </div>
            </div>

            {/* Session list */}
            <div style={{ padding: '0 0' }}>
              {appts.map((a, i) => {
                const cfg = STATUS_CFG[a.status] ?? STATUS_CFG.pending
                const people = [a.doctor_name, a.ktv_name].filter(Boolean).join(' / ')
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', padding: '9px 16px', borderBottom: i < appts.length - 1 ? '1px solid #f1f5f9' : 'none', gap: 10 }}>
                    <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 24 }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, color: '#374151' }}>{fmtDateTime(a.scheduled_at)}</p>
                      {people && <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{people} {a.room_name ? `· ${a.room_name}` : ''}</p>}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                      {cfg.label}
                    </span>
                    {a.tua_confirmed && (
                      <span style={{ fontSize: 10, color: '#15803d', fontWeight: 600 }}>✅ tua</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
