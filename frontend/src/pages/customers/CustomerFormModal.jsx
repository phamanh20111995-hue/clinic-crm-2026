import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { createCustomer, checkPhone } from '../../api/customers'
import toast from 'react-hot-toast'

const SOURCES = ['facebook', 'zalo', 'google', 'tiktok', 'referral', 'walkin', 'other']
const DATA_TYPES = [
  { value: 'nong', label: '🔥 Nóng' },
  { value: 'am',   label: '🌤 Âm' },
  { value: 'thuong', label: '❄ Thường' },
]

export default function CustomerFormModal({ onClose }) {
  const [form, setForm] = useState({
    full_name: '', phone: '', email: '',
    source: 'facebook', data_type: 'thuong', notes: '',
  })
  const [phoneChecked, setPhoneChecked] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handlePhoneBlur = async () => {
    if (!form.phone || form.phone.length < 9) return
    try {
      const { data } = await checkPhone(form.phone)
      setPhoneChecked(data.exists ? data.customer : null)
      if (data.exists) toast.error(`SĐT đã tồn tại: ${data.customer.full_name}`)
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (phoneChecked) { toast.error('SĐT đã tồn tại. Không thể tạo trùng.'); return }
    setLoading(true)
    try {
      await createCustomer(form)
      toast.success('Đã thêm khách hàng mới')
      onClose()
    } catch (err) {
      const msg = Object.values(err.response?.data ?? {}).flat().join(' ') || 'Có lỗi xảy ra'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Thêm khách hàng mới">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
            <input required className="input" value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)} placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
            <input required className={`input ${phoneChecked ? 'border-red-400' : ''}`}
              value={form.phone} onChange={(e) => set('phone', e.target.value)}
              onBlur={handlePhoneBlur} placeholder="0912345678" />
            {phoneChecked && (
              <p className="text-xs text-red-500 mt-1">⚠️ Trùng: {phoneChecked.full_name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input" value={form.email}
              onChange={(e) => set('email', e.target.value)} placeholder="email@gmail.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nguồn</label>
            <select className="input" value={form.source} onChange={(e) => set('source', e.target.value)}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại data</label>
            <select className="input" value={form.data_type} onChange={(e) => set('data_type', e.target.value)}>
              {DATA_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} placeholder="Thông tin thêm..." />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading || !!phoneChecked} className="btn-primary">
            {loading ? 'Đang lưu...' : '+ Thêm KH'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Huỷ</button>
        </div>
      </form>
    </Modal>
  )
}
