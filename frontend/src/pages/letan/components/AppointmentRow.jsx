import { IconPhone, IconDoorEnter, IconCheck, IconLogout, IconStethoscope, IconArrowRight, IconClock } from '@tabler/icons-react'

const ACCENT = '#b45309'

const STATUS_CFG = {
  pending:         { label: 'Chưa đến',    bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  confirmed:       { label: 'Đã đến',      bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
  waiting_consult: { label: 'Chờ TV',      bg: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' },
  waiting_treat:   { label: 'Chờ ĐT',      bg: '#fce7f3', color: '#9d174d', border: '#f9a8d4' },
  consulting:      { label: 'Đang TV',      bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  in_progress:     { label: 'Đang ĐT',     bg: '#dcfce7', color: '#166534', border: '#a7f3d0' },
  done:            { label: 'Đã về',       bg: '#f3f4f6', color: '#9ca3af', border: '#e5e7eb' },
  cancelled:       { label: 'Đã hủy',      bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
}

function timeDiff(scheduledAt) {
  const diff = Math.floor((Date.now() - new Date(scheduledAt)) / 60000)
  if (diff < 60) return `${diff} phút`
  return `${Math.floor(diff / 60)}h${diff % 60 ? diff % 60 + 'm' : ''}`
}

export default function AppointmentRow({ appt, onCheckin, onEnqueue, onAssignRoom, onToTreatment, onCheckout, onCall, isSelected, onClick }) {
  const cfg = STATUS_CFG[appt.status] ?? STATUS_CFG.pending
  const initial = (appt.customer_name || '?')[0].toUpperCase()
  const isWaiting = appt.status === 'waiting_consult' || appt.status === 'waiting_treat'

  return (
    <div
      onClick={() => onClick?.(appt)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 14px',
        borderBottom: '1px solid #f1f5f9',
        background: isSelected ? '#fff7ed' : appt.status === 'done' ? '#fafafa' : '#fff',
        borderLeft: `3px solid ${isWaiting ? '#7c3aed' : isSelected ? ACCENT : 'transparent'}`,
        cursor: 'pointer', transition: 'background .12s',
        opacity: appt.status === 'done' ? 0.65 : 1,
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#fef3c7' }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = appt.status === 'done' ? '#fafafa' : '#fff' }}
    >
      {/* Avatar */}
      <div style={{
        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
        background: appt.status === 'done' ? '#d1d5db' : ACCENT,
        color: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 700, fontSize: 13,
      }}>
        {initial}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
            {appt.customer_name}
            {appt.is_walkin && <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 4 }}>[Walk-in]</span>}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          }}>
            {cfg.label}
          </span>
          {appt.visit_type_display && appt.status !== 'pending' && (
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{appt.visit_type_display}</span>
          )}
          {appt.tua_confirmed && (
            <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 99, fontWeight: 600 }}>
              Tua ✓
            </span>
          )}
        </div>

        <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>{appt.customer_phone}</span>
          {appt.scheduled_at && (
            <span>· {new Date(appt.scheduled_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}</span>
          )}
          {appt.service_name && <span>· {appt.service_name}</span>}
          {appt.room_name && <span>· {appt.room_name}</span>}
          {appt.doctor_name && <span>· BS: {appt.doctor_name}</span>}
          {appt.ktv_name && <span>· KTV: {appt.ktv_name}</span>}
                {appt.sale_name && <span>· Sale: {appt.sale_name}</span>}
          {appt.status === 'in_progress' && (
            <span style={{ color: ACCENT, fontWeight: 600 }}>
              · {timeDiff(appt.scheduled_at)} đang ĐT
            </span>
          )}
          {appt.status === 'done' && appt.checked_out_at && (
            <span style={{ color: '#9ca3af' }}>
              · Ra về {new Date(appt.checked_out_at).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginTop: 2 }} onClick={e => e.stopPropagation()}>
        {appt.status === 'pending' && (
          <>
            <button onClick={() => onCheckin(appt)} title="Xác nhận đến"
              style={btnStyle('#15803d', '#fff')}>
              <IconCheck size={12} stroke={3} /> Xác nhận đến
            </button>
            <button onClick={() => onCall?.(appt)} title="Gọi nhắc"
              style={btnStyle('transparent', '#6b7280', '#dde3ef')}>
              <IconPhone size={12} stroke={2} />
            </button>
          </>
        )}
        {appt.status === 'confirmed' && (
          <button onClick={() => onEnqueue(appt)} title="Chọn loại lượt"
            style={btnStyle(ACCENT, '#fff')}>
            <IconClock size={12} stroke={2} /> Chọn loại lượt
          </button>
        )}
        {appt.status === 'waiting_consult' && (
          <button onClick={() => onAssignRoom(appt)} title="Phân phòng tư vấn"
            style={btnStyle('#7c3aed', '#fff')}>
            <IconDoorEnter size={12} stroke={2} /> Phân phòng TV
          </button>
        )}
        {appt.status === 'waiting_treat' && (
          <button onClick={() => onAssignRoom(appt)} title="Phân phòng điều trị"
            style={btnStyle('#dc2626', '#fff')}>
            <IconDoorEnter size={12} stroke={2} /> Phân phòng ĐT
          </button>
        )}
        {appt.status === 'consulting' && (
          <>
            <button onClick={() => onToTreatment(appt)} title="Chuyển sang điều trị"
              style={btnStyle(ACCENT, '#fff')}>
              <IconArrowRight size={12} stroke={2} /> → Điều trị
            </button>
            <button onClick={() => onCheckout(appt)} title="KH về"
              style={btnStyle('transparent', '#6b7280', '#dde3ef')}>
              <IconLogout size={12} stroke={2} /> Về
            </button>
          </>
        )}
        {appt.status === 'in_progress' && (
          <button onClick={() => onCheckout(appt)} title="KH về"
            style={btnStyle('#1d4ed8', '#fff')}>
            <IconLogout size={12} stroke={2} /> KH về
          </button>
        )}
      </div>
    </div>
  )
}

const btnStyle = (bg, color, border) => ({
  display: 'flex', alignItems: 'center', gap: 3,
  padding: '4px 9px', borderRadius: 6, border: `1px solid ${border || bg}`,
  background: bg, color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
  whiteSpace: 'nowrap',
})
