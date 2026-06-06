import { useState, useEffect } from 'react'
import { IconX, IconBrandWhatsapp } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function GuiLinkZaloModal({ onClose, record }) {
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSend = async () => {
    setSending(true)
    try {
      // Placeholder — API gửi Zalo khi có integration
      await new Promise(r => setTimeout(r, 600))
      toast.success(`Đã gửi Zalo cho ${record?.user_name}!`)
      onClose()
    } catch {
      toast.error('Lỗi gửi Zalo')
    } finally { setSending(false) }
  }

  const msg = `📋 XÁC NHẬN TUA ${record?.month_label ?? ''}

${record?.user_name ?? 'BS/KTV'} thân mến,
Tổng buổi: ${record?.sessions ?? 0} · Tổng tua: ${fmt(record?.total_tua)}đ

🔗 Xem và xác nhận tại:
https://pkdalieu.vn/tua/${record?.token ?? 'xxxxxx'}

Link hết hạn sau 7 ngày.`

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Gửi link xác nhận tua — {record?.user_name}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, lineHeight: 1.8 }}>
            <b>{record?.user_name}</b> · {record?.user_code} · {record?.month_label}<br />
            {record?.sessions ?? 0} buổi · <b style={{ color: '#5b21b6' }}>{fmt(record?.total_tua)}đ</b>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #dde3ef', borderRadius: 7, padding: 10, fontSize: 11, whiteSpace: 'pre-line', color: '#374151', lineHeight: 1.6 }}>
            {msg}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSend} disabled={sending}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: sending ? '#d1d5db' : '#00b259', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconBrandWhatsapp size={14} /> {sending ? '...' : 'Gửi Zalo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
