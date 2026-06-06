import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { updateContract, approveContract } from '../../../api/ketoan'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function SuaTruocModal({ onClose, onDone, contract }) {
  const [form, setForm] = useState({
    loai_dv: contract?.loai_dv ?? 'tham_my',
    amount: contract?.final_amount ?? '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSaveApprove = async () => {
    const amt = Number(form.amount)
    if (!amt || amt <= 0) { toast.error('Nhập số tiền hợp lệ'); return }
    setSaving(true)
    try {
      await updateContract(contract.id, { loai_dv: form.loai_dv, final_amount: amt, total_amount: amt })
      await approveContract(contract.id, { notes: form.notes })
      toast.success(`Đã sửa và duyệt HĐ ${contract.contract_no}`)
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi xử lý HĐ')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Sửa nhỏ trước khi duyệt</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, fontSize: 11, color: '#92400e' }}>
            ℹ️ KT sửa nhỏ (số tiền, loại DV) rồi duyệt luôn — không cần trả về Sale.
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại DV</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'tham_my', l: 'Thẩm mỹ — VAT 10%' }, { v: 'benh_ly', l: 'Bệnh lý — Miễn VAT' }].map(o => (
                <button key={o.v} onClick={() => set('loai_dv', o.v)}
                  style={{ flex: 1, padding: '7px', border: `2px solid ${form.loai_dv === o.v ? '#b45309' : '#dde3ef'}`, borderRadius: 7, cursor: 'pointer', background: form.loai_dv === o.v ? '#fef9f0' : '#fff', fontSize: 12, fontWeight: form.loai_dv === o.v ? 700 : 400, color: form.loai_dv === o.v ? '#b45309' : '#374151' }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Số tiền xác nhận (đ)</label>
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ghi chú điều chỉnh</label>
            <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="KT điều chỉnh vì..." style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSaveApprove} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Lưu & Duyệt luôn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
