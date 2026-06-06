import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { addInventory } from '../../../api/ketoan'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function NhapKhoModal({ onClose, onDone, vatTuList = [] }) {
  const [form, setForm] = useState({ vat_tu_id: '', so_luong: '', gia_nhap: '', ncc: '', ngay: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSave = async () => {
    if (!form.so_luong || Number(form.so_luong) <= 0) { toast.error('Nhập số lượng'); return }
    setSaving(true)
    try {
      await addInventory({ ...form, so_luong: Number(form.so_luong), gia_nhap: Number(form.gia_nhap) })
      toast.success('Đã nhập kho')
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi nhập kho')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }
  const label = txt => <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{txt}</label>

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Nhập kho</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            {label('Vật tư')}
            <select value={form.vat_tu_id} onChange={e => set('vat_tu_id', e.target.value)} style={inputStyle}>
              <option value="">— Chọn vật tư —</option>
              {vatTuList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Số lượng nhập')}
              <input type="number" value={form.so_luong} onChange={e => set('so_luong', e.target.value)} placeholder="10" style={inputStyle} />
            </div>
            <div>
              {label('Giá nhập/ĐV (đ)')}
              <input type="number" value={form.gia_nhap} onChange={e => set('gia_nhap', e.target.value)} placeholder="1200000" style={inputStyle} />
            </div>
          </div>

          <div>
            {label('Nhà cung cấp')}
            <input value={form.ncc} onChange={e => set('ncc', e.target.value)} placeholder="Tên NCC..." style={inputStyle} />
          </div>

          <div>
            {label('Ngày nhập')}
            <input type="date" value={form.ngay} onChange={e => set('ngay', e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#b45309', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Nhập kho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
