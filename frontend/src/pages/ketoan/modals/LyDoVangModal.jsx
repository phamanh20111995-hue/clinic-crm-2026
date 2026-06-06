import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function LyDoVangModal({ onClose, onDone, record }) {
  const [form, setForm] = useState({ ly_do: 'Ốm đau', xu_ly: 'Trừ phép năm' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 400))
      toast.success('Đã xử lý vắng mặt')
      onDone?.(); onClose()
    } catch { toast.error('Lỗi') } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Xử lý vắng mặt — {record?.user_name}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {record && (
            <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, fontSize: 11, color: '#991b1b' }}>
              Vắng ca {record.shift_name} {record.date} · Chưa liên hệ được
            </div>
          )}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Lý do</label>
            <select value={form.ly_do} onChange={e => setForm(f => ({ ...f, ly_do: e.target.value }))} style={inputStyle}>
              {['Ốm đau', 'Việc gia đình', 'Không liên hệ được', 'Khác'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Xử lý</label>
            <select value={form.xu_ly} onChange={e => setForm(f => ({ ...f, xu_ly: e.target.value }))} style={inputStyle}>
              {['Trừ phép năm', 'Nghỉ không lương + trừ vi phạm', 'Chấp nhận đặc biệt'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#0369a1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
