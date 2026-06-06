import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { updateContract } from '../../../api/sale'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function ThuNoModal({ onClose, onDone, contract }) {
  const con = Number(contract?.con_no ?? (contract?.final_amount ?? 0) - (contract?.paid_amount ?? 0))
  const [form, setForm] = useState({ amount: '', httt: 'ck', ngay: new Date().toISOString().slice(0, 10), ma_gd: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSave = async () => {
    const amt = Number(form.amount)
    if (!amt || amt <= 0) { toast.error('Nhập số tiền thu'); return }
    if (amt > con) { toast.error(`Số thu vượt quá số nợ (${con.toLocaleString('vi-VN')}đ)`); return }
    setSaving(true)
    try {
      const newPaid = (Number(contract?.paid_amount ?? 0)) + amt
      const final = Number(contract?.final_amount ?? 0)
      await updateContract(contract.id, {
        paid_amount: newPaid,
        payment_status: newPaid >= final ? 'received' : 'partial',
        payment_method: form.httt,
        payment_date: form.ngay,
        transaction_ref: form.ma_gd,
      })
      toast.success(`Đã thu ${amt.toLocaleString('vi-VN')}đ`)
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi thu nợ')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }
  const label = (txt, req) => <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{txt}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Thu nợ — {contract?.contract_no}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600, marginBottom: 2 }}>Còn nợ</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{con.toLocaleString('vi-VN')}đ</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{contract?.customer_name}</div>
          </div>

          <div>
            {label('Số tiền thu (₫)', true)}
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" style={inputStyle} />
            {form.amount && Number(form.amount) > 0 && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                Còn lại sau thu: {Math.max(0, con - Number(form.amount)).toLocaleString('vi-VN')}đ
              </div>
            )}
          </div>

          <div>
            {label('Hình thức', true)}
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ v: 'ck', l: 'Chuyển khoản' }, { v: 'tien_mat', l: 'Tiền mặt' }].map(o => (
                <button key={o.v} onClick={() => set('httt', o.v)}
                  style={{ flex: 1, padding: '7px', border: `2px solid ${form.httt === o.v ? '#15803d' : '#dde3ef'}`, borderRadius: 7, cursor: 'pointer', background: form.httt === o.v ? '#f0fdf4' : '#fff', fontSize: 12, fontWeight: form.httt === o.v ? 700 : 400, color: form.httt === o.v ? '#15803d' : '#374151' }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {form.httt === 'ck' && (
            <div>
              {label('Mã giao dịch')}
              <input value={form.ma_gd} onChange={e => set('ma_gd', e.target.value)} placeholder="FT2506..." style={inputStyle} />
            </div>
          )}

          <div>
            {label('Ngày thu', true)}
            <input type="date" value={form.ngay} onChange={e => set('ngay', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Xác nhận thu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
