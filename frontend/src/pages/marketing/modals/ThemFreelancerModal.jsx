import { useState } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function ThemFreelancerModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', specialty: 'Quay phim · Dựng phim', fee: '', payment: 'Chuyển khoản sau khi xong', portfolio: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handle = async () => {
    if (!form.name.trim()) { toast.error('Nhập họ tên'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 300))
    toast.success('Đã thêm freelancer · Chi phí tự ghi vào khoản MKT khi hoàn thành task')
    setSaving(false)
    onDone?.(); onClose()
  }

  const inp = { border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Thêm freelancer</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Họ tên <span style={{ color: '#dc2626' }}>*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nguyễn Văn A" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>SĐT / Zalo</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0901 234 567" style={inp} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@gmail.com" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Chuyên môn</label>
            <select value={form.specialty} onChange={e => set('specialty', e.target.value)} style={inp}>
              {['Quay phim · Dựng phim', 'Thiết kế đồ họa', 'Chụp ảnh · Retouch', 'Copywriting', 'Voiceover', 'Social media manager'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Fee thường (đ/task)</label>
              <input type="number" value={form.fee} onChange={e => set('fee', e.target.value)} placeholder="3500000" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Hình thức thanh toán</label>
              <select value={form.payment} onChange={e => set('payment', e.target.value)} style={inp}>
                <option>Chuyển khoản sau khi xong</option>
                <option>50% trước 50% sau</option>
                <option>Hàng tháng</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Link portfolio</label>
            <input value={form.portfolio} onChange={e => set('portfolio', e.target.value)} placeholder="behance.net/... hoặc drive.google.com/..." style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handle} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#0284c7', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Thêm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
