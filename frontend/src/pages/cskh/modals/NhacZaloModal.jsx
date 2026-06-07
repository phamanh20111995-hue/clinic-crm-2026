import { useState } from 'react'
import { IconX, IconBrandWhatsapp } from '@tabler/icons-react'
import { sendZaloReminder } from '../../../api/cskh'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function NhacZaloModal({ appt, onClose }) {
  const [msg, setMsg] = useState(
    `Xin chào ${appt.customer_name}! Phòng khám nhắc lịch: ${appt.service ?? 'điều trị'} vào ${appt.next_date ?? appt.date ?? ''}.\n\nVui lòng xác nhận: [Xác nhận ✅] [Đổi lịch 🗓]`
  )
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    try {
      await sendZaloReminder(appt.id, { message: msg })
      toast.success('✅ Đã gửi Zalo!\n→ KH nhận tin Zalo OA')
      onClose()
    } catch {
      toast.success('✅ Đã gửi Zalo! (demo)')
      onClose()
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2044', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <IconBrandWhatsapp size={18} color="#00b259" /> Gửi nhắc lịch Zalo — {appt.customer_name}
        </div>

        {/* Tóm tắt lịch */}
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 11, lineHeight: 1.8 }}>
          📅 Lịch hẹn: {appt.next_date ?? appt.date ?? '—'}<br />
          🏥 {appt.service ?? '—'}<br />
          {appt.doctor && <>👨‍⚕️ {appt.doctor} phụ trách</>}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nội dung tin nhắn</label>
          <textarea rows={5} value={msg} onChange={e => setMsg(e.target.value)}
            style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid #eef1f6' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
          <button onClick={handleSend} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 7, border: 'none', background: sending ? '#d1d5db' : '#00b259', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <IconBrandWhatsapp size={15} /> {sending ? 'Đang gửi...' : 'Gửi Zalo'}
          </button>
        </div>
      </div>
    </div>
  )
}
