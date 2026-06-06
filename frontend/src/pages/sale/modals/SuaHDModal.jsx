import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { updateContract, submitContract } from '../../../api/sale'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const LOAI_DV = [
  { v: 'tham_my', l: 'Thẩm mỹ' },
  { v: 'benh_ly', l: 'Bệnh lý' },
]

export default function SuaHDModal({ onClose, onDone, contract }) {
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

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Nhập số tiền hợp lệ'); return }
    setSaving(true)
    try {
      const amt = Number(form.amount)
      await updateContract(contract.id, {
        final_amount: amt,
        total_amount: amt,
        notes: form.notes,
        loai_dv: form.loai_dv,
      })
      await submitContract(contract.id)
      toast.success('Đã sửa và gửi duyệt lại')
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi cập nhật HĐ')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }
  const label = (txt, req) => <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{txt}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Sửa HĐ bị từ chối — {contract?.contract_no}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contract?.reject_reason && (
            <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 12, color: '#991b1b' }}>
              <b>KT từ chối:</b> "{contract.reject_reason}"
            </div>
          )}

          <div>
            {label('Loại DV', true)}
            <div style={{ display: 'flex', gap: 8 }}>
              {LOAI_DV.map(o => (
                <button key={o.v} onClick={() => set('loai_dv', o.v)}
                  style={{ flex: 1, padding: '8px', border: `2px solid ${form.loai_dv === o.v ? '#15803d' : '#dde3ef'}`, borderRadius: 7, cursor: 'pointer', background: form.loai_dv === o.v ? '#f0fdf4' : '#fff', fontSize: 13, fontWeight: form.loai_dv === o.v ? 700 : 400, color: form.loai_dv === o.v ? '#15803d' : '#374151' }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            {label('Số tiền (₫)', true)}
            <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0" style={inputStyle} />
          </div>

          <div>
            {label('Ghi chú cho KT')}
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Giải thích lý do sửa đổi..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Sửa + Gửi duyệt lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
