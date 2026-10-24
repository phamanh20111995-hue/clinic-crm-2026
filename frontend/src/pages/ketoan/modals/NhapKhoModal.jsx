import { useState, useEffect } from 'react'
import { IconX, IconCheck, IconPlus, IconTrash } from '@tabler/icons-react'
import { getSuppliers, createSupplier, createStockEntry } from '../../../api/inventory'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function NhapKhoModal({ onClose, onDone, products = [] }) {
  const [suppliers, setSuppliers] = useState([])
  const [supplierId, setSupplierId] = useState('')
  const [newSupplier, setNewSupplier] = useState('')
  const [date, setDate] = useState(todayStr())
  const [paymentStatus, setPaymentStatus] = useState('debt')
  const [note, setNote] = useState('')
  const [lines, setLines] = useState([{ product: '', qty: '', cost_price: '', is_gift: false }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getSuppliers().then(r => setSuppliers(r.data?.results ?? r.data ?? [])).catch(() => {})
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const setLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l))
  const addLine = () => setLines(ls => [...ls, { product: '', qty: '', cost_price: '', is_gift: false }])
  const delLine = i => setLines(ls => ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls)

  const totalCost = lines.reduce((s, l) => s + (l.is_gift ? 0 : Number(l.qty || 0) * Number(l.cost_price || 0)), 0)

  const handleSave = async () => {
    const valid = lines.filter(l => l.product && Number(l.qty) > 0)
    if (valid.length === 0) { toast.error('Thêm ít nhất 1 dòng (chọn SP + số lượng)'); return }
    setSaving(true)
    try {
      let sid = supplierId
      if (!sid && newSupplier.trim()) {
        const r = await createSupplier({ name: newSupplier.trim() })
        sid = r.data.id
      }
      await createStockEntry({
        supplier: sid || null,
        date,
        payment_status: paymentStatus,
        note,
        lines: valid.map(l => ({
          product: Number(l.product),
          qty: Number(l.qty),
          cost_price: l.is_gift ? 0 : Number(l.cost_price || 0),
          is_gift: l.is_gift,
        })),
      })
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
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Nhập kho</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* NCC + ngày */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Nhà cung cấp')}
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={inputStyle}>
                <option value="">— Chọn NCC —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {!supplierId && (
                <input value={newSupplier} onChange={e => setNewSupplier(e.target.value)} placeholder="hoặc gõ tên NCC mới..." style={{ ...inputStyle, marginTop: 6 }} />
              )}
            </div>
            <div>
              {label('Ngày nhập')}
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Dòng SP */}
          <div>
            {label('Sản phẩm nhập')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lines.map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px auto auto', gap: 6, alignItems: 'center' }}>
                  <select value={l.product} onChange={e => setLine(i, 'product', e.target.value)} style={{ ...inputStyle, fontSize: 12 }}>
                    <option value="">— Chọn SP —</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" value={l.qty} onChange={e => setLine(i, 'qty', e.target.value)} placeholder="SL" style={{ ...inputStyle, fontSize: 12, textAlign: 'right' }} />
                  <input type="number" value={l.is_gift ? '' : l.cost_price} onChange={e => setLine(i, 'cost_price', e.target.value)} placeholder="Giá nhập" disabled={l.is_gift} style={{ ...inputStyle, fontSize: 12, textAlign: 'right', background: l.is_gift ? '#f1f5f9' : '#fff' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#854d0e', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                    <input type="checkbox" checked={l.is_gift} onChange={e => setLine(i, 'is_gift', e.target.checked)} /> NCC tặng
                  </label>
                  <button onClick={() => delLine(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#dc2626' }}><IconTrash size={15} /></button>
                </div>
              ))}
            </div>
            <button onClick={addLine} style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, padding: '4px 10px', border: '1px dashed #b45309', borderRadius: 6, background: '#fff', color: '#b45309', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <IconPlus size={12} /> Thêm dòng
            </button>
          </div>

          {/* Thanh toán NCC */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Trạng thái trả NCC')}
              <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} style={inputStyle}>
                <option value="debt">Còn nợ</option>
                <option value="paid">Đã trả</option>
                <option value="partial">Trả một phần</option>
              </select>
            </div>
            <div>
              {label('Tổng tiền phải trả')}
              <div style={{ padding: '7px 10px', fontSize: 14, fontWeight: 700, color: '#b45309' }}>{fmt(totalCost)}đ</div>
            </div>
          </div>

          <div>
            {label('Ghi chú')}
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="VD: mua 10 tặng 2..." style={inputStyle} />
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
