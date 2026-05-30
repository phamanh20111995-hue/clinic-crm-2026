import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { logCall, createReturnRequest } from '../../api/calls'
import { fmtPhone } from '../../utils/format'
import toast from 'react-hot-toast'

const CALL_RESULTS = [
  { value: 'da_tu_van',        label: 'Đã tư vấn — quan tâm' },
  { value: 'dat_lich',         label: 'Đặt lịch hẹn' },
  { value: 'khong_lien_lac',   label: 'Không liên lạc được' },
  { value: 'tu_choi',          label: 'Từ chối dịch vụ' },
  { value: 'dang_tu_van',      label: 'Đang tư vấn — cần gọi lại' },
]

const RETURN_REASONS = [
  { value: 'sai_so',        label: 'Sai số điện thoại' },
  { value: 'trung_lap',     label: 'Trùng lặp dữ liệu' },
  { value: 'khac',          label: 'Lý do khác' },
]

export default function LogCallModal({ customer, onClose }) {
  const [tab, setTab] = useState('call')
  const [form, setForm] = useState({ status: 'da_tu_van', result: '', note: '' })
  const [returnForm, setReturnForm] = useState({ reason: 'sai_so', note: '' })
  const [loading, setLoading] = useState(false)

  const handleCall = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await logCall({
        customer_id: customer.id,
        status: form.status,
        result: form.result,
        note: form.note,
      })
      toast.success('Đã ghi nhận kết quả gọi')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createReturnRequest({
        customer_id: customer.id,
        reason: returnForm.reason,
        note: returnForm.note,
      })
      toast.success('Đã gửi yêu cầu hoàn số')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Gọi điện: ${customer.full_name}`}>
      <div className="space-y-4">
        {/* Customer info */}
        <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
            {customer.full_name[0]}
          </div>
          <div>
            <p className="font-semibold">{customer.full_name}</p>
            <p className="text-sm font-mono text-gray-600">{fmtPhone(customer.phone)}</p>
            <p className="text-xs text-gray-500">Số lần gọi: {customer.call_count ?? 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'call', label: '📞 Ghi kết quả' },
            { id: 'return', label: '↩ Hoàn số' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {tab === 'call' ? (
          <form onSubmit={handleCall} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kết quả gọi *</label>
              <select required className="input" value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {CALL_RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú cuộc gọi</label>
              <textarea className="input resize-none" rows={3} value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value })}
                placeholder="KH quan tâm dịch vụ trị mụn, hỏi về giá..." />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Đang lưu...' : '✅ Ghi nhận'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Huỷ</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReturn} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lý do hoàn số *</label>
              <select required className="input" value={returnForm.reason}
                onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}>
                {RETURN_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <textarea className="input resize-none" rows={2} value={returnForm.note}
                onChange={(e) => setReturnForm({ ...returnForm, note: e.target.value })}
                placeholder="Chi tiết lý do..." />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="btn-danger text-sm">
                {loading ? 'Đang gửi...' : '↩ Yêu cầu hoàn số'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Huỷ</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
