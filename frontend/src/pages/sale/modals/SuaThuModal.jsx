import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { editPayment } from '../../../api/payments'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const num = v => Number(v || 0)
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

export default function SuaThuModal({ onClose, onDone, payment }) {
  const init = v => (Number(v || 0) > 0 ? String(Number(v)) : '')
  const [cash, setCash] = useState(init(payment?.cash_amount))
  const [transfer, setTransfer] = useState(init(payment?.transfer_amount))
  const [receivedAt, setReceivedAt] = useState(payment?.received_at || todayStr())
  const [note, setNote] = useState(payment?.note || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const total = num(cash) + num(transfer)

  const handleSave = async () => {
    if (total <= 0) { toast.error('Nhập số tiền thu'); return }
    setSaving(true)
    try {
      await editPayment(payment.id, { cash_amount: num(cash), transfer_amount: num(transfer), received_at: receivedAt, note })
      toast.success('Đã sửa — chờ Kế toán xác nhận lại')
      onDone?.(); onClose()
    } catch (e) {
      toast.error(e.response?.data?.detail ?? 'Lỗi sửa lần thu')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }
  const label = txt => <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{txt}</label>

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Sửa lần thu — {payment?.contract_no}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {payment?.verify_note && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 700, marginBottom: 2 }}>Kế toán báo lệch</div>
              <div style={{ fontSize: 12, color: '#991b1b' }}>{payment.verify_note}</div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Tiền mặt (đ)')}
              <input type="number" value={cash} onChange={e => setCash(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              {label('Chuyển khoản (đ)')}
              <input type="number" value={transfer} onChange={e => setTransfer(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Ngày thu')}
              <input type="date" value={receivedAt} onChange={e => setReceivedAt(e.target.value)} style={inputStyle} />
            </div>
            <div>
              {label('Tổng thu')}
              <div style={{ padding: '7px 10px', fontSize: 16, fontWeight: 800, color: '#15803d' }}>{fmt(total)}đ</div>
            </div>
          </div>
          <div>
            {label('Ghi chú')}
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Tùy chọn..." style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Lưu & gửi lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
