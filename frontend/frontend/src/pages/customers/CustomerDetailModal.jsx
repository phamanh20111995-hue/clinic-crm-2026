import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { getCustomer, updateCustomer } from '../../api/customers'
import { fmtPhone, fmtDate, fmtDateTime } from '../../utils/format'
import toast from 'react-hot-toast'

const STATUS_LABELS = {
  moi: 'Mới', dang_tu_van: 'Đang tư vấn', da_tu_van: 'Đã tư vấn',
  dat_lich: 'Đặt lịch', da_den: 'Đã đến', dang_dieu_tri: 'Điều trị',
  hoan_thanh: 'Hoàn thành', hoan_so: 'Hoàn số', sai_so: 'Sai số',
  khong_lien_lac: 'Không liên lạc', tu_choi: 'Từ chối',
}

export default function CustomerDetailModal({ customer: initial, onClose }) {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    getCustomer(initial.id)
      .then(({ data }) => { setCustomer(data); setForm({ notes: data.notes ?? '', status: data.status }) })
      .finally(() => setLoading(false))
  }, [initial.id])

  const handleSave = async () => {
    try {
      const { data } = await updateCustomer(customer.id, form)
      setCustomer(data)
      setEditing(false)
      toast.success('Đã cập nhật')
    } catch {
      toast.error('Cập nhật thất bại')
    }
  }

  return (
    <Modal open size="lg" onClose={onClose} title={`Chi tiết KH: ${initial.full_name}`}>
      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : customer ? (
        <div className="space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Họ tên" value={customer.full_name} />
            <InfoRow label="SĐT" value={fmtPhone(customer.phone)} mono />
            <InfoRow label="Email" value={customer.email ?? '—'} />
            <InfoRow label="Ngày sinh" value={fmtDate(customer.date_of_birth)} />
            <InfoRow label="Nguồn" value={customer.source} />
            <InfoRow label="Loại data" value={customer.data_type} />
            <InfoRow label="Sale" value={customer.sale_name ?? '—'} />
            <InfoRow label="Tele" value={customer.tele_name ?? '—'} />
            <InfoRow label="Ngày tạo" value={fmtDateTime(customer.created_at)} />
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
            {editing ? (
              <select
                className="input w-48 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            ) : (
              <Badge variant="blue">{STATUS_LABELS[customer.status] ?? customer.status}</Badge>
            )}
          </div>

          {/* Notes */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">Ghi chú</p>
            {editing ? (
              <textarea
                className="input resize-none"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            ) : (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 min-h-[60px] whitespace-pre-wrap">
                {customer.notes || <span className="text-gray-400 italic">Chưa có ghi chú</span>}
              </p>
            )}
          </div>

          {/* Call history */}
          {customer.call_histories?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Lịch sử gọi điện</p>
              <div className="space-y-2">
                {customer.call_histories.map((c) => (
                  <div key={c.id} className="text-xs bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Lần {c.call_number}</span>
                      <span className="text-gray-400">{fmtDateTime(c.created_at)}</span>
                    </div>
                    <p className="text-gray-600">{c.result || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            {editing ? (
              <>
                <button onClick={handleSave} className="btn-primary text-sm">💾 Lưu</button>
                <button onClick={() => setEditing(false)} className="btn-secondary text-sm">Huỷ</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary text-sm">✏️ Sửa</button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-medium text-gray-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}
