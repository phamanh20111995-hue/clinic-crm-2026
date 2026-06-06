import { useState, useEffect } from 'react'
import { IconX } from '@tabler/icons-react'
import { createWalkIn, getRooms, getServices, checkPhone } from '../../../api/letan'
import toast from 'react-hot-toast'

const ACCENT = '#b45309'
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }
const labelStyle = { fontSize: 12, color: '#374151', display: 'block', marginBottom: 4, fontWeight: 500 }
const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', outline: 'none' }

export default function WalkInModal({ onClose, onDone }) {
  const [form, setForm] = useState({ full_name: '', phone: '', gender: '', service: '', room: '', notes: '' })
  const [rooms, setRooms]       = useState([])
  const [services, setServices] = useState([])
  const [phoneCheck, setPhoneCheck] = useState(null)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    getRooms().then(r => setRooms(r.data?.results ?? r.data ?? [])).catch(() => {})
    getServices().then(r => setServices(r.data?.results ?? r.data ?? [])).catch(() => {})
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handlePhoneBlur = async () => {
    if (!form.phone || form.phone.length < 9) return
    try {
      const { data } = await checkPhone(form.phone)
      setPhoneCheck(data)
      if (data.exists) set('full_name', data.customer?.full_name ?? form.full_name)
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error('Nhập tên khách hàng'); return }
    if (!form.phone.trim()) { toast.error('Nhập số điện thoại'); return }
    setSaving(true)
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        gender: form.gender || undefined,
        service: form.service || undefined,
        room: form.room || undefined,
        notes: form.notes,
      }
      const { data } = await createWalkIn(payload)
      toast.success(`Walk-in: ${data.customer_name} — ${data.customer_created ? 'KH mới' : 'KH cũ'}`)
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? err.response?.data?.phone?.[0] ?? 'Lỗi tạo walk-in')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>KH Walk-in</p>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Khách đến trực tiếp — tạo lịch hẹn ngay</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={20} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* SĐT — check trước */}
          <div>
            <label style={labelStyle}>Số điện thoại *</label>
            <input placeholder="0912345678" value={form.phone}
              onChange={e => { set('phone', e.target.value); setPhoneCheck(null) }}
              onBlur={handlePhoneBlur}
              style={{ ...inputStyle, borderColor: phoneCheck?.exists ? ACCENT : '#dde3ef' }} />
            {phoneCheck?.exists && (
              <div style={{ marginTop: 4, padding: '6px 10px', background: '#fff7ed', borderRadius: 6, border: `1px solid ${ACCENT}30`, fontSize: 11 }}>
                ✅ Tìm thấy: <strong>{phoneCheck.customer?.full_name}</strong> · {phoneCheck.customer?.status_display}
              </div>
            )}
            {phoneCheck?.exists === false && (
              <p style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>KH mới — sẽ tạo hồ sơ</p>
            )}
          </div>

          {/* Họ tên */}
          <div>
            <label style={labelStyle}>Họ tên *</label>
            <input placeholder="Nguyễn Thị A" value={form.full_name}
              onChange={e => set('full_name', e.target.value)} style={inputStyle} />
          </div>

          {/* Giới tính */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[{ v: 'M', l: 'Nam' }, { v: 'F', l: 'Nữ' }, { v: '', l: 'Không xác định' }].map(o => (
              <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13 }}>
                <input type="radio" name="gender" value={o.v}
                  checked={form.gender === o.v}
                  onChange={() => set('gender', o.v)}
                  style={{ accentColor: ACCENT }} />
                {o.l}
              </label>
            ))}
          </div>

          {/* DV + Phòng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Dịch vụ</label>
              <select value={form.service} onChange={e => set('service', e.target.value)} style={inputStyle}>
                <option value="">— Chọn dịch vụ —</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Phòng (tuỳ chọn)</label>
              <select value={form.room} onChange={e => set('room', e.target.value)} style={inputStyle}>
                <option value="">— Chưa phân —</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label style={labelStyle}>Ghi chú</label>
            <textarea placeholder="Yêu cầu đặc biệt, tình trạng..." value={form.notes}
              onChange={e => set('notes', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : ACCENT, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Đang tạo...' : '✅ Tạo Walk-in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
