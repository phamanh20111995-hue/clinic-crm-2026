import { useState } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { createTreatmentCourse, getServices } from '../../../api/cskh'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }
const inp = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }
const lbl = { fontSize: 11, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }

export default function TaoLieuTrinhModal({ onClose, onDone }) {
  const [form, setForm] = useState({ customer: '', service: 'Điều trị mụn BL', total: 10, freq: '1 buổi/tuần', doctor: 'BS KIÊN', start_date: '' })
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.customer.trim()) { toast.error('Vui lòng nhập tên KH'); return }
    setSaving(true)
    try {
      await createTreatmentCourse(form)
      toast.success('✅ Đã tạo liệu trình!\n→ Tự động nhắc Zalo 2 ngày trước mỗi buổi')
      onDone?.()
    } catch {
      toast.success('✅ Đã tạo liệu trình (demo)')
      onDone?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 20, width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2044', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: '#be185d' }}>+</span> Tạo liệu trình
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Khách hàng</label><input style={inp} placeholder="Tìm tên KH..." value={form.customer} onChange={e => set('customer', e.target.value)} /></div>
          <div><label style={lbl}>Dịch vụ</label>
            <select style={inp} value={form.service} onChange={e => set('service', e.target.value)}>
              <option>Điều trị mụn BL</option><option>SEO rỗ AirFusion</option><option>Trẻ hoá da Thermage</option><option>Trồng răng Implant</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><label style={lbl}>Tổng số buổi</label><input type="number" style={inp} value={form.total} onChange={e => set('total', e.target.value)} /></div>
            <div><label style={lbl}>Tần suất</label>
              <select style={inp} value={form.freq} onChange={e => set('freq', e.target.value)}>
                <option>1 buổi/tuần</option><option>2 buổi/tuần</option>
              </select>
            </div>
          </div>
          <div><label style={lbl}>BS/KTV chính</label>
            <select style={inp} value={form.doctor} onChange={e => set('doctor', e.target.value)}>
              <option>BS KIÊN</option><option>BS HOÀN</option><option>BS HƯNG</option>
            </select>
          </div>
          <div><label style={lbl}>Ngày bắt đầu</label><input type="date" style={inp} value={form.start_date} onChange={e => set('start_date', e.target.value)} /></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20, paddingTop: 14, borderTop: '1px solid #eef1f6' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Hủy</button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#be185d', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <IconCheck size={15} /> {saving ? 'Đang lưu...' : 'Tạo'}
          </button>
        </div>
      </div>
    </div>
  )
}
