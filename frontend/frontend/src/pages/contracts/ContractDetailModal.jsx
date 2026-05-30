import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { fmtMoney, fmtDateTime } from '../../utils/format'

const APPROVAL = {
  draft:      { label: 'Nháp',         color: 'gray' },
  pending_kt: { label: 'Chờ KT duyệt', color: 'yellow' },
  approved:   { label: 'Đã duyệt',     color: 'green' },
  rejected:   { label: 'Từ chối',      color: 'red' },
}
const PAYMENT = {
  pending:  { label: 'Chưa TT',  color: 'yellow' },
  received: { label: 'Đã nhận',  color: 'green' },
  partial:  { label: 'Một phần', color: 'orange' },
}

export default function ContractDetailModal({ contract: c, onClose }) {
  const ap = APPROVAL[c.approval_status] ?? { label: c.approval_status, color: 'gray' }
  const pm = PAYMENT[c.payment_status] ?? { label: c.payment_status, color: 'gray' }

  return (
    <Modal open size="lg" onClose={onClose} title={`HĐ: ${c.contract_no}`}>
      <div className="space-y-5 text-sm">
        {/* Header badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={ap.color}>{ap.label}</Badge>
          <Badge variant={pm.color}>{pm.label}</Badge>
          {c.payment_method && <Badge variant="blue">{c.payment_method}</Badge>}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4">
          <Row label="Khách hàng" value={c.customer_name} />
          <Row label="Người tạo" value={c.created_by_name} />
          <Row label="Ngày tạo" value={fmtDateTime(c.created_at)} />
          <Row label="Người duyệt" value={c.approved_by_name ?? '—'} />
          <Row label="Tổng tiền" value={fmtMoney(c.total_amount)} />
          <Row label="Khuyến mãi" value={fmtMoney(c.discount_amount)} />
          <Row label="Thực trả" value={<span className="font-bold text-primary-700">{fmtMoney(c.final_amount)}</span>} />
          <Row label="Tiền mặt" value={fmtMoney(c.cash_amount)} />
          <Row label="Chuyển khoản" value={fmtMoney(c.transfer_amount)} />
        </div>

        {/* Items */}
        {c.items?.length > 0 && (
          <div>
            <p className="font-semibold text-gray-700 mb-2">Dịch vụ</p>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-th">Dịch vụ</th>
                    <th className="table-th">SL</th>
                    <th className="table-th">Đơn giá</th>
                    <th className="table-th">Giảm</th>
                    <th className="table-th">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {c.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="table-td">{item.service_name ?? item.name}</td>
                      <td className="table-td">{item.quantity}</td>
                      <td className="table-td">{fmtMoney(item.price)}</td>
                      <td className="table-td">{fmtMoney(item.discount)}</td>
                      <td className="table-td font-medium">{fmtMoney((item.price - (item.discount ?? 0)) * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notes */}
        {c.notes && (
          <div>
            <p className="font-semibold text-gray-700 mb-1">Ghi chú</p>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">{c.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}
