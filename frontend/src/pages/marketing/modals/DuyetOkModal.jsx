import { useState } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function DuyetOkModal({ task, onClose, onDone }) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const handle = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    toast.success('Đã duyệt! → Chuyển sang Đã duyệt · Chờ đăng')
    setSaving(false)
    onDone?.(); onClose()
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Xác nhận duyệt nội dung</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', fontSize: 11, lineHeight: 1.8 }}>
            <b>{task?.title ?? 'Nội dung'}</b><br />
            → Nội dung + visual đã được kiểm tra<br />
            → Task chuyển sang <b>Đã duyệt · Chờ đăng</b><br />
            → Người thực hiện nhận thông báo
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Comment cho người thực hiện (tuỳ chọn)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Tốt! Nhớ thêm hashtag khi đăng..."
              style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handle} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#16a34a', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Duyệt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
