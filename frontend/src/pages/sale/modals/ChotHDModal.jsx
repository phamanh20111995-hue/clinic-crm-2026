import { useState, useEffect } from 'react'
import { IconX, IconSend } from '@tabler/icons-react'
import { getServices, createContract, updateContract, submitContract, getMyCustomers } from '../../../api/sale'
import { getProducts } from '../../../api/inventory'
import { getAllUsers } from '../../../api/letan'
import useAuthStore from '../../../store/authStore'
import toast from 'react-hot-toast'

const SELLER_ROLES = ['SALE', 'LEAD_SALE', 'CSKH', 'LEAD_CSKH', 'BS', 'KTV']

const ACCENT = '#15803d'
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const HTTT_CFG = {
  ck: { color: '#16a34a', bg: '#f0fdf4', label: 'Chuyển khoản' },
  tm: { color: '#d97706', bg: '#fffbeb', label: 'Tiền mặt' },
  kh: { color: '#1d4ed8', bg: '#eff6ff', label: 'Kết hợp CK + TM' },
  the: { color: '#0891b2', bg: '#ecfeff', label: 'Thẻ / QR (VNPAY)' },
  tg: { color: '#7c3aed', bg: '#f5f3ff', label: 'Trả góp' },
}
const HTTT_SHORT = { ck: 'CK', tm: 'TM', kh: 'CK+TM', the: 'Thẻ', tg: 'Trả góp' }

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

  const authUser = useAuthStore(s => s.user)
  const [services,   setServices]   = useState([])
  const [products,   setProducts]   = useState([])
  const [allUsers,   setAllUsers]   = useState([])
  const [customers,  setCustomers]  = useState([])
  const [httt,       setHttt]       = useState(() => {
    if (initialData?.payment_method === 'cash') return 'tm'
    if (initialData?.payment_method === 'combined') return 'kh'
    if (initialData?.payment_method === 'card') return 'the'
    if (initialData?.payment_method === 'installment') return 'tg'
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
    nguoi_ban:  initialData?.nguoi_ban ?? authUser?.id ?? '',
    // Trả góp
    provider_name:    initialData?.installment_info?.provider ?? '',
    tragop_ref:       initialData?.installment_info?.ref_no ?? '',
    tragop_principal: initialData?.installment_amount ? String(initialData.installment_amount) : '',
    tragop_fee:       initialData?.installment_info?.conversion_fee ? String(initialData.installment_info.conversion_fee) : '',
    tragop_ptype:     initialData?.installment_info?.provider_type ?? 'vay_tieu_dung',
    // Thẻ / QR (VNPAY)
    card_phi:         initialData?.card_info?.fee ? String(initialData.card_info.fee) : '',
    card_ref:         initialData?.card_info?.ref ?? '',
  })
  const [serviceLines, setServiceLines] = useState(() => {
    const paid = (initialData?.items ?? []).filter(it => !it.is_gift)
    if (isEdit && paid.length) {
      return paid.map(item => ({
        service_id: String(item.service_id ?? ''),
        name:       item.name ?? '',
        unit_price: item.sessions > 0 ? Math.round(item.price / item.sessions) : (item.price || 0),
        sessions:   item.sessions ?? 1,
        discount:   item.discount ?? 0,
      }))
    }
    return [emptyLine()]
  })
  const [gifts, setGifts] = useState(() => (initialData?.gifts ?? []).map(g => ({
    kind:   g.kind ?? (g.type === 'service' ? 'service' : 'product'),
    ref_id: g.ref_id != null ? String(g.ref_id) : '',
    name:   g.name ?? '',
    qty:    Number(g.qty) || 1,
  })))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const totalAmount = serviceLines.reduce((s, l) => s + lineTotal(l), 0)
  // Trả trước: chế độ trả góp tách TM + CK; các chế độ khác dùng 1 ô đợt 1
  const traTruoc = httt === 'tg'
    ? (Number(form.ck_amount || 0) + Number(form.tm_amount || 0))
    : Number(form.dot1 || 0)
  const conNo = Math.max(0, totalAmount - traTruoc)
  // Trả góp: phần nhà tài trợ gánh (mặc định = còn lại sau trả trước)
  const tgPrincipal = httt === 'tg'
    ? (form.tragop_principal !== '' ? Number(form.tragop_principal) : Math.max(0, totalAmount - traTruoc))
    : 0
  const khachNoTg = httt === 'tg' ? Math.max(0, totalAmount - traTruoc - tgPrincipal) : conNo
  // Thẻ: khách trả gross = traTruoc; phí PK chịu; net về bank = gross − phí
  const cardPhi = httt === 'the' ? Number(form.card_phi || 0) : 0
  const cardNet = httt === 'the' ? Math.max(0, traTruoc - cardPhi) : 0
  const htttLabel = (() => {
    if (httt === 'ck') return ttCK === 'roi' ? 'Chuyển khoản · Đã nhận ✓' : 'Chuyển khoản · Chưa nhận'
    if (httt === 'tm') return 'Tiền mặt · Chờ KT xác nhận'
    if (httt === 'the') return 'Thẻ / QR · VNPAY'
    if (httt === 'tg') return `Trả góp · ${form.provider_name || 'nhà tài trợ'}`
    return 'Kết hợp CK + TM'
  })()

  useEffect(() => {
    getServices().then(r => setServices(r.data?.results ?? r.data ?? [])).catch(() => {})
    getProducts().then(r => setProducts(r.data?.results ?? r.data ?? [])).catch(() => {})
    getMyCustomers().then(r => setCustomers(r.data?.results ?? r.data ?? [])).catch(() => {})
    getAllUsers().then(r => setAllUsers(r.data?.results ?? r.data ?? [])).catch(() => {})
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

  // Quà / DV tặng kèm (KHÔNG tính tiền, KHÔNG giảm doanh thu)
  const addGift = () => setGifts(g => [...g, { kind: 'product', ref_id: '', name: '', qty: 1 }])
  const updateGift = (i, patch) => setGifts(gs => gs.map((g, idx) => idx === i ? { ...g, ...patch } : g))
  const removeGift = (i) => setGifts(gs => gs.filter((_, idx) => idx !== i))

  const buildPayload = () => {
    const finalAmount = totalAmount
    let cashAmt = 0, transferAmt = 0, paymentMethod = 'transfer'
    let installmentAmt = 0, installmentInfo = {}
    let cardAmt = 0, cardInfo = {}
    if (httt === 'ck')   { transferAmt = Number(form.dot1) || 0; paymentMethod = 'transfer' }
    if (httt === 'tm')   { cashAmt     = Number(form.dot1) || 0; paymentMethod = 'cash' }
    if (httt === 'kh')   { transferAmt = Number(form.ck_amount) || 0; cashAmt = Number(form.tm_amount) || 0; paymentMethod = 'combined' }
    if (httt === 'the')  {
      cardAmt = Number(form.dot1) || 0
      paymentMethod = 'card'
      cardInfo = { provider: 'VNPAY', fee: Number(form.card_phi) || 0, ref: form.card_ref || '' }
    }
    if (httt === 'tg') {
      transferAmt = Number(form.ck_amount) || 0
      cashAmt     = Number(form.tm_amount) || 0
      const truoc = transferAmt + cashAmt
      const principal = form.tragop_principal !== '' ? Number(form.tragop_principal) : Math.max(0, finalAmount - truoc)
      paymentMethod = 'installment'
      installmentAmt = principal
      installmentInfo = {
        provider:      form.provider_name || '',
        ref_no:        form.tragop_ref || '',
        provider_type: form.tragop_ptype || 'vay_tieu_dung',
        conversion_fee: Number(form.tragop_fee) || 0,
        fee_bearer:    'pk',
        principal,
      }
    }
    const paymentStatus = (cashAmt + transferAmt) >= finalAmount ? 'received' : (cashAmt + transferAmt) > 0 ? 'partial' : 'unpaid'
    // Dòng dịch vụ (có tính tiền)
    const paidItems = serviceLines.map(l => ({
      service_id: l.service_id ? Number(l.service_id) : null,
      name:       l.name || 'Dịch vụ',
      sessions:   l.sessions,
      price:      l.sessions * l.unit_price,
      discount:   l.discount,
    }))
    // Dòng quà/DV tặng kèm: giá 0 (KHÔNG cộng doanh thu); SP/thuốc -> is_gift để backend trừ kho
    const giftItems = gifts.filter(g => g.ref_id).map(g => g.kind === 'service'
      ? { service_id: Number(g.ref_id), name: g.name || 'DV tặng', sessions: Number(g.qty) || 1, price: 0, discount: 0, is_gift: true }
      : { product_id: Number(g.ref_id), name: g.name || 'Quà tặng', qty: Number(g.qty) || 1, price: 0, is_gift: true }
    )
    return {
      customer: form.customer,
      items: [...paidItems, ...giftItems],
      gifts: gifts.filter(g => g.ref_id).map(g => ({ type: g.kind, ref_id: Number(g.ref_id), name: g.name, qty: Number(g.qty) || 1 })),
      promotions: [],
      total_amount:    finalAmount,
      discount_amount: serviceLines.reduce((s, l) => s + (l.discount || 0), 0),
      final_amount:    finalAmount,
      payment_method:  paymentMethod,
      cash_amount:     cashAmt,
      transfer_amount: transferAmt,
      installment_amount: installmentAmt,
      installment_info:   installmentInfo,
      card_amount:     cardAmt,
      card_info:       cardInfo,
      payment_status:  paymentStatus,
      sale_round:      form.sale_round,
      notes:           form.notes,
      nguoi_ban:       form.nguoi_ban || null,
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

          {/* Người bán (được tính doanh thu) */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Người bán (được tính doanh thu)</label>
            <select value={form.nguoi_ban} onChange={e => set('nguoi_ban', e.target.value)}
              style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }}>
              <option value="">— Mặc định: người nhập —</option>
              {allUsers.filter(u => SELLER_ROLES.includes(u.role)).map(u => (
                <option key={u.id} value={u.id}>{(u.display_name ?? u.full_name ?? u.email)} · {u.role}</option>
              ))}
            </select>
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

          {/* Quà / DV tặng kèm — KHÔNG tính tiền, KHÔNG giảm doanh thu */}
          <div style={{ padding: 12, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', margin: '0 0 2px' }}>🎁 Quà / DV tặng kèm</p>
            <p style={{ fontSize: 10, color: '#a16207', margin: '0 0 8px', lineHeight: 1.5 }}>Khách KHÔNG trả tiền — doanh thu giữ nguyên (đừng gõ vào Chiết khấu). SP/thuốc sẽ tự trừ kho khi KT duyệt.</p>
            {gifts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 6 }}>
                {gifts.map((g, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '96px 1fr 64px 24px', gap: 6, alignItems: 'center' }}>
                    <select value={g.kind} onChange={e => updateGift(i, { kind: e.target.value, ref_id: '', name: '' })}
                      style={{ border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 6px', fontSize: 12, boxSizing: 'border-box', background: '#fff' }}>
                      <option value="product">SP / Thuốc</option>
                      <option value="service">Dịch vụ</option>
                    </select>
                    {g.kind === 'product' ? (
                      <select value={g.ref_id} onChange={e => { const p = products.find(x => String(x.id) === e.target.value); updateGift(i, { ref_id: e.target.value, name: p?.name || '' }) }}
                        style={{ border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 8px', fontSize: 12, boxSizing: 'border-box', background: '#fff' }}>
                        <option value="">— Chọn SP/thuốc —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (tồn {p.stock ?? 0})</option>)}
                      </select>
                    ) : (
                      <select value={g.ref_id} onChange={e => { const s = services.find(x => String(x.id) === e.target.value); updateGift(i, { ref_id: e.target.value, name: s?.name || '' }) }}
                        style={{ border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 8px', fontSize: 12, boxSizing: 'border-box', background: '#fff' }}>
                        <option value="">— Chọn dịch vụ —</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                    <input type="number" min={1} value={g.qty} onChange={e => updateGift(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
                      title={g.kind === 'service' ? 'Số buổi tặng' : 'Số lượng'}
                      style={{ border: '1px solid #fcd34d', borderRadius: 6, padding: '6px 6px', fontSize: 12, boxSizing: 'border-box', textAlign: 'center', background: '#fff' }} />
                    <button type="button" onClick={() => removeGift(i)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#b45309', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr 64px 24px', gap: 6 }}>
                  <span style={{ fontSize: 9, color: '#a16207' }}>Loại</span>
                  <span style={{ fontSize: 9, color: '#a16207' }}>Món tặng</span>
                  <span style={{ fontSize: 9, color: '#a16207', textAlign: 'center' }}>SL / Buổi</span>
                  <span />
                </div>
              </div>
            )}
            <button type="button" onClick={addGift}
              style={{ width: '100%', padding: '6px', border: '1px dashed #d97706', borderRadius: 6, background: 'none', color: '#d97706', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              + Thêm quà / DV tặng kèm
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
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{httt === 'tg' ? 'Trả trước (₫)' : httt === 'the' ? 'Số tiền quẹt thẻ (₫) *' : 'Thanh toán đợt 1 (₫) *'}</label>
              {httt === 'tg' ? (
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '7px 10px', fontSize: 13, background: '#f9fafb', color: '#7c3aed', fontWeight: 700 }}>
                  {fmtMoney(traTruoc)} <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>(nhập TM/CK bên dưới)</span>
                </div>
              ) : (
                <input type="number" placeholder="0" value={form.dot1} onChange={e => set('dot1', e.target.value)}
                  style={{ width: '100%', border: `1px solid ${httt === 'kh' ? '#d1d5db' : '#dde3ef'}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
              )}
            </div>
          </div>

          {/* Hình thức thanh toán */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Hình thức thanh toán</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {Object.entries(HTTT_CFG).map(([k, c]) => (
                <button key={k} onClick={() => setHttt(k)}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 7, border: `2px solid ${httt === k ? c.color : '#dde3ef'}`, background: httt === k ? c.bg : '#fff', color: httt === k ? c.color : '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {HTTT_SHORT[k]}
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

            {/* Thẻ / QR (VNPAY) fields */}
            {httt === 'the' && (
              <div style={{ padding: 10, background: cfg.bg, borderRadius: 8, border: `1px solid ${cfg.color}30`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 11, color: cfg.color, margin: 0, lineHeight: 1.5 }}>
                  Khách quẹt thẻ/QR qua VNPAY — tính <strong>thực thu ngay</strong>. VNPAY trừ phí → tiền về bank là <strong>net = quẹt − phí</strong>. Phí là <strong>chi phí PK</strong>, KHÔNG trừ doanh thu.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>Phí VNPAY (PK chịu, ₫)</label>
                    <input type="number" value={form.card_phi} onChange={e => set('card_phi', e.target.value)} placeholder="0"
                      style={{ width: '100%', border: '1px solid #a5f3fc', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>Mã GD VNPAY</label>
                    <input value={form.card_ref} onChange={e => set('card_ref', e.target.value)} placeholder="VD 68199009"
                      style={{ width: '100%', border: '1px solid #a5f3fc', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#0e7490' }}>
                  Thực về bank (net): <strong>{fmtMoney(cardNet)}</strong>{cardPhi > 0 ? ` (quẹt ${fmtMoney(traTruoc)} − phí ${fmtMoney(cardPhi)})` : ''}
                </div>
              </div>
            )}

            {/* Trả góp fields */}
            {httt === 'tg' && (
              <div style={{ padding: 10, background: cfg.bg, borderRadius: 8, border: `1px solid ${cfg.color}30`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 11, color: cfg.color, margin: 0, lineHeight: 1.5 }}>
                  Khách trả trước cho PK, phần còn lại bên tài chính giải ngân đủ cho PK. Tiền trả góp tính <strong>thực thu khi về két</strong>; "Phí" để trống nếu bên tài chính không trừ.
                </p>
                {/* Trả trước — tách CK + TM (khách có thể trả vừa CK vừa TM) */}
                <div>
                  <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>Trả trước — khách đưa PK ngay (có thể cả CK + TM)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <input type="number" value={form.ck_amount} onChange={e => set('ck_amount', e.target.value)} placeholder="0"
                        style={{ width: '100%', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                      <span style={{ fontSize: 9, color: '#a78bfa' }}>Chuyển khoản</span>
                    </div>
                    <div>
                      <input type="number" value={form.tm_amount} onChange={e => set('tm_amount', e.target.value)} placeholder="0"
                        style={{ width: '100%', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                      <span style={{ fontSize: 9, color: '#a78bfa' }}>Tiền mặt</span>
                    </div>
                  </div>
                </div>
                {/* Nhà tài trợ + Số HĐ trả góp */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>Nhà tài trợ</label>
                    <input list="tg-providers" value={form.provider_name} onChange={e => set('provider_name', e.target.value)} placeholder="Home Credit..."
                      style={{ width: '100%', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                    <datalist id="tg-providers">
                      <option value="Home Credit" /><option value="FE Credit" /><option value="HD Saison" /><option value="Mcredit" /><option value="Shinhan Finance" />
                    </datalist>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>Số HĐ trả góp</label>
                    <input value={form.tragop_ref} onChange={e => set('tragop_ref', e.target.value)} placeholder="VD 4606045237"
                      style={{ width: '100%', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
                {/* Số tiền tài trợ + Phí */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>Số tiền tài trợ (₫)</label>
                    <input type="number" value={form.tragop_principal} onChange={e => set('tragop_principal', e.target.value)}
                      placeholder={String(Math.max(0, totalAmount - traTruoc))}
                      style={{ width: '100%', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>Phí PK chịu (₫)</label>
                    <input type="number" value={form.tragop_fee} onChange={e => set('tragop_fee', e.target.value)} placeholder="0 (để trống)"
                      style={{ width: '100%', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px', fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                </div>
                {/* Loại */}
                <div>
                  <label style={{ fontSize: 11, color: '#374151', display: 'block', marginBottom: 4 }}>Loại</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[{ v: 'vay_tieu_dung', l: 'Vay tiêu dùng · chờ giải ngân' }, { v: 'the_tin_dung', l: 'Thẻ tín dụng · về ngay' }].map(o => (
                      <button key={o.v} type="button" onClick={() => set('tragop_ptype', o.v)}
                        style={{ flex: 1, padding: '6px', borderRadius: 6, border: `1.5px solid ${form.tragop_ptype === o.v ? cfg.color : '#dde3ef'}`, background: form.tragop_ptype === o.v ? '#fff' : '#fafafa', color: form.tragop_ptype === o.v ? cfg.color : '#6b7280', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        {o.l}
                      </button>
                    ))}
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
              {httt === 'tg' ? (
                <>
                  <span style={{ color: '#6b7280' }}>Trả trước (đã về)</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: ACCENT }}>{fmtMoney(traTruoc)}</span>
                  <span style={{ color: '#6b7280' }}>Trả góp (chờ giải ngân)</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#7c3aed' }}>{fmtMoney(tgPrincipal)}</span>
                  <span style={{ color: '#6b7280' }}>Khách còn nợ</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: khachNoTg > 0 ? '#dc2626' : '#6b7280' }}>{fmtMoney(khachNoTg)}</span>
                </>
              ) : httt === 'the' ? (
                <>
                  <span style={{ color: '#6b7280' }}>Khách trả (thẻ)</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: ACCENT }}>{fmtMoney(traTruoc)}</span>
                  <span style={{ color: '#6b7280' }}>Phí VNPAY (chi phí PK)</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#dc2626' }}>− {fmtMoney(cardPhi)}</span>
                  <span style={{ color: '#6b7280' }}>Thực về bank (net)</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: '#0891b2' }}>{fmtMoney(cardNet)}</span>
                  <span style={{ color: '#6b7280' }}>Khách còn nợ</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: conNo > 0 ? '#dc2626' : '#6b7280' }}>{fmtMoney(conNo)}</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#6b7280' }}>Đã TT đợt 1</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: ACCENT }}>{fmtMoney(form.dot1)}</span>
                  <span style={{ color: '#6b7280' }}>Còn nợ</span>
                  <span style={{ fontWeight: 700, textAlign: 'right', color: conNo > 0 ? '#dc2626' : '#6b7280' }}>{fmtMoney(conNo)}</span>
                </>
              )}
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
