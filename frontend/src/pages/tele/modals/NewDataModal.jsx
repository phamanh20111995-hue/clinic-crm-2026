import { useState } from 'react'
import { IconX } from '@tabler/icons-react'
import { createCustomer, checkPhone, getTeleUsers } from '../../../api/tele'
import toast from 'react-hot-toast'
import { useEffect } from 'react'

const SOURCES = [
  { value: 'facebook',    label: 'Facebook' },
  { value: 'tiktok',      label: 'TikTok' },
  { value: 'zalo',        label: 'Zalo' },
  { value: 'google',      label: 'Google / Maps' },
  { value: 'instagram',   label: 'Instagram' },
  { value: 'gioi_thieu',  label: 'Giới thiệu' },
  { value: 'walkin',      label: 'Walk-in' },
  { value: 'khac',        label: 'Khác' },
]

const labelStyle = { fontSize: 12, color: '#374151', display: 'block', marginBottom: 4, fontWeight: 500 }
const inputStyle = {
  width: '100%', border: '1px solid #dde3ef', borderRadius: 7,
  padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', outline: 'none',
}
const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, padding: 16,
}

export default function NewDataModal({ onClose, onDone }) {
  const [form, setForm] = useState({
    full_name: '', phone: '', source: 'facebook',
    data_type: 'thuong', notes: '', tele: '',
    services_interest: '',
  })
  const [phoneCheck, setPhoneCheck] = useState(null)
  const [teleUsers, setTeleUsers]   = useState([])
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    getTeleUsers()
      .then(r => setTeleUsers(r.data?.results ?? r.data ?? []))
      .catch(() => {})
  }, [])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handlePhoneBlur = async () => {
    if (!form.phone || form.phone.length < 9) return
    try {
      const { data } = await checkPhone(form.phone)
      setPhoneCheck(data)
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { toast.error('Nhập họ tên khách hàng'); return }
    if (!form.phone.trim())     { toast.error('Nhập số điện thoại'); return }
    if (!form.source)           { toast.error('Chọn nguồn data'); return }
    if (phoneCheck?.exists)     { toast.error('Số điện thoại đã tồn tại trong hệ thống'); return }

    setSaving(true)
    try {
      await createCustomer({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        source: form.source,
        data_type: form.data_type,
        notes: form.notes,
        tele: form.tele || undefined,
      })
      toast.success('Đã tạo data mới!')
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.phone?.[0] ?? err.response?.data?.detail ?? 'Lỗi tạo data')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Nhập data mới</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <IconX size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Họ tên */}
          <div>
            <label style={labelStyle}>Họ tên *</label>
            <input placeholder="Nguyễn Thị A" value={form.full_name}
              onChange={e => set('full_name', e.target.value)} style={inputStyle} />
          </div>

          {/* SĐT */}
          <div>
            <label style={labelStyle}>Số điện thoại *</label>
            <input placeholder="0912345678" value={form.phone}
              onChange={e => { set('phone', e.target.value); setPhoneCheck(null) }}
              onBlur={handlePhoneBlur}
              style={{ ...inputStyle, borderColor: phoneCheck?.exists ? '#dc2626' : '#dde3ef' }} />
            {phoneCheck?.exists && (
              <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>
                ⚠ Số này đã tồn tại — {phoneCheck.customer?.full_name} ({phoneCheck.customer?.status_display})
              </p>
            )}
          </div>

          {/* Nguồn */}
          <div>
            <label style={labelStyle}>Nguồn *</label>
            <select value={form.source} onChange={e => set('source', e.target.value)} style={inputStyle}>
              {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {form.source === 'walkin' && (
              <p style={{ fontSize: 11, color: '#d97706', marginTop: 3 }}>
                Walk-in: khách đến trực tiếp. Nên tạo lịch hẹn ngay.
              </p>
            )}
          </div>

          {/* DV quan tâm */}
          <div>
            <label style={labelStyle}>Dịch vụ quan tâm</label>
            <input placeholder="Điều trị mụn, trắng da, tẩy trắng răng..." value={form.services_interest}
              onChange={e => set('services_interest', e.target.value)} style={inputStyle} />
          </div>

          {/* Phân loại */}
          <div>
            <label style={labelStyle}>Phân loại data</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { v: 'nong',   l: '🔥 Nóng',   c: '#dc2626' },
                { v: 'am',     l: '🌊 Âm',      c: '#2563eb' },
                { v: 'thuong', l: '⬜ Thường',  c: '#6b7280' },
              ].map(opt => (
                <label key={opt.v} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', fontSize: 13,
                  padding: '5px 12px', borderRadius: 7,
                  border: `1.5px solid ${form.data_type === opt.v ? opt.c : '#dde3ef'}`,
                  background: form.data_type === opt.v ? opt.c + '15' : '#fff',
                }}>
                  <input type="radio" name="data_type" value={opt.v}
                    checked={form.data_type === opt.v}
                    onChange={() => set('data_type', opt.v)}
                    style={{ accentColor: opt.c }} />
                  {opt.l}
                </label>
              ))}
            </div>
          </div>

          {/* Giao cho Tele */}
          <div>
            <label style={labelStyle}>Giao cho Tele</label>
            <select value={form.tele} onChange={e => set('tele', e.target.value)} style={inputStyle}>
              <option value="">— Chưa giao (Lead Tele chia sau) —</option>
              {teleUsers.map(u => (
                <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>
              ))}
            </select>
          </div>

          {/* Ghi chú */}
          <div>
            <label style={labelStyle}>Ghi chú</label>
            <textarea placeholder="Tình trạng da, yêu cầu đặc biệt, v.v..." value={form.notes}
              onChange={e => set('notes', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 68 }} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>
              Hủy
            </button>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#6d28d9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Đang lưu...' : '+ Tạo data'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
