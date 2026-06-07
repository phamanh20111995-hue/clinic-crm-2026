import { useState } from 'react'
import { IconStar, IconSend } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }
const inp = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }

export default function GuiFormModal({ onClose }) {
  const [target, setTarget] = useState('all')
  const [channel, setChannel] = useState('zalo')
  const [sending, setSending] = useState(false)

  const handleSend = () => {
    setSending(true)
    setTimeout(() => {
      toast.success('✅ Đã gửi form đánh giá!\n→ Kết quả tự tổng hợp khi KH điền')
      onClose()
    }, 800)
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: '100%', maxWidth: 420 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2044', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
          <IconStar size={18} color="#f59e0b" /> Gửi form đánh giá hài lòng
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Gửi cho</label>
            <select style={inp} value={target} onChange={e => setTarget(e.target.value)}>
              <option value="all">Tất cả KH hoàn thành LT T05 (8 KH)</option>
              <option value="single">Chọn từng KH</option>
            </select>
          </div>
          <div><label style={lbl}>Kênh</label>
            <select style={inp} value={channel} onChange={e => setChannel(e.target.value)}>
              <option value="zalo">Zalo OA (link form)</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 14, borderTop: '1px solid #eef1f6' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
          <button onClick={handleSend} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 7, border: 'none', background: sending ? '#d1d5db' : '#be185d', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <IconSend size={15} /> {sending ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  )
}
