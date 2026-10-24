import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { createProduct } from '../../../api/inventory'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

export default function ThemSanPhamModal({ onClose, onDone }) {
  const [form, setForm] = useState({ name: '', sku: '', unit: 'Cái', category: 'my_pham', sell_price: '', min_stock: '', is_prescription: false })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => {
    const nf = { ...f, [k]: v }
    if (k === 'category') nf.is_prescription = v === 'thuoc_ke_don'
    return nf
  })

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nhập tên sản phẩm'); return }
    setSaving(true)
    try {
      await createProduct({
        name: form.name.trim(),
        sku: form.sku.trim(),
        unit: form.unit.trim() || 'Cái',
        category: form.category,
        sell_price: Number(form.sell_price || 0),
        min_stock: Number(form.min_stock || 0),
        is_prescription: form.is_prescription,
      })
      toast.success('Đã thêm sản phẩm')
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi thêm sản phẩm')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }
  const label = txt => <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{txt}</label>

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Thêm sản phẩm</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            {label('Tên sản phẩm')}
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Kem chống nắng ABC" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Mã SKU')}
              <input value={form.sku} onChange={e => set('sku', e.target.value)} placeholder="Tùy chọn" style={inputStyle} />
            </div>
            <div>
              {label('Đơn vị')}
              <input value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="Cái / Hộp / Tuýp" style={inputStyle} />
            </div>
          </div>
          <div>
            {label('Loại')}
            <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
              <option value="my_pham">Mỹ phẩm</option>
              <option value="thuoc_ke_don">Thuốc kê đơn</option>
              <option value="thuoc_khong_ke_don">Thuốc không kê đơn</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Giá bán (đ)')}
              <input type="number" value={form.sell_price} onChange={e => set('sell_price', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              {label('Định mức cảnh báo')}
              <input type="number" value={form.min_stock} onChange={e => set('min_stock', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_prescription} onChange={e => set('is_prescription', e.target.checked)} /> Thuốc kê đơn
          </label>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Giá vốn & tồn kho sẽ tự tính khi Nhập kho (bình quân gia quyền).</div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#b45309', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Lưu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
