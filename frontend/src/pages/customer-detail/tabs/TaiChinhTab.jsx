const ACCENT = '#1e40af'

function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi') + ' ₫'
}
function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const APPROVAL_CFG = {
  draft:    { bg: '#f3f4f6', color: '#6b7280', label: 'Nháp' },
  pending:  { bg: '#fef9c3', color: '#92400e', label: 'Chờ duyệt' },
  approved: { bg: '#dcfce7', color: '#15803d', label: 'Đã duyệt' },
  rejected: { bg: '#fef2f2', color: '#dc2626', label: 'Từ chối' },
}
const PAYMENT_CFG = {
  unpaid:  { bg: '#fef2f2', color: '#dc2626', label: 'Chưa TT' },
  partial: { bg: '#fff7ed', color: '#c2410c', label: 'Một phần' },
  paid:    { bg: '#dcfce7', color: '#15803d', label: 'Đã TT đủ' },
}

export default function TaiChinhTab({ contracts }) {
  const totalValue = contracts.reduce((s, c) => s + Number(c.final_amount ?? 0), 0)
  const totalPaid  = contracts.filter(c => c.payment_status === 'paid').reduce((s, c) => s + Number(c.final_amount ?? 0), 0)
  const debt       = totalValue - totalPaid

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[
          { label: 'Tổng giá trị HĐ', value: fmtMoney(totalValue), color: ACCENT },
          { label: 'Đã thanh toán',   value: fmtMoney(totalPaid),   color: '#15803d' },
          { label: 'Còn nợ',          value: fmtMoney(debt),        color: debt > 0 ? '#dc2626' : '#9ca3af' },
          { label: 'Số hợp đồng',     value: contracts.length,      color: '#6d28d9' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '14px 18px' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color, margin: 0 }}>{value}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Contracts table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Danh sách hợp đồng</span>
        </div>
        {contracts.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Chưa có hợp đồng nào</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Mã HĐ', 'Dịch vụ / Items', 'Giá trị', 'Hình thức TT', 'Duyệt', 'Thanh toán', 'Ngày'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, borderBottom: '1px solid #dde3ef', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map((c, i) => {
                  const apr = APPROVAL_CFG[c.approval_status] ?? APPROVAL_CFG.draft
                  const pmt = PAYMENT_CFG[c.payment_status] ?? PAYMENT_CFG.unpaid
                  const itemNames = Array.isArray(c.items_detail)
                    ? c.items_detail.map(it => it.name).join(', ')
                    : (c.items_detail ? JSON.stringify(c.items_detail) : '—')
                  return (
                    <tr key={c.id} style={{ borderBottom: i < contracts.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: ACCENT }}>{c.contract_no}</td>
                      <td style={{ padding: '10px 12px', maxWidth: 200 }}>
                        <p style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{itemNames}</p>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoney(c.final_amount)}</td>
                      <td style={{ padding: '10px 12px' }}>{c.payment_method_display ?? c.payment_method ?? '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, background: apr.bg, color: apr.color, padding: '2px 8px', borderRadius: 99 }}>{apr.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, background: pmt.bg, color: pmt.color, padding: '2px 8px', borderRadius: 99 }}>{pmt.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment breakdown */}
      {contracts.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '16px 20px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 12px' }}>Lịch sử thanh toán theo HĐ</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contracts.filter(c => c.approval_status === 'approved').map(c => {
              const cashAmt     = Number(c.cash_amount ?? 0)
              const transferAmt = Number(c.transfer_amount ?? 0)
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: ACCENT }}>{c.contract_no}</span>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#374151' }}>
                    {cashAmt > 0     && <span>💵 TM: {fmtMoney(cashAmt)}</span>}
                    {transferAmt > 0 && <span>🏦 CK: {fmtMoney(transferAmt)}</span>}
                    {cashAmt === 0 && transferAmt === 0 && <span style={{ color: '#9ca3af' }}>Chưa ghi nhận</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
