import { useState, useEffect } from 'react'
import { IconX, IconCheck, IconBuildingBank } from '@tabler/icons-react'
import { updateContract } from '../../../api/ketoan'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function XacNhanCKModal({ onClose, onDone, contract }) {
  const [form, setForm] = useState({
    so_tien: contract?.con_no ?? '',
    ngay: new Date().toISOString().slice(0, 10),
    ma_gd: '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleConfirm = async () => {
    const amt = Number(form.so_tien)
    if (!amt || amt <= 0) { toast.error('Nhập số tiền'); return }
    setSaving(true)
    try {
      const newPaid = Number(contract?.paid_amount ?? 0) + amt
      const final = Number(contract?.final_amount ?? 0)
      await updateContract(contract.id, {
        paid_amount: newPaid,
        payment_status: newPaid >= final ? 'received' : 'partial',
        transaction_ref: form.ma_gd,
        payment_date: form.ngay,
      })
      toast.success('Đã xác nhận nhận CK — Công nợ cập nhật')
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi xác nhận CK')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>
            <IconBuildingBank size={14} style={{ marginRight: 6, color: '#1e40af', verticalAlign: 'middle' }} />
            Xác nhận nhận CK — {contract?.customer_name}
          </p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 11, lineHeight: 1.8 }}>
            <b>Số tiền còn nợ:</b> {fmt(contract?.con_no)}đ<br />
            <b>HĐ:</b> {contract?.contract_no} · Sale: {contract?.created_by_name}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Số tiền đã nhận (đ)</label>
              <input type="number" value={form.so_tien} onChange={e => set('so_tien', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ngày nhận</label>
              <input type="date" value={form.ngay} onChange={e => set('ngay', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Mã giao dịch ngân hàng</label>
            <input value={form.ma_gd} onChange={e => set('ma_gd', e.target.value)} placeholder="VCB2405xxxxxx..." style={inputStyle} />
          </div>

          <div style={{ fontSize: 11, color: '#64748b' }}>
            ℹ️ Sau khi xác nhận: Công nợ {contract?.customer_name} cập nhật · Sale nhận thông báo
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleConfirm} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#1e40af', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Xác nhận đã nhận CK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
