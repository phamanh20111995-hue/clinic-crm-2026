import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { getServices } from '../../../api/sale'
import toast from 'react-hot-toast'
import api from '../../../api/client'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const KET_QUA = [
  { v: 'dong_y', l: 'Đồng ý chốt', c: '#15803d', bg: '#f0fdf4' },
  { v: 'can_nhac', l: 'Cân nhắc', c: '#d97706', bg: '#fffbeb' },
  { v: 'tu_choi', l: 'Từ chối', c: '#dc2626', bg: '#fef2f2' },
]

export default function GhiTuVanModal({ onClose, onDone, customer }) {
  const [services, setServices] = useState([])
  const [form, setForm] = useState({ service_id: '', bac_si: '', ket_qua: 'can_nhac', noi_dung: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    getServices().then(r => setServices(r.data?.results ?? r.data ?? [])).catch(() => {})
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSave = async () => {
    if (!form.noi_dung.trim()) { toast.error('Nhập nội dung tư vấn'); return }
    setSaving(true)
    try {
      await api.post('/api/notes/', {
        customer: customer?.id,
        note_type: 'tu_van',
        service: form.service_id || null,
        doctor: form.bac_si,
        result: form.ket_qua,
        content: form.noi_dung,
      })
      toast.success('Đã ghi nhận tư vấn')
      if (form.ket_qua === 'dong_y') {
        toast('Khách đồng ý → Mở HĐ mới', { icon: '💚' })
      }
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi ghi tư vấn')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }
  const label = (txt, req) => <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{txt}{req && <span style={{ color: '#dc2626' }}> *</span>}</label>

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>
            Ghi tư vấn{customer ? ` — ${customer.customer_name ?? customer.full_name}` : ''}
          </p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            {label('Dịch vụ tư vấn')}
            <select value={form.service_id} onChange={e => set('service_id', e.target.value)} style={inputStyle}>
              <option value="">— Chọn DV —</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            {label('Bác sĩ / Chuyên viên tư vấn')}
            <input value={form.bac_si} onChange={e => set('bac_si', e.target.value)} placeholder="Tên BS/CV..." style={inputStyle} />
          </div>

          <div>
            {label('Kết quả tư vấn', true)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
              {KET_QUA.map(o => (
                <button key={o.v} onClick={() => set('ket_qua', o.v)}
                  style={{ border: `2px solid ${form.ket_qua === o.v ? o.c : '#dde3ef'}`, borderRadius: 8, padding: '8px 6px', cursor: 'pointer', textAlign: 'center', background: form.ket_qua === o.v ? o.bg : '#fff' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: form.ket_qua === o.v ? o.c : '#374151' }}>{o.l}</div>
                </button>
              ))}
            </div>
            {form.ket_qua === 'dong_y' && (
              <div style={{ marginTop: 6, padding: '6px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 11, color: '#15803d' }}>
                Sau khi lưu, bạn có thể tạo HĐ ngay cho khách.
              </div>
            )}
          </div>

          <div>
            {label('Nội dung tư vấn', true)}
            <textarea value={form.noi_dung} onChange={e => set('noi_dung', e.target.value)}
              placeholder="Đã tư vấn về... Khách phản hồi..." rows={4}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Lưu tư vấn'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
