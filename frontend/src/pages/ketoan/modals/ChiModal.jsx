import { useState, useEffect } from 'react'
import { IconX, IconFileInvoice, IconArrowRight } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { createExpense, editExpense, uploadExpenseDoc, EXPENSE_CATEGORIES } from '../../../api/expenses'
import { getClinics } from '../../../api/clinics'
import { getSalaryConfigs } from '../../../api/ketoan'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

// Preview chuỗi duyệt theo BỘ PHẬN người đề xuất — mirror backend build_expense_chain (chốt 2026-11-12)
const DEPT_LEAD = {
  SALE: ['LEAD_SALE', 'Lead Sale'], LEAD_SALE: ['LEAD_SALE', 'Lead Sale'],
  TELE: ['LEAD_TELE', 'Lead Tele'], LEAD_TELE: ['LEAD_TELE', 'Lead Tele'],
  CSKH: ['LEAD_CSKH', 'Lead CSKH'], LEAD_CSKH: ['LEAD_CSKH', 'Lead CSKH'],
  MKT: ['LEAD_MKT', 'Lead MKT'], LEAD_MKT: ['LEAD_MKT', 'Lead MKT'],
  TRUC_PAGE: ['LEAD_TRUC_PAGE', 'Lead Trực page'], LEAD_TRUC_PAGE: ['LEAD_TRUC_PAGE', 'Lead Trực page'],
}
const AT_CLINIC = new Set(['LE_TAN', 'SALE', 'LEAD_SALE', 'KTV', 'BS'])
function previewChain(amount, role) {
  let raw = []
  const lead = DEPT_LEAD[role]
  if (lead) raw.push({ role: lead[0], label: `Trưởng BP (${lead[1]})` })
  if (AT_CLINIC.has(role)) raw.push({ role: 'QUAN_LY', label: 'Quản lý cơ sở' })
  if (raw.length === 0) raw.push({ role: 'QUAN_LY', label: 'QL chi nhánh' })
  raw.push({ role: 'KE_TOAN', label: 'Kế toán' })
  if (Number(amount || 0) >= 1000000) raw.push({ role: 'CHU_DN', label: 'Chủ DN' })
  if (role) raw = raw.filter(s => s.role !== role)
  const seen = new Set(), out = []
  for (const s of raw) { if (!seen.has(s.role)) { seen.add(s.role); out.push(s) } }
  return out
}

export default function ChiModal({ onClose, onDone, editing, userRole }) {
  const [clinics, setClinics] = useState([])
  const [clinic, setClinic] = useState(editing?.clinic_id ?? '')
  const [category, setCategory] = useState(editing?.category ?? 'co_so')
  const [title, setTitle] = useState(editing?.title ?? '')
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '')
  const [method, setMethod] = useState(editing?.payment_method ?? 'cash')
  const [soKy, setSoKy] = useState(editing?.so_ky ? String(editing.so_ky) : '')
  const [kyDau, setKyDau] = useState(editing?.ky_dau ?? '')
  const [coVat, setCoVat] = useState(editing?.co_hoa_don_vat ?? false)
  const [urgent, setUrgent] = useState(editing?.is_urgent ?? false)
  const [reason, setReason] = useState(editing?.reason ?? '')
  const [attachNote, setAttachNote] = useState(editing?.chung_tu_note ?? '')
  const [payeeName, setPayeeName] = useState(editing?.payee_name ?? '')
  const [payeePhone, setPayeePhone] = useState(editing?.payee_phone ?? '')
  const [payeeAccount, setPayeeAccount] = useState(editing?.payee_account ?? '')
  const [docs, setDocs] = useState((editing?.chung_tu || []).map(u => ({ url: u, name: (String(u).split('/').pop() || 'file') })))
  const [uploading, setUploading] = useState(false)
  const [payeeBank, setPayeeBank] = useState(editing?.payee_bank ?? '')
  const [dueDate, setDueDate] = useState(editing?.due_date ?? '')
  const [advanceFor, setAdvanceFor] = useState(editing?.advance_for ?? '')
  const [staff, setStaff] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { getClinics().then(r => setClinics(r.data?.results ?? r.data ?? [])).catch(() => {}) }, [])

  const isAdvance = category === 'luong_ung'
  useEffect(() => {
    if (isAdvance && staff.length === 0) {
      getSalaryConfigs().then(r => setStaff(r.data?.results ?? r.data ?? [])).catch(() => {})
    }
  }, [isAdvance])
  const chain = previewChain(amount, userRole)
  const lbl = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }
  const inp = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }

  const onUpload = async (e) => {
    const files = [...(e.target.files || [])]
    if (!files.length) return
    setUploading(true)
    for (const f of files) {
      const fd = new FormData(); fd.append('file', f)
      try { const r = await uploadExpenseDoc(fd); setDocs(d => [...d, { url: r.data.url, name: r.data.name }]) }
      catch { toast.error('Lỗi tải ' + f.name) }
    }
    setUploading(false); e.target.value = ''
  }

  const submit = async () => {
    if (!title.trim()) return toast.error('Nhập nội dung chi')
    if (Number(amount || 0) <= 0) return toast.error('Nhập số tiền')
    if (method === 'installment' && Number(soKy || 0) < 1) return toast.error('Nhập số kỳ trả góp')
    if (isAdvance && !advanceFor) return toast.error('Chọn nhân viên được tạm ứng')
    setSaving(true)
    const data = {
      clinic_id: clinic || null,
      category, title: title.trim(), amount: Number(amount),
      payment_method: method, co_hoa_don_vat: coVat, is_urgent: urgent,
      reason, chung_tu_note: attachNote,
      payee_name: payeeName, payee_phone: payeePhone, payee_account: payeeAccount, payee_bank: payeeBank,
      chung_tu: docs.map(d => d.url),
      due_date: dueDate || null,
      so_ky: method === 'installment' ? Number(soKy) : 0,
      ky_dau: method === 'installment' ? (kyDau || null) : null,
      advance_for: isAdvance ? (advanceFor || null) : null,
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
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 620, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(15,23,42,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #eef1f6' }}>
          <IconFileInvoice size={18} color="#b45309" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f2044' }}>{editing ? `Sửa đề xuất chi ${editing.code}` : 'Tạo đề xuất chi'}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><IconX size={18} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Chi nhánh / cơ sở</label>
              <select value={clinic} onChange={e => setClinic(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— Chọn cơ sở —</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Loại chi *</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          {isAdvance && (
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '10px 12px' }}>
              <label style={lbl}>Ứng cho nhân viên *</label>
              <select value={advanceFor} onChange={e => setAdvanceFor(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— Chọn người được ứng —</option>
                {staff.map(s => <option key={s.user} value={s.user}>{s.user_name}</option>)}
              </select>
              <div style={{ fontSize: 11, color: '#92400e', marginTop: 5 }}>Số tiền này sẽ tự trừ vào <b>Thực lãnh</b> của nhân viên trong tháng chi.</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Hình thức chi</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[['cash', 'Tiền mặt'], ['transfer', 'CK'], ['installment', 'Trả góp']].map(([v, t]) => (
                  <button key={v} onClick={() => setMethod(v)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: `1px solid ${method === v ? '#b45309' : '#dde3ef'}`, background: method === v ? '#fff7ed' : '#fff', color: method === v ? '#b45309' : '#64748b', fontWeight: method === v ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={lbl}>Số tiền (₫) *</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={{ ...inp, textAlign: 'right' }} />
            </div>
          </div>

          <div>
            <label style={lbl}>Nội dung chi *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Mua mực in, vật tư laser..." style={inp} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Nhà cung cấp / người nhận tiền</label><input value={payeeName} onChange={e => setPayeeName(e.target.value)} placeholder="VD: NCC Thiết bị ABC / tên người nhận" style={inp} /></div>
            <div><label style={lbl}>SĐT người nhận</label><input value={payeePhone} onChange={e => setPayeePhone(e.target.value)} placeholder="VD: 0901234567" style={inp} /></div>
          </div>

          {method === 'transfer' && (
            <div style={{ background: '#f8fafc', border: '1px solid #e8edf5', borderRadius: 9, padding: '12px 13px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ gridColumn: '1 / -1', fontSize: 11, fontWeight: 700, color: '#475569' }}>Thông tin nhận tiền (chuyển khoản)</div>
              <div><label style={lbl}>Số tài khoản</label><input value={payeeAccount} onChange={e => setPayeeAccount(e.target.value)} placeholder="VD: 0123456789" style={inp} /></div>
              <div><label style={lbl}>Ngân hàng</label><input value={payeeBank} onChange={e => setPayeeBank(e.target.value)} placeholder="VD: Vietcombank — CN..." style={inp} /></div>
            </div>
          )}

          {method === 'installment' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 9, padding: '12px 13px' }}>
              <div><label style={lbl}>Số kỳ (tháng) *</label><input type="number" value={soKy} onChange={e => setSoKy(e.target.value)} placeholder="VD: 12" style={inp} /></div>
              <div><label style={lbl}>Ngày kỳ đầu</label><input type="date" value={kyDau} onChange={e => setKyDau(e.target.value)} style={inp} /></div>
              <div style={{ gridColumn: '1 / -1', fontSize: 11, color: '#92400e' }}>
                {Number(soKy || 0) >= 1 && Number(amount || 0) > 0
                  ? `≈ ${fmt(Math.floor(Number(amount) / Number(soKy)))}đ/kỳ × ${soKy} kỳ (kỳ cuối bù lẻ).`
                  : 'Nhập tổng tiền + số kỳ để xem lịch trả.'}
              </div>
            </div>
          )}

          {isAdvance && (
            <div style={{ fontSize: 11, color: '#6d28d9', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8, padding: '8px 11px' }}>
              💡 Tạm ứng lương: chi xong sẽ trừ vào “Thực lãnh” của người được ứng trong tháng.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Hạn cần chi (tùy chọn)</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Ghi chú tài liệu (nếu có)</label><input value={attachNote} onChange={e => setAttachNote(e.target.value)} placeholder="VD: báo giá số..., hợp đồng..." style={inp} /></div>
          </div>

          <div>
            <label style={lbl}>Hồ sơ báo giá / hợp đồng (tải lên)</label>
            <input type="file" multiple onChange={onUpload} style={{ fontSize: 12 }} />
            {uploading && <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 8 }}>Đang tải...</span>}
            {docs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                {docs.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <a href={d.url} target="_blank" rel="noreferrer" style={{ color: '#b45309', textDecoration: 'none' }}>📎 {d.name}</a>
                    <button onClick={() => setDocs(ds => ds.filter((_, j) => j !== i))} style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: 11 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Lý do / diễn giải</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Chi tiết khoản chi..." style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={coVat} onChange={e => setCoVat(e.target.checked)} /> Có hóa đơn VAT đầu vào
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#374151', cursor: 'pointer' }}>
              <input type="checkbox" checked={urgent} onChange={e => setUrgent(e.target.checked)} /> Chi gấp / ưu tiên
            </label>
          </div>

          <div style={{ fontSize: 11, color: '#94a3b8' }}>📎 Chứng từ chi (ủy nhiệm chi/biên nhận) bổ sung ở bước <b>Ghi chi</b> — do người chi tải lên sau khi đã chi.</div>

          {/* Preview chuỗi duyệt theo bộ phận */}
          <div style={{ background: '#f8fafc', border: '1px solid #e8edf5', borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
              Chuỗi duyệt (theo bộ phận của bạn{Number(amount || 0) >= 1000000 ? ' · ≥1tr → cần Chủ DN' : ''})
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
