import { useState } from 'react'
import { IconX, IconFileInvoice, IconArrowRight } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { createExpense, editExpense, EXPENSE_CATEGORIES } from '../../../api/expenses'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

// Preview chuỗi duyệt (mirror backend build_expense_chain)
const FIRST = {
  tele: ['LEAD_TELE', 'Lead Tele'], mkt: ['LEAD_MKT', 'Lead MKT'],
  cskh: ['LEAD_CSKH', 'Lead CSKH'], sale: ['LEAD_SALE', 'Lead Sale'],
}
function previewChain(category, amount, role) {
  const [fr, fn] = FIRST[category] || ['QUAN_LY', 'QL chi nhánh']
  let raw = [{ role: fr, label: `Trưởng BP (${fn})` }, { role: 'KE_TOAN', label: 'Kế toán' }]
  if (Number(amount || 0) >= 1000000) raw.push({ role: 'CHU_DN', label: 'Chủ DN' })
  if (role) raw = raw.filter(s => s.role !== role)
  return raw
}

export default function ChiModal({ onClose, onDone, editing, userRole }) {
  const [category, setCategory] = useState(editing?.category ?? 'co_so')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [method, setMethod] = useState(editing?.payment_method ?? 'cash')
  const [soKy, setSoKy] = useState(editing?.so_ky ? String(editing.so_ky) : '')
  const [kyDau, setKyDau] = useState(editing?.ky_dau ?? '')
  const [coVat, setCoVat] = useState(editing?.co_hoa_don_vat ?? false)
  const [reason, setReason] = useState(editing?.reason ?? '')
  const [chungTu, setChungTu] = useState(editing?.chung_tu_note ?? '')
  const [saving, setSaving] = useState(false)

  const chain = previewChain(category, amount, userRole)
  const lbl = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }
  const inp = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  const submit = async () => {
    if (!title.trim()) return toast.error('Nhập nội dung chi')
    if (Number(amount || 0) <= 0) return toast.error('Nhập số tiền')
    setSaving(true)
    if (method === 'installment' && Number(soKy || 0) < 1) { setSaving(false); return toast.error('Nhập số kỳ trả góp') }
    const data = {
      category, title: title.trim(), amount: Number(amount),
      payment_method: method, co_hoa_don_vat: coVat,
      reason, chung_tu_note: chungTu,
      so_ky: method === 'installment' ? Number(soKy) : 0,
      ky_dau: method === 'installment' ? (kyDau || null) : null,
    }
    try {
      if (editing) await editExpense(editing.id, data)
      else await createExpense(data)
      toast.success(editing ? 'Đã cập nhật đề xuất' : 'Đã gửi đề xuất chi')
      onDone?.()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi lưu đề xuất')
    } finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 560, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #eef1f6' }}>
          <IconFileInvoice size={18} color="#b45309" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f2044' }}>{editing ? `Sửa đề xuất chi ${editing.code}` : 'Tạo đề xuất chi'}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><IconX size={18} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Loại chi *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Số tiền (₫) *</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Nội dung chi *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Mua mực in, vật tư laser..." style={inp} />
          </div>

          <div>
            <label style={lbl}>Hình thức chi</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['cash', 'Tiền mặt'], ['transfer', 'Chuyển khoản'], ['installment', 'Trả góp']].map(([v, t]) => (
                <button key={v} onClick={() => setMethod(v)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: `1px solid ${method === v ? '#b45309' : '#dde3ef'}`, background: method === v ? '#fff7ed' : '#fff', color: method === v ? '#b45309' : '#64748b', fontWeight: method === v ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
              ))}
            </div>
          </div>

          {method === 'installment' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 9, padding: '12px 13px' }}>
              <div>
                <label style={lbl}>Số kỳ (tháng) *</label>
                <input type="number" value={soKy} onChange={e => setSoKy(e.target.value)} placeholder="VD: 12" style={inp} />
              </div>
              <div>
                <label style={lbl}>Ngày kỳ đầu</label>
                <input type="date" value={kyDau} onChange={e => setKyDau(e.target.value)} style={inp} />
              </div>
              <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#92400e' }}>
                {Number(soKy || 0) >= 1 && Number(amount || 0) > 0
                  ? `≈ ${fmt(Math.floor(Number(amount) / Number(soKy)))}đ/kỳ × ${soKy} kỳ (kỳ cuối bù lẻ). Mỗi kỳ đến hạn KT ghi chi vào sổ quỹ.`
                  : 'Nhập tổng tiền + số kỳ để xem lịch trả.'}
              </div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
            <input type="checkbox" checked={coVat} onChange={e => setCoVat(e.target.checked)} />
            Có hóa đơn VAT đầu vào
          </label>

          <div>
            <label style={lbl}>Lý do / diễn giải</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Chi tiết khoản chi..." style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div>
            <label style={lbl}>Chứng từ kèm theo</label>
            <input value={chungTu} onChange={e => setChungTu(e.target.value)} placeholder="VD: hóa đơn số..., phiếu báo giá... (mô tả)" style={inp} />
          </div>

          {/* Preview chuỗi duyệt */}
          <div style={{ background: '#f8fafc', border: '1px solid #e8edf5', borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
              Chuỗi duyệt {Number(amount || 0) >= 1000000 ? '(≥ 1 triệu → cần Chủ DN)' : '(< 1 triệu)'}
            </div>
            {chain.length === 0 ? (
              <div style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>Bạn là người duyệt duy nhất → tự động duyệt.</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                {chain.map((s, i) => (
                  <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ background: '#fff', border: '1px solid #dbe3ee', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, color: '#334155' }}>{i + 1}. {s.label}</span>
                    {i < chain.length - 1 && <IconArrowRight size={13} color="#94a3b8" />}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #eef1f6', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #dde3ef', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={submit} disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#b45309', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Gửi đề xuất')}
          </button>
        </div>
      </div>
    </div>
  )
}
