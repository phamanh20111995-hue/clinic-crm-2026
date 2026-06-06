import { IconPhone, IconPhoneCall, IconEdit } from '@tabler/icons-react'

const DATA_TYPE_BADGE = {
  nong:   { label: 'Nóng',   bg: '#fef2f2', color: '#dc2626' },
  am:     { label: 'Âm',     bg: '#eff6ff', color: '#2563eb' },
  thuong: { label: 'Thường', bg: '#f9fafb', color: '#6b7280' },
}

const STATUS_LABEL = {
  chua_goi:   'Chưa gọi',
  da_goi:     'Đã gọi',
  khong_nghe: 'Không nghe',
  thue_bao:   'Thuê bao',
  sai_so:     'Sai số',
  hoan_so:    'Hoàn số',
  dat_lich:   'Đặt lịch',
  hen_goi:    'Hẹn gọi lại',
  can_tv:     'Cần tư vấn',
  khong_qt:   'Không quan tâm',
}

export default function DataRow({ customer, onCall, onLog, accent = '#6d28d9', showAssign }) {
  const badge = DATA_TYPE_BADGE[customer.data_type] ?? DATA_TYPE_BADGE.thuong
  const isHot = customer.data_type === 'nong'
  const initial = (customer.full_name || '?')[0].toUpperCase()

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      borderBottom: '1px solid #f1f5f9',
      background: isHot ? '#fefce8' : '#fff',
      transition: 'background .15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = isHot ? '#fef9c3' : '#f8fafc'}
    onMouseLeave={e => e.currentTarget.style.background = isHot ? '#fefce8' : '#fff'}
    >
      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: accent, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 14,
      }}>
        {initial}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
            {customer.full_name}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 99,
            background: badge.bg, color: badge.color,
          }}>
            {badge.label}
          </span>
          {customer.call_count > 0 && (
            <span style={{ fontSize: 10, color: '#9ca3af' }}>
              Lần {customer.call_count}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>{customer.phone}</span>
          {customer.source && <span>· {customer.source}</span>}
          {customer.status && (
            <span style={{ color: '#9ca3af' }}>· {STATUS_LABEL[customer.status] ?? customer.status}</span>
          )}
        </div>
        {customer.tele_name && (
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
            Tele: {customer.tele_name}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {onCall && (
          <button
            onClick={() => onCall(customer)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 7, border: 'none',
              background: isHot ? '#dc2626' : accent,
              color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <IconPhone size={13} stroke={2.5} />
            {customer.call_count === 0 ? 'Gọi' : customer.call_count === 1 ? 'Gọi lại' : `Lần ${customer.call_count + 1}`}
          </button>
        )}
        {onLog && (
          <button
            onClick={() => onLog(customer)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 7,
              border: '1px solid #dde3ef',
              background: '#fff', color: '#374151',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <IconEdit size={13} stroke={2} />
            Ghi KQ
          </button>
        )}
        {showAssign && (
          <button
            onClick={() => showAssign(customer)}
            style={{
              padding: '5px 10px', borderRadius: 7,
              border: '1px solid #dde3ef',
              background: '#fff', color: '#374151',
              fontSize: 12, cursor: 'pointer',
            }}
          >
            Giao Tele
          </button>
        )}
      </div>
    </div>
  )
}
