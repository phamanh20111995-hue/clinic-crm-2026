import { useState } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { confirmTua } from '../../../api/letan'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }

export default function CheckOutModal({ appt, onClose, onDone }) {
  const [tua, setTua]         = useState(true)
  const [viaZalo, setViaZalo] = useState(false)
  const [notes, setNotes]     = useState('')
  const [saving, setSaving]   = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await confirmTua(appt.id, { via_zalo: viaZalo })
      toast.success(`${appt.customer_name} đã về${tua ? ' — tua đã ghi nhận' : ''}`)
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi xác nhận')
    } finally {
      setSaving(false)
    }
  }

  const now = new Date().toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>KH về — Xác nhận tua</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{appt.customer_name} · {now}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={20} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tóm tắt buổi */}
          <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #dde3ef', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#6b7280' }}>Dịch vụ</span>
              <span style={{ fontWeight: 600 }}>{appt.service_name ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#6b7280' }}>Phòng</span>
              <span style={{ fontWeight: 600 }}>{appt.room_name ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#6b7280' }}>BS / KTV</span>
              <span style={{ fontWeight: 600 }}>{[appt.doctor_name, appt.ktv_name].filter(Boolean).join(' / ') || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Giờ về</span>
              <span style={{ fontWeight: 600, color: ACCENT }}>{now}</span>
            </div>
          </div>

          {/* Xác nhận tua */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 12px', background: tua ? '#dcfce7' : '#f9fafb', borderRadius: 8, border: `1px solid ${tua ? '#a7f3d0' : '#dde3ef'}` }}>
            <input type="checkbox" checked={tua} onChange={e => setTua(e.target.checked)} style={{ accentColor: '#15803d', width: 16, height: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Xác nhận tua buổi điều trị</span>
          </label>

          {/* Gửi qua Zalo */}
          {tua && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={viaZalo} onChange={e => setViaZalo(e.target.checked)} style={{ accentColor: ACCENT }} />
              <span style={{ fontSize: 13, color: '#374151' }}>Gửi xác nhận tua qua Zalo cho BS/KTV</span>
            </label>
          )}

          {/* Ghi chú */}
          <div>
            <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4, fontWeight: 500 }}>Ghi chú buổi điều trị</label>
            <textarea placeholder="Kết quả buổi, lưu ý cho buổi sau..." value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <IconCheck size={15} stroke={2.5} />
              {saving ? 'Đang lưu...' : 'KH về & ghi tua'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
