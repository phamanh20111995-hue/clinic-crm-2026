import { useState } from 'react'
import { IconX, IconArrowBack } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const REASONS = [
  'Tone chưa đúng brand — cần nhẹ nhàng hơn',
  'Caption quá dài — cắt ngắn lại',
  'Visual chưa đúng brand color',
  'Nội dung y tế cần BS kiểm tra lại',
  'CTA chưa rõ — cần ghi rõ hành động',
  'Lý do khác',
]

export default function DuyetRejectModal({ task, onClose, onDone }) {
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    if (!reason) { toast.error('Chọn lý do trả lại'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    toast.success('Đã trả lại → Người thực hiện nhận thông báo')
    setSaving(false)
    onDone?.(); onClose()
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Trả lại để chỉnh sửa</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Lý do trả lại <span style={{ color: '#dc2626' }}>*</span></label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
              <option value="">-- Chọn lý do --</option>
              {REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Ghi chú chi tiết</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
              placeholder="Hướng dẫn cụ thể để người thực hiện biết cần sửa gì..."
              style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handle} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconArrowBack size={14} /> {saving ? '...' : 'Trả lại'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
