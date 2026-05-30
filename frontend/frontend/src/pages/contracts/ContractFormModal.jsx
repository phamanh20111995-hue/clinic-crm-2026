import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { createContract } from '../../api/contracts'
import { checkPhone } from '../../api/customers'
import api from '../../api/client'
import { fmtMoney } from '../../utils/format'
import toast from 'react-hot-toast'

export default function ContractFormModal({ onClose }) {
  const [services, setServices] = useState([])
  const [phone, setPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  const [items, setItems] = useState([{ service_id: '', service_name: '', quantity: 1, price: 0, discount: 0 }])
  const [payMethod, setPayMethod] = useState('cash')
  const [cashAmt, setCashAmt] = useState(0)
  const [transferAmt, setTransferAmt] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/api/clinics/services/').then(r => setServices(r.data?.results ?? r.data ?? [])).catch(() => {})
  }, [])

  const handlePhoneSearch = async () => {
    if (!phone) return
    try {
      const { data } = await checkPhone(phone)
      if (data.exists) { setCustomer(data.customer); toast.success(`Tìm thấy: ${data.customer.full_name}`) }
      else toast.error('Không tìm thấy KH với SĐT này')
    } catch { toast.error('Lỗi tìm kiếm') }
  }

  const addItem = () =>
    setItems(prev => [...prev, { service_id: '', service_name: '', quantity: 1, price: 0, discount: 0 }])

  const updateItem = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it))

  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i))

  const totalAmount = items.reduce((s, it) => s + (it.price - (it.discount ?? 0)) * it.quantity, 0)
  const finalAmount = totalAmount

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customer) { toast.error('Chưa chọn khách hàng'); return }
    if (items.some(it => !it.service_id && !it.service_name)) {
      toast.error('Vui lòng điền đủ thông tin dịch vụ'); return
    }
    setLoading(true)
    try {
      await createContract({
        customer: customer.id,
        items,
        payment_method: payMethod,
        cash_amount: payMethod !== 'transfer' ? cashAmt : 0,
        transfer_amount: payMethod !== 'cash' ? transferAmt : 0,
        total_amount: totalAmount,
        discount_amount: 0,
        final_amount: finalAmount,
        notes,
      })
      toast.success('Đã tạo hợp đồng nháp')
      onClose()
    } catch (err) {
      const msg = Object.values(err.response?.data ?? {}).flat().join(' ') || 'Có lỗi xảy ra'
      toast.error(msg)
    } finally { setLoading(false) }
  }

  return (
    <Modal open size="xl" onClose={onClose} title="Tạo hợp đồng mới">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tìm khách hàng theo SĐT *</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="0912345678" value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handlePhoneSearch())} />
            <button type="button" onClick={handlePhoneSearch} className="btn-secondary text-sm px-4">🔍 Tìm</button>
          </div>
          {customer && (
            <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm flex justify-between">
              <span className="font-medium text-green-800">✓ {customer.full_name} — {customer.phone}</span>
              <button type="button" onClick={() => setCustomer(null)} className="text-gray-400 hover:text-red-500">✕</button>
            </div>
          )}
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700">Dịch vụ *</label>
            <button type="button" onClick={addItem} className="text-xs text-primary-600 hover:underline">+ Thêm dịch vụ</button>
          </div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
                <div className="col-span-5">
                  <select className="input text-sm" value={it.service_id}
                    onChange={e => {
                      const svc = services.find(s => String(s.id) === e.target.value)
                      updateItem(i, 'service_id', e.target.value)
                      if (svc) { updateItem(i, 'service_name', svc.name); updateItem(i, 'price', svc.price ?? 0) }
                    }}>
                    <option value="">-- Chọn dịch vụ --</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input type="number" min="1" className="input text-sm" value={it.quantity}
                    onChange={e => updateItem(i, 'quantity', Number(e.target.value))} placeholder="SL" />
                </div>
                <div className="col-span-2">
                  <input type="number" min="0" className="input text-sm" value={it.price}
                    onChange={e => updateItem(i, 'price', Number(e.target.value))} placeholder="Giá" />
                </div>
                <div className="col-span-2">
                  <input type="number" min="0" className="input text-sm" value={it.discount}
                    onChange={e => updateItem(i, 'discount', Number(e.target.value))} placeholder="Giảm" />
                </div>
                <div className="col-span-1 text-right">
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none">✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-right mt-2 text-sm font-semibold text-gray-700">
            Tổng: {fmtMoney(totalAmount)}
          </div>
        </div>

        {/* Payment */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức TT</label>
            <select className="input" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
              <option value="cash">Tiền mặt</option>
              <option value="transfer">Chuyển khoản</option>
              <option value="combined">Kết hợp</option>
            </select>
          </div>
          {payMethod !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiền mặt</label>
              <input type="number" min="0" className="input" value={cashAmt}
                onChange={e => setCashAmt(Number(e.target.value))} />
            </div>
          )}
          {payMethod !== 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chuyển khoản</label>
              <input type="number" min="0" className="input" value={transferAmt}
                onChange={e => setTransferAmt(Number(e.target.value))} />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
          <textarea className="input resize-none" rows={2} value={notes}
            onChange={e => setNotes(e.target.value)} placeholder="Ghi chú thêm..." />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Đang lưu...' : '📋 Tạo HĐ nháp'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">Huỷ</button>
        </div>
      </form>
    </Modal>
  )
}
