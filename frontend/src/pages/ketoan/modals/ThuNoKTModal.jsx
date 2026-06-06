import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { updateContract } from '../../../api/ketoan'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function ThuNoKTModal({ onClose, onDone, contract }) {
  const con = Number(contract?.final_amount ?? 0) - Number(contract?.paid_amount ?? 0)
  const [form, setForm] = useState({ amount: '', httt: 'ck', ngay: new Date().toISOString().slice(0, 10) })
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
    if (amt > con) { toast.error(`Vượt quá số nợ (${fmt(con)}đ)`); return }
    setSaving(true)
    try {
      const newPaid = Number(contract?.paid_amount ?? 0) + amt
      const final = Number(contract?.final_amount ?? 0)
      await updateContract(contract.id, {
        paid_amount: newPaid,
        payment_status: newPaid >= final ? 'received' : 'partial',
        payment_method: form.httt,
        payment_date: form.ngay,
      })
      toast.success(`Đã thu ${fmt(amt)}đ — Công nợ cập nhật`)
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi ghi nhận thu nợ')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Ghi nhận thu nợ — {contract?.customer_name}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600 }}>Còn nợ</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{fmt(con)}đ</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Số tiền thu (đ)</label>
              <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Hình thức</label>
              <select value={form.httt} onChange={e => set('httt', e.target.value)} style={inputStyle}>
                <option value="ck">Chuyển khoản</option>
                <option value="tien_mat">Tiền mặt</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ngày thu</label>
            <input type="date" value={form.ngay} onChange={e => set('ngay', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Ghi nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
