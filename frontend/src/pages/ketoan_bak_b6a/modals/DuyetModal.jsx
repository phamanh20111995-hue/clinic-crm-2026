import { useState, useEffect } from 'react'
import { IconX, IconCheck } from '@tabler/icons-react'
import { approveContract } from '../../../api/ketoan'
import toast from 'react-hot-toast'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function DuyetModal({ onClose, onDone, contract }) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handleApprove = async () => {
    setSaving(true)
    try {
      await approveContract(contract.id, { notes })
      toast.success(`Đã duyệt HĐ ${contract.contract_no} — DT ghi chính thức`)
      onDone?.(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi duyệt HĐ')
    } finally { setSaving(false) }
  }

  const inputStyle = { width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 440, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Duyệt HĐ — {contract?.contract_no}</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div><span style={{ color: '#64748b' }}>Khách hàng:</span> <b>{contract?.customer_name}</b></div>
              <div><span style={{ color: '#64748b' }}>Người tạo:</span> <b>{contract?.created_by_name}</b></div>
              <div><span style={{ color: '#64748b' }}>Dịch vụ:</span> <b>{contract?.items?.[0]?.name ?? '—'}</b></div>
              <div><span style={{ color: '#64748b' }}>Loại:</span> <b>{contract?.loai_dv === 'benh_ly' ? 'Bệnh lý' : 'Thẩm mỹ'}</b></div>
            </div>
            <div style={{ marginTop: 8, borderTop: '1px solid #bbf7d0', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Số tiền xác nhận:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#15803d' }}>{fmt(contract?.final_amount)}đ</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ghi chú KT (không bắt buộc)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Xác nhận đúng..." rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 11, color: '#92400e' }}>
            ⚠️ Sau khi duyệt, doanh thu sẽ được ghi chính thức vào sổ tài chính.
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Hủy</button>
            <button onClick={handleApprove} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 7, border: 'none', background: saving ? '#d1d5db' : '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> {saving ? '...' : 'Xác nhận duyệt'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
