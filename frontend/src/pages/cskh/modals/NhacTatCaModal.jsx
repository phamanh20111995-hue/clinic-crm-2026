import { useState } from 'react'
import { IconBrandWhatsapp, IconSend } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function NhacTatCaModal({ count, onClose }) {
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    setSending(true)
    setTimeout(() => {
      toast.success(`✅ Đã gửi Zalo cho ${count} KH!\n→ Chờ phản hồi xác nhận`)
      onClose()
    }, 1000)
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: '100%', maxWidth: 400 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2044', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <IconBrandWhatsapp size={18} color="#00b259" /> Gửi Zalo nhắc lịch — tất cả hôm nay
        </div>
        <p style={{ fontSize: 12, color: '#374151', marginBottom: 16, lineHeight: 1.6 }}>
          Sẽ gửi Zalo cho <strong>{count} KH</strong> chưa nhắc hôm nay. KH bấm xác nhận → hệ thống tự cập nhật.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid #eef1f6' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
          <button onClick={handleSend} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 7, border: 'none', background: sending ? '#d1d5db' : '#00b259', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <IconSend size={15} /> {sending ? 'Đang gửi...' : `Gửi tất cả (${count})`}
          </button>
        </div>
      </div>
    </div>
  )
}
