import { useState, useEffect } from 'react'
import { IconX, IconArrowBack } from '@tabler/icons-react'
import { rejectContract } from '../../../api/ketoan'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const LY_DO = [
  'Sai loại DV (Thẩm mỹ/Bệnh lý)',
  'Số tiền không khớp HĐ',
  'Thiếu thông tin KH',
  'Lý do khác',
]

export default function TuChoiModal({ onClose, onDone, contract }) {
  const [ly_do, setLyDo] = useState(LY_DO[0])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleReject = async () => {
    setSaving(true)
    try {
      await rejectContract(contract.id, { reject_reason: ly_do, notes })
      toast.success(`Đã từ chối HĐ ${contract.contract_no} — Sale nhận thông báo`)
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi từ chối HĐ')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Từ chối HĐ — {contract?.contract_no}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Lý do từ chối <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={ly_do} onChange={e => setLyDo(e.target.value)} style={inputStyle}>
              {LY_DO.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ghi chú chi tiết</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              placeholder="Mô tả cụ thể để Sale biết cần sửa gì..."
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleReject} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconArrowBack size={14} /> {saving ? '...' : 'Từ chối + Gửi lại Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
