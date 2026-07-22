import { useState, useEffect } from 'react'
import { IconX, IconSend } from '@tabler/icons-react'
import { getServices, createContract, updateContract, submitContract, getMyCustomers } from '../../../api/sale'
import toast from 'react-hot-toast'

const ACCENT = '#15803d'
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const HTTT_CFG = {
  ck: { color: '#16a34a', bg: '#f0fdf4', label: 'Chuyển khoản' },
  tm: { color: '#d97706', bg: '#fffbeb', label: 'Tiền mặt' },
  kh: { color: '#1d4ed8', bg: '#eff6ff', label: 'Kết hợp CK + TM' },
}

function fmtMoney(n) {
  const v = Number(n)
  if (!v) return '0 ₫'
  return v.toLocaleString('vi') + ' ₫'
}

const emptyLine = () => ({ service_id: '', name: '', unit_price: 0, sessions: 1, discount: 0 })

function lineTotal(line) {
  return Math.max(0, (line.sessions || 0) * (line.unit_price || 0) - (line.discount || 0))
}

export default function ChotHDModal({ onClose, onDone, defaultCustomer, initialData }) {
  const isEdit = !!initialData

  const [services,   setServices]   = useState([])
  const [customers,  setCustomers]  = useState([])
  const [loaiGD,     setLoaiGD]     = useState('new')
  const [showKM,     setShowKM]     = useState(false)
  const [httt,       setHttt]       = useState(() => {
    if (initialData?.payment_method === 'cash') return 'tm'
    if (initialData?.payment_method === 'combined') return 'kh'
    return 'ck'
  })
  const [ttCK,       setTtCK]       = useState('chua')
  const [maGD,       setMaGD]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [form, setForm] = useState({
    customer:   defaultCustomer?.id ?? initialData?.customer ?? '',
    loai_dv:    'tham_my',
    bs:         '',
    dot1:       String(initialData?.transfer_amount ?? initialData?.cash_amount ?? ''),
    ck_amount:  String(initialData?.transfer_amount ?? ''),
    tm_amount:  String(initialData?.cash_amount ?? ''),
    notes:      initialData?.notes ?? '',
    sale_round: initialData?.sale_round ?? 'sale',
  })
  const [serviceLines, setServiceLines] = useState(() => {
    if (isEdit && initialData?.items?.length) {
      return initialData.items.map(item => ({
        service_id: String(item.service_id ?? ''),
        name:       item.name ?? '',
        unit_price: item.sessions > 0 ? Math.round(item.price / item.sessions) : (item.price || 0),
        sessions:   item.sessions ?? 1,
        discount:   item.discount ?? 0,
      }))
    }
    return [emptyLine()]
  })
  const [gifts, setGifts] = useState(initialData?.gifts ?? [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalAmount = serviceLines.reduce((s, l) => s + lineTotal(l), 0)
  const conNo = Math.max(0, totalAmount - Number(form.dot1 || 0))
  const htttLabel = (() => {
    if (httt === 'ck') return ttCK === 'roi' ? 'Chuyển khoản · Đã nhận ✓' : 'Chuyển khoản · Chưa nhận'
    if (httt === 'tm') return 'Tiền mặt · Chờ KT xác nhận'
    return 'Kết hợp CK + TM'
  })()

  useEffect(() => {
    getServices().then(r => setServices(r.data?.results ?? r.data ?? [])).catch(() => {})
    getMyCustomers().then(r => setCustomers(r.data?.results ?? r.data ?? [])).catch(() => {})
  }, [])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const updateLine = (i, field, value) => {
    setServiceLines(lines => lines.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  const selectService = (i, svcId) => {
    const svc = services.find(s => String(s.id) === svcId)
    setServiceLines(lines => lines.map((l, idx) => {
      if (idx !== i) return l
      if (!svc) return { ...l, service_id: svcId, name: '', unit_price: 0 }
      return {
        ...l,
        service_id: svcId,
        name:       svc.name,
        unit_price: Number(svc.unit_price) || 0,
        sessions:   svc.sessions || 1,
      }
    }))
  }

  const addLine = () => setServiceLines(ls => [...ls, emptyLine()])
  const removeLine = (i) => setServiceLines(ls => ls.filter((_, idx) => idx !== i))

  const buildPayload = () => {
    const finalAmount = totalAmount
    let cashAmt = 0, transferAmt = 0, paymentMethod = 'transfer'
    if (httt === 'ck')   { transferAmt = Number(form.dot1) || 0; paymentMethod = 'transfer' }
    if (httt === 'tm')   { cashAmt     = Number(form.dot1) || 0; paymentMethod = 'cash' }
    if (httt === 'kh')   { transferAmt = Number(form.ck_amount) || 0; cashAmt = Number(form.tm_amount) || 0; paymentMethod = 'combined' }
    const paymentStatus = (cashAmt + transferAmt) >= finalAmount ? 'received' : (cashAmt + transferAmt) > 0 ? 'partial' : 'unpaid'
    return {
      customer: form.customer,
      items: serviceLines.map(l => ({
        service_id: l.service_id ? Number(l.service_id) : null,
        name:       l.name || 'Dịch vụ',
        sessions:   l.sessions,
        price:      l.sessions * l.unit_price,
        discount:   l.discount,
      })),
      gifts,
      promotions: [],
      total_amount:    finalAmount,
      discount_amount: serviceLines.reduce((s, l) => s + (l.discount || 0), 0),
      final_amount:    finalAmount,
      payment_method:  paymentMethod,
      cash_amount:     cashAmt,
      transfer_amount: transferAmt,
      payment_status:  paymentStatus,
      sale_round:      form.sale_round,
      notes:           form.notes,
    }
  }

  const handleSave = async (andSubmit = false) => {
    if (!form.customer) { toast.error('Chọn khách hàng'); return }
    if (!serviceLines.some(l => l.service_id)) { toast.error('Chọn ít nhất 1 dịch vụ'); return }
    if (serviceLines.some(l => !l.sessions || l.sessions < 1)) { toast.error('Số buổi phải ≥ 1'); return }
    if (totalAmount <= 0) { toast.error('Tổng giá trị HĐ phải > 0'); return }
    setSaving(true)
    try {
      let data
      if (isEdit) {
        const res = await updateContract(initialData.id, buildPayload())
        data = res.data
      } else {
        const res = await createContract(buildPayload())
        data = res.data
      }
      if (andSubmit) {
        await submitContract(data.id)
        toast.success(`HĐ ${data.contract_no} đã gửi KT duyệt`)
      } else {
        toast.success(isEdit ? `Đã cập nhật nháp ${data.contract_no}` : `Đã lưu nháp ${data.contract_no}`)
      }
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? JSON.stringify(err.response?.data ?? 'Lỗi lưu HĐ'))
    } finally {
      setSaving(false)
    }
  }

  const cfg = HTTT_CFG[httt]

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{isEdit ? 'Sửa Hợp đồng nháp' : 'Tạo Hoá đơn'}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>HĐ tạo là Bản nháp → KT duyệt → DT ghi chính thức</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={20} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Khách hàng */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Khách hàng *</label>
            {defaultCustomer ? (
              <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 7, fontSize: 13, fontWeight: 600, color: ACCENT }}>
                {defaultCustomer.customer_name ?? defaultCustomer.full_name} — {defaultCustomer.customer_phone ?? defaultCustomer.phone}
              </div>
            ) : (
              <select value={form.customer} onChange={e => set('customer', e.target.value)}
                style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }}>
                <option value="">— Chọn KH —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
              </select>
            )}
          </div>

          {/* Loại giao dịch */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { v: 'new', l: 'Dịch vụ mới', c: '#16a34a' },
              { v: 'them', l: 'Thêm DV / Nâng cấp', c: '#1d4ed8' },
              { v: 'km', l: 'Tặng kèm / KM', c: '#d97706' },
            ].map(o => (
              <button key={o.v} onClick={() => { setLoaiGD(o.v); if (o.v === 'km') setShowKM(v => !v) }}
                style={{ padding: '8px 6px', borderRadius: 8, border: `2px solid ${loaiGD === o.v ? o.c : '#dde3ef'}`, background: loaiGD === o.v ? o.c + '15' : '#fff', color: loaiGD === o.v ? o.c : '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                {o.l}
              </button>
            ))}
          </div>

          {/* Panel KM */}
          {showKM && (
            <div style={{ padding: 12, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', margin: '0 0 8px' }}>🎁 Quà tặng / Khuyến mãi</p>
              {gifts.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: g.type === 'product' ? '#fffbeb' : '#eff6ff', marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 12 }}>{g.name}</span>
                  <button onClick={() => setGifts(gs => gs.filter((_, j) => j !== i))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
              ))}
              <button onClick={() => setGifts(g => [...g, { type: 'product', name: 'Quà tặng mới' }])}
                style={{ width: '100%', padding: '6px', border: '1px dashed #d97706', borderRadius: 6, background: 'none', color: '#d97706', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                + Thêm quà / DV tặng kèm
              </button>
            </div>
          )}

          {/* Loại vòng + Loại DV */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại vòng tư vấn</label>
              <select value={form.sale_round} onChange={e => set('sale_round', e.target.value)}
                style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }}>
                <option value="sale">Sale (vòng 1)</option>
                <option value="upsale">Upsale (vòng 2+)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Loại DV *</label>
              <select value={form.loai_dv} onChange={e => set('loai_dv', e.target.value)}
                style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }}>
                <option value="tham_my">Thẩm mỹ — VAT 10%</option>
                <option value="benh_ly">Bệnh lý — Miễn VAT (cần hồ sơ)</option>
              </select>
            </div>
          </div>

          {/* Danh sách dịch vụ */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Dịch vụ *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {serviceLines.map((line, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 96px 96px 28px', gap: 6, alignItems: 'center' }}>
                  {/* Dropdown chọn dịch vụ */}
                  <select value={line.service_id} onChange={e => selectService(i, e.target.value)}
                    style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }}>
                    <option value="">— Chọn dịch vụ —</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {/* Số buổi */}
                  <input type="number" min={1} value={line.sessions}
                    onChange={e => updateLine(i, 'sessions', Math.max(1, Number(e.target.value) || 1))}
                    placeholder="Buổi"
                    style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 8px', fontSize: 13, boxSizing: 'border-box', textAlign: 'center' }} />
                  {/* Chiết khấu */}
                  <input type="number" min={0} value={line.discount || ''}
                    onChange={e => updateLine(i, 'discount', Number(e.target.value) || 0)}
                    placeholder="CK ₫"
                    style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 8px', fontSize: 13, boxSizing: 'border-box', textAlign: 'right' }} />
                  {/* Thành tiền — khoá */}
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '7px 8px', fontSize: 12, background: '#f9fafb', color: ACCENT, fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {fmtMoney(lineTotal(line))}
                  </div>
                  {/* Nút xoá */}
                  <button onClick={() => removeLine(i)} disabled={serviceLines.length === 1}
                    style={{ border: 'none', background: 'none', cursor: serviceLines.length === 1 ? 'default' : 'pointer', color: serviceLines.length === 1 ? '#d1d5db' : '#9ca3af', fontSize: 18, lineHeight: 1, padding: 0 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            {/* Header labels cho các cột */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px 96px 96px 28px', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Dịch vụ</span>
              <span style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center' }}>Số buổi</span>
              <span style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>Chiết khấu</span>
              <span style={{ fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>Thành tiền</span>
              <span />
            </div>
            <button onClick={addLine}
              style={{ marginTop: 8, width: '100%', padding: '6px', border: `1px dashed ${ACCENT}`, borderRadius: 7, background: 'none', color: ACCENT, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              + Thêm dịch vụ
            </button>
          </div>

          {/* Tổng giá trị HĐ — khoá */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tổng giá trị HĐ (₫)</label>
              <div style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '7px 10px', fontSize: 13, background: '#f9fafb', color: ACCENT, fontWeight: 700 }}>
                {fmtMoney(totalAmount)}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Thanh toán đợt 1 (₫) *</label>
              <input type="number" placeholder="0" value={form.dot1} onChange={e => set('dot1', e.target.value)}
                style={{ width: '100%', border: `1px solid ${httt === 'kh' ? '#d1d5db' : '#dde3ef'}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
          </div>

          {/* Hình thức thanh toán */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Hình thức thanh toán</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {Object.entries(HTTT_CFG).map(([k, c]) => (
                <button key={k} onClick={() => setHttt(k)}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 7, border: `2px solid ${httt === k ? c.color : '#dde3ef'}`, background: httt === k ? c.bg : '#fff', color: httt === k ? c.color : '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {k === 'ck' ? 'CK' : k === 'tm' ? 'TM' : 'CK + TM'}
                </button>
              ))}
            </div>

            {/* CK fields */}
            {httt === 'ck' && (
              <div style={{ padding: 10, background: cfg.bg, borderRadius: 8, border: `1px solid ${cfg.color}30` }}>
                <p style={{ fontSize: 12, color: cfg.color, fontWeight: 600, margin: '0 0 8px' }}>🏦 TK: Phòng khám — VCB 012345678</p>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ v: 'chua', l: 'Chưa nhận', style: { background: '#fef9c3', color: '#92400e', border: '1.5px solid #fde68a' } },
                    { v: 'roi',  l: 'Đã nhận ✓',  style: { background: '#dcfce7', color: '#15803d', border: '1.5px solid #a7f3d0' } }]
                    .map(o => (
                      <button key={o.v} onClick={() => setTtCK(o.v)}
                        style={{ ...o.style, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: ttCK === o.v ? 1 : .55 }}>
                        {o.l}
                      </button>
                    ))}
                </div>
                {ttCK === 'roi' && (
                  <input placeholder="Mã giao dịch" value={maGD} onChange={e => setMaGD(e.target.value)}
                    style={{ marginTop: 8, width: '100%', border: '1px solid #a7f3d0', borderRadius: 6, padding: '6px 10px', fontSize: 12, boxSizing: 'border-box', background: '#f0fdf4' }} />
                )}
              </div>
            )}

            {/* TM fields */}
            {httt === 'tm' && (
              <div style={{ padding: 10, background: cfg.bg, borderRadius: 8, border: `1px solid ${cfg.color}30` }}>
                <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>⚠️ Sale không tự xác nhận tiền mặt — KT ghi nhận khi nhận tiền tại quầy.</p>
              </div>
            )}

            {/* Kết hợp fields */}
            {httt === 'kh' && (
              <div style={{ padding: 10, background: cfg.bg, borderRadius: 8, border: `1px solid ${cfg.color}30` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>CK (₫)</label>
                    <input type="number" value={form.ck_amount} onChange={e => set('ck_amount', e.target.value)} placeholder="0"
                      style={{ width: '100%', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>TM (₫)</label>
                    <input type="number" value={form.tm_amount} onChange={e => set('tm_amount', e.target.value)} placeholder="0"
                      style={{ width: '100%', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tổng kết */}
          <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: ACCENT, margin: '0 0 8px' }}>Tổng kết thanh toán</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
              <span style={{ color: '#6b7280' }}>Giá trị HĐ</span>
              <span style={{ fontWeight: 700, textAlign: 'right' }}>{fmtMoney(totalAmount)}</span>
              <span style={{ color: '#6b7280' }}>Đã TT đợt 1</span>
              <span style={{ fontWeight: 700, textAlign: 'right', color: ACCENT }}>{fmtMoney(form.dot1)}</span>
              <span style={{ color: '#6b7280' }}>Còn nợ</span>
              <span style={{ fontWeight: 700, textAlign: 'right', color: conNo > 0 ? '#dc2626' : '#6b7280' }}>{fmtMoney(conNo)}</span>
              <span style={{ color: '#6b7280' }}>Hình thức</span>
              <span style={{ fontWeight: 600, textAlign: 'right', color: cfg.color }}>{htttLabel}</span>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ghi chú tư vấn</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Nội dung tư vấn, cam kết, lưu ý..."
              style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }} />
          </div>

          {/* Info box */}
          <div style={{ padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, color: '#1d4ed8' }}>
            ℹ️ HĐ tạo ra là <strong>Bản nháp</strong> → KT duyệt → DT ghi nhận chính thức.
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={() => handleSave(false)} disabled={saving}
              style={{ padding: '8px 16px', borderRadius: 7, border: `1px solid ${ACCENT}`, background: '#f0fdf4', color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? '...' : 'Lưu nháp'}
            </button>
            <button onClick={() => handleSave(true)} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconSend size={14} /> {saving ? 'Đang gửi...' : 'Lưu & Gửi KT duyệt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
