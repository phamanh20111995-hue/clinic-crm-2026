import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { createShift } from '../../../api/ketoan'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const CA_OPTIONS = [
  { v: 'sang', l: '☀️ Sáng 08:00–12:00' },
  { v: 'chieu', l: '🌤 Chiều 12:00–17:00' },
  { v: 'toi', l: '🌙 Tối 17:00–20:00' },
  { v: 'full', l: '📅 Full 08:00–17:00' },
]

export default function ThemCaModal({ onClose, onDone, staffList = [] }) {
  const today = new Date().toISOString().slice(0, 10)
  const nextWeek = new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10)
  const [form, setForm] = useState({ user_id: '', shift: 'sang', date_from: today, date_to: nextWeek })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSave = async () => {
    if (!form.user_id) { toast.error('Chọn nhân viên'); return }
    setSaving(true)
    try {
      await createShift(form)
      toast.success('Đã thêm ca làm việc')
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi thêm ca')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Thêm ca làm việc</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nhân viên</label>
              <select value={form.user_id} onChange={e => set('user_id', e.target.value)} style={inputStyle}>
                <option value="">— Chọn NV —</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.display_name ?? s.email}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ca làm việc</label>
              <select value={form.shift} onChange={e => set('shift', e.target.value)} style={inputStyle}>
                {CA_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Từ ngày</label>
              <input type="date" value={form.date_from} onChange={e => set('date_from', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Đến ngày</label>
              <input type="date" value={form.date_to} onChange={e => set('date_to', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#0369a1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Lưu ca'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
