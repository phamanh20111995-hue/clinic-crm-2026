const ACCENT = '#1e40af'

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '14px 18px' }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: color ?? ACCENT, margin: 0 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: 11, color: color ?? ACCENT, margin: '2px 0 0', fontWeight: 600 }}>{sub}</p>}
      <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}

const STATUS_CFG = {
  new:           { bg: '#dbeafe', color: '#1e40af', label: 'Mới' },
  contacted:     { bg: '#e0e7ff', color: '#4338ca', label: 'Đã liên hệ' },
  consulting:    { bg: '#fef9c3', color: '#92400e', label: 'Đang tư vấn' },
  closed:        { bg: '#dcfce7', color: '#15803d', label: 'Đã chốt' },
  treatment:     { bg: '#fff7ed', color: '#c2410c', label: 'Điều trị' },
  done:          { bg: '#f0fdf4', color: '#15803d', label: 'Hoàn thành' },
  cancelled:     { bg: '#fef2f2', color: '#dc2626', label: 'Huỷ' },
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi') + ' ₫'
}

export default function TongQuanTab({ customer, contracts }) {
  const st = STATUS_CFG[customer.status] ?? { bg: '#f3f4f6', color: '#374151', label: customer.status_display ?? customer.status }

  const totalContract = contracts.reduce((s, c) => s + Number(c.final_amount ?? 0), 0)
  const totalPaid     = contracts
    .filter(c => c.payment_status === 'paid')
    .reduce((s, c) => s + Number(c.final_amount ?? 0), 0)
  const debt          = totalContract - totalPaid

  const initial = (customer.full_name || '?')[0].toUpperCase()
  const genderLabel = customer.gender === 'M' ? 'Nam' : customer.gender === 'F' ? 'Nữ' : 'Không xác định'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* KH Header Card */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{customer.full_name}</h2>
            <span style={{ fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 99 }}>
              {st.label}
            </span>
            <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 99 }}>
              {customer.data_type_display ?? customer.data_type}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#374151' }}>📞 {customer.phone}</span>
            {customer.source_display && <span style={{ fontSize: 13, color: '#374151' }}>📌 {customer.source_display}</span>}
            <span style={{ fontSize: 13, color: '#9ca3af' }}>Tạo: {fmtDate(customer.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <StatCard label="Tổng HĐ"        value={contracts.length}      color={ACCENT} />
        <StatCard label="Tổng chi tiêu"   value={fmtMoney(totalContract)} color="#15803d" />
        <StatCard label="Đã thanh toán"   value={fmtMoney(totalPaid)}   color="#0369a1" />
        <StatCard label="Công nợ"         value={fmtMoney(debt)}        color={debt > 0 ? '#dc2626' : '#6b7280'} />
        <StatCard label="Số lần gọi"      value={customer.call_count ?? 0} color="#6d28d9" />
      </div>

      {/* Thông tin cơ bản */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Thông tin cơ bản</span>
        </div>
        <div style={{ padding: '0 16px' }}>
          <InfoRow label="Họ tên"           value={customer.full_name} />
          <InfoRow label="Số điện thoại"    value={customer.phone} />
          <InfoRow label="Giới tính"        value={genderLabel} />
          <InfoRow label="Ngày sinh"        value={fmtDate(customer.dob)} />
          <InfoRow label="Địa chỉ"          value={customer.address} />
          <InfoRow label="Email"            value={customer.email} />
          <InfoRow label="Dịch vụ quan tâm" value={(customer.services_interest_names && customer.services_interest_names.length) ? customer.services_interest_names.join(', ') : null} />
          <InfoRow label="Nguồn"            value={customer.source_display} />
          <InfoRow label="Loại data"        value={customer.data_type_display} />
          <InfoRow label="Sale phụ trách"   value={customer.sale_name} />
          <InfoRow label="Tele phụ trách"   value={customer.tele_name} />
          <InfoRow label="CSKH phụ trách"   value={customer.cskh_name} />
          <InfoRow label="Ads phụ trách"    value={customer.ads_name} />
          <InfoRow label="BS gần nhất"      value={customer.last_bs_name} />
          <InfoRow label="KTV gần nhất"     value={customer.last_ktv_name} />
          <InfoRow label="Người tạo"        value={customer.created_by_name} />
          <InfoRow label="Ngày tạo"         value={fmtDate(customer.created_at)} />
          {customer.notes && <InfoRow label="Ghi chú" value={customer.notes} />}
        </div>
      </div>
    </div>
  )
}
