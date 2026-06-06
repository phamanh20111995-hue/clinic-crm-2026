import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { approveLeave } from '../../../api/ketoan'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function NghiPhepKTModal({ onClose, onDone, leave }) {
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handle = async (approved) => {
    setSaving(true)
    try {
      if (leave?.id) await approveLeave(leave.id, { status: approved ? 'approved' : 'rejected' })
      else await new Promise(r => setTimeout(r, 400))
      toast.success(approved ? `Đã duyệt phép ${leave?.user_name ?? ''}` : 'Đã từ chối đơn phép')
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi xử lý')
    } finally { setSaving(false) }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Nghỉ phép — Duyệt đơn</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, lineHeight: 1.8 }}>
            <b>{leave?.user_name ?? 'Nhân viên'}</b> xin nghỉ {leave?.days ?? 0} ngày · {leave?.start_date} – {leave?.end_date}<br />
            Còn {leave?.remaining_days ?? '?'} ngày phép · Lý do: {leave?.reason ?? '—'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Đóng</button>
            <button onClick={() => handle(false)} disabled={saving}
              style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Từ chối
            </button>
            <button onClick={() => handle(true)} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 7, border: 'none', background: '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> Duyệt phép
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
