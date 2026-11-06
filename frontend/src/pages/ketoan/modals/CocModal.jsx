import { useState, useEffect, useRef } from 'react'
import { IconX, IconCoin, IconSearch, IconUser } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { createDeposit } from '../../../api/deposits'
import { getCustomers } from '../../../api/customers'

const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

export default function CocModal({ onClose, onDone }) {
  const [cust, setCust] = useState(null)      // {id, full_name, phone}
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(todayStr())
  const [saving, setSaving] = useState(false)
  const tmr = useRef(null)

  useEffect(() => {
    if (cust || q.trim().length < 2) { setResults([]); return }
    clearTimeout(tmr.current)
    tmr.current = setTimeout(() => {
      getCustomers({ search: q.trim(), page_size: 8 }).then(r => {
        const data = r.data?.results ?? r.data ?? []
        setResults(Array.isArray(data) ? data.slice(0, 8) : [])
        setOpen(true)
      }).catch(() => {})
    }, 300)
    return () => clearTimeout(tmr.current)
  }, [q, cust])

  const lbl = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }
  const inp = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  const submit = async () => {
    if (!cust) return toast.error('Chọn khách hàng')
    if (Number(amount || 0) <= 0) return toast.error('Nhập số tiền cọc')
    setSaving(true)
    try {
      await createDeposit({ customer: cust.id, amount: Number(amount), method, reason, received_at: date })
      toast.success('Đã ghi phiếu cọc')
      onDone?.()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi ghi cọc') }
    finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 480, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #eef1f6' }}>
          <IconCoin size={18} color="#0891b2" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f2044' }}>Tạo phiếu đặt cọc</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><IconX size={18} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Customer search */}
          <div style={{ position: 'relative' }}>
            <label style={lbl}>Khách hàng *</label>
            {cust ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #bae6fd', background: '#f0f9ff', borderRadius: 8, padding: '8px 10px' }}>
                <IconUser size={16} color="#0891b2" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>{cust.full_name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{cust.phone}</div>
                </div>
                <button onClick={() => { setCust(null); setQ(''); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 12 }}>Đổi</button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <IconSearch size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#94a3b8' }} />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm tên / SĐT khách..." style={{ ...inp, paddingLeft: 30 }} />
                </div>
                {open && results.length > 0 && (
                  <div style={{ position: 'absolute', zIndex: 5, left: 0, right: 0, background: '#fff', border: '1px solid #dde3ef', borderRadius: 8, marginTop: 4, boxShadow: '0 8px 20px rgba(15,23,42,0.12)', maxHeight: 220, overflowY: 'auto' }}>
                    {results.map(c => (
                      <div key={c.id} onClick={() => { setCust({ id: c.id, full_name: c.full_name, phone: c.phone }); setOpen(false) }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f2044' }}>{c.full_name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{c.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Số tiền cọc (₫) *</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inp} />
            </div>
            <div>
              <label style={lbl}>Ngày nhận cọc</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Hình thức nhận</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['cash', 'Tiền mặt'], ['transfer', 'Chuyển khoản']].map(([v, t]) => (
                <button key={v} onClick={() => setMethod(v)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: `1px solid ${method === v ? '#0891b2' : '#dde3ef'}`, background: method === v ? '#f0f9ff' : '#fff', color: method === v ? '#0891b2' : '#64748b', fontWeight: method === v ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Giữ chỗ dịch vụ / gói (ghi chú)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: giữ chỗ gói triệt lông, đặt lịch laser..." style={inp} />
          </div>

          <div style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', border: '1px solid #e8edf5', borderRadius: 8, padding: '9px 11px' }}>
            Cọc <b>chưa tính doanh thu</b>. Sau có thể: trừ vào HĐ (dịch vụ ban đầu hoặc SP/DV khách đổi sang), hoàn, hoặc mất cọc.
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef1f6', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #dde3ef', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={submit} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0891b2', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Đang lưu...' : 'Ghi phiếu cọc'}</button>
        </div>
      </div>
    </div>
  )
}
