import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { getServices, getMyCustomers, createContract, submitContract } from '../../../api/sale'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const LOAI = [
  { v: 'new',  l: 'DV mới song song',    sub: 'HĐ mới · LT mới',        c: '#16a34a', bg: '#f0fdf4' },
  { v: 'nang', l: 'Nâng cấp / +buổi',   sub: 'Phụ lục HĐ cũ',          c: '#1d4ed8', bg: '#eff6ff' },
  { v: 'sp',   l: 'Sản phẩm take-home',  sub: 'Xuất kho ngay',           c: '#d97706', bg: '#fffbeb' },
]

export default function ThemDVModal({ onClose, onDone, defaultCustomer }) {
  const [loai, setLoai] = useState('new')
  const [services, setServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({ customer: defaultCustomer?.id ?? '', service_id: '', service_name: '', amount: '', paid: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    getServices().then(r => setServices(r.data?.results ?? r.data ?? [])).catch(() => {})
    if (!defaultCustomer) getMyCustomers().then(r => setCustomers(r.data?.results ?? r.data ?? [])).catch(() => {})
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSave = async () => {
    if (!form.customer) { toast.error('Chọn khách hàng'); return }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Nhập số tiền'); return }
    setSaving(true)
    try {
      const amt = Number(form.amount)
      const paid = Number(form.paid || 0)
      const svc = services.find(s => String(s.id) === form.service_id)
      const { data } = await createContract({
        customer: form.customer,
        items: [{ service_id: form.service_id || null, name: form.service_name || svc?.name || 'Dịch vụ bổ sung', sessions: 1, price: amt, discount: 0 }],
        promotions: [], gifts: [],
        total_amount: amt, discount_amount: 0, final_amount: amt,
        payment_method: 'transfer',
        cash_amount: 0, transfer_amount: paid,
        payment_status: paid >= amt ? 'received' : paid > 0 ? 'partial' : 'unpaid',
        notes: `Loại: ${loai}`,
      })
      await submitContract(data.id)
      toast.success(`Đã tạo HĐ bổ sung ${data.contract_no}`)
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi tạo HĐ')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }
  const label = (txt, req) => <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{txt}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Thêm DV / Nâng cấp</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {defaultCustomer && (
            <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, fontSize: 12, color: '#92400e' }}>
              ℹ️ <b>{defaultCustomer.customer_name ?? defaultCustomer.full_name}</b> đang có liệu trình. Chọn loại giao dịch bổ sung:
            </div>
          )}

          {/* Loại */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
            {LOAI.map(o => (
              <button key={o.v} onClick={() => setLoai(o.v)}
                style={{ border: `2px solid ${loai === o.v ? o.c : '#dde3ef'}`, borderRadius: 8, padding: '9px 6px', cursor: 'pointer', textAlign: 'center', background: loai === o.v ? o.bg : '#fff', transition: 'all .12s' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: loai === o.v ? o.c : '#374151' }}>{o.l}</div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{o.sub}</div>
              </button>
            ))}
          </div>

          {!defaultCustomer && (
            <div>
              {label('Khách hàng', true)}
              <select value={form.customer} onChange={e => set('customer', e.target.value)} style={inputStyle}>
                <option value="">— Chọn KH —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
              </select>
            </div>
          )}

          <div>
            {label('Dịch vụ / Sản phẩm')}
            <select value={form.service_id} onChange={e => {
              const svc = services.find(s => String(s.id) === e.target.value)
              set('service_id', e.target.value)
              if (svc) { set('service_name', svc.name); set('amount', String(svc.unit_price)) }
            }} style={inputStyle}>
              <option value="">— Chọn —</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Số tiền (₫)', true)}
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              {label('Thanh toán ngay (₫)')}
              <input type="number" value={form.paid} onChange={e => set('paid', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Tạo HĐ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
