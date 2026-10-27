import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { createPayment } from '../../../api/payments'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }
const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
const num = v => Number(v || 0)

export default function ThuNoKTModal({ onClose, onDone, contract }) {
  const con = Number(contract?.remaining ?? (Number(contract?.final_amount ?? 0) - Number(contract?.paid ?? 0)))
  const [cash, setCash] = useState('')
  const [transfer, setTransfer] = useState('')
  const [installment, setInstallment] = useState('')
  const [receivedAt, setReceivedAt] = useState(todayStr())
  const [note, setNote] = useState('')
  // Chi tiết trả góp
  const [provider, setProvider] = useState('')
  const [providerType, setProviderType] = useState('vay_tieu_dung')
  const [conversionFee, setConversionFee] = useState('')
  const [feeBearer, setFeeBearer] = useState('khach')
  const [feePk, setFeePk] = useState('')
  const [interest, setInterest] = useState('')
  const [interestBearer, setInterestBearer] = useState('khach')
  const [interestPk, setInterestPk] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const instAmt = num(installment)
  const hasInst = instAmt > 0
  const total = num(cash) + num(transfer) + instAmt

  const handleSave = async () => {
    if (total <= 0) { toast.error('Nhập số tiền thu'); return }
    if (hasInst && !provider.trim()) { toast.error('Nhập nhà tài trợ trả góp'); return }
    setSaving(true)
    try {
      const body = {
        cash_amount: num(cash),
        transfer_amount: num(transfer),
        installment_amount: instAmt,
        received_at: receivedAt,
        note,
      }
      if (hasInst) {
        body.installment = {
          provider: provider.trim(),
          provider_type: providerType,
          principal: instAmt,
          conversion_fee: num(conversionFee),
          fee_bearer: feeBearer,
          fee_pk: feeBearer === 'chia' ? num(feePk) : 0,
          fee_khach: feeBearer === 'chia' ? Math.max(0, num(conversionFee) - num(feePk)) : 0,
          interest: num(interest),
          interest_bearer: interestBearer,
          interest_pk: interestBearer === 'chia' ? num(interestPk) : 0,
          interest_khach: interestBearer === 'chia' ? Math.max(0, num(interest) - num(interestPk)) : 0,
        }
      }
      await createPayment(contract.id, body)
      toast.success(`Đã thu ${fmt(total)}đ`)
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi ghi nhận thu')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit' }
  const label = txt => <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{txt}</label>

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Thu tiền — {contract?.customer_name}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: '#991b1b', fontWeight: 600 }}>Còn nợ</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{fmt(con)}đ</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Tiền mặt (đ)')}
              <input type="number" value={cash} onChange={e => setCash(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              {label('Chuyển khoản (đ)')}
              <input type="number" value={transfer} onChange={e => setTransfer(e.target.value)} placeholder="0" style={inputStyle} />
            </div>
          </div>

          <div>
            {label('Trả góp qua đơn vị tài chính (đ)')}
            <input type="number" value={installment} onChange={e => setInstallment(e.target.value)} placeholder="0" style={inputStyle} />
          </div>

          {hasInst && (
            <div style={{ border: '1px solid #e0e7ff', background: '#f5f7ff', borderRadius: 9, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4338ca' }}>Chi tiết trả góp</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  {label('Nhà tài trợ')}
                  <input value={provider} onChange={e => setProvider(e.target.value)} placeholder="Home Credit / FE / VNPAY..." style={inputStyle} />
                </div>
                <div>
                  {label('Loại')}
                  <select value={providerType} onChange={e => setProviderType(e.target.value)} style={inputStyle}>
                    <option value="vay_tieu_dung">Vay tiêu dùng (chờ giải ngân)</option>
                    <option value="the_tin_dung">Thẻ tín dụng (về ngay)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  {label('Phí chuyển đổi (đ)')}
                  <input type="number" value={conversionFee} onChange={e => setConversionFee(e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  {label('Phí — bên chịu')}
                  <select value={feeBearer} onChange={e => setFeeBearer(e.target.value)} style={inputStyle}>
                    <option value="khach">Khách chịu</option>
                    <option value="pk">Phòng khám chịu</option>
                    <option value="chia">Chia</option>
                  </select>
                </div>
              </div>
              {feeBearer === 'chia' && (
                <div>
                  {label('Phí — PK chịu (đ)')}
                  <input type="number" value={feePk} onChange={e => setFeePk(e.target.value)} placeholder="0" style={inputStyle} />
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Khách chịu phần còn lại: {fmt(Math.max(0, num(conversionFee) - num(feePk)))}đ</div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  {label('Lãi trả góp (đ)')}
                  <input type="number" value={interest} onChange={e => setInterest(e.target.value)} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  {label('Lãi — bên chịu')}
                  <select value={interestBearer} onChange={e => setInterestBearer(e.target.value)} style={inputStyle}>
                    <option value="khach">Khách chịu</option>
                    <option value="pk">PK chịu (hoàn khách)</option>
                    <option value="chia">Chia</option>
                  </select>
                </div>
              </div>
              {interestBearer === 'chia' && (
                <div>
                  {label('Lãi — PK chịu (đ)')}
                  <input type="number" value={interestPk} onChange={e => setInterestPk(e.target.value)} placeholder="0" style={inputStyle} />
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Khách chịu phần còn lại: {fmt(Math.max(0, num(interest) - num(interestPk)))}đ</div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              {label('Ngày thu')}
              <input type="date" value={receivedAt} onChange={e => setReceivedAt(e.target.value)} style={inputStyle} />
            </div>
            <div>
              {label('Tổng thu')}
              <div style={{ padding: '7px 10px', fontSize: 16, fontWeight: 800, color: '#15803d' }}>{fmt(total)}đ</div>
            </div>
          </div>

          <div>
            {label('Ghi chú')}
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Tùy chọn..." style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Ghi nhận thu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
