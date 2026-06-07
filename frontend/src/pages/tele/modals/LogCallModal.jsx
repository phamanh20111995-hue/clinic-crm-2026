import { useState, useEffect } from 'react'
import { IconX, IconUpload } from '@tabler/icons-react'
import { logCall, createReturnRequest, createAppointment, getServices } from '../../../api/tele'
import toast from 'react-hot-toast'

const CALL_RESULTS = [
  { value: 'da_goi',     label: 'Đã gọi',             color: '#15803d' },
  { value: 'khong_nghe', label: 'Không nghe máy',      color: '#d97706' },
  { value: 'thue_bao',   label: 'Thuê bao',             color: '#9ca3af' },
  { value: 'sai_so',     label: 'Sai số',               color: '#9ca3af' },
  { value: 'hoan_so',    label: 'Hoàn số (cần duyệt)', color: '#dc2626' },
]

const CONSULT_RESULTS = [
  { value: 'dat_lich', label: '📅 Đặt lịch hẹn' },
  { value: 'hen_goi',  label: '🔁 Hẹn gọi lại' },
  { value: 'can_tv',   label: '💬 Cần tư vấn thêm' },
  { value: 'khong_qt', label: '🚫 Không quan tâm' },
]

const RETURN_REASONS = [
  { value: 'treu',          label: 'KH trêu / số ảo' },
  { value: 'khong_ton_tai', label: 'Số không tồn tại' },
  { value: 'nham_so',       label: 'Không nhớ để lại số' },
  { value: 'trung',         label: 'Số trùng KH cũ' },
]

// Default to tomorrow 09:00 so time is always in the future on open
function defaultApptDate() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 100, padding: 16,
}
const modal = {
  background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,.2)',
}
const chip = (active, color = '#6d28d9') => ({
  padding: '6px 14px', borderRadius: 99, cursor: 'pointer', fontSize: 12,
  fontWeight: 600, border: `1.5px solid ${active ? color : '#dde3ef'}`,
  background: active ? color : '#fff', color: active ? '#fff' : '#374151',
  transition: 'all .15s',
})

// Parse DRF error response into a human-readable string
function parseApiError(err) {
  const data = err?.response?.data
  if (!data) return 'Lỗi kết nối — thử lại'
  if (typeof data === 'string') return data
  if (typeof data === 'object') {
    // Try detail field first
    if (data.detail) return data.detail
    // Collect field-level errors
    const msgs = []
    for (const [field, val] of Object.entries(data)) {
      const msg = Array.isArray(val) ? val.join(', ') : String(val)
      msgs.push(`${field}: ${msg}`)
    }
    if (msgs.length) return msgs.join(' | ')
  }
  return 'Lỗi lưu kết quả'
}

export default function LogCallModal({ customer, onClose, onDone, accent = '#0369a1' }) {
  const [callResult, setCallResult]       = useState('')
  const [consultResult, setConsultResult] = useState('')
  const [notes, setNotes]                 = useState('')
  const [returnReason, setReturnReason]   = useState('')
  const [returnNotes, setReturnNotes]     = useState('')
  const [returnFile, setReturnFile]       = useState(null)

  // Appointment form
  const [apptDate, setApptDate]         = useState(defaultApptDate)
  const [apptTime, setApptTime]         = useState('09:00')
  const [apptServiceId, setApptServiceId] = useState('')   // integer id or ''
  const [services, setServices]         = useState([])

  // Callback form
  const [callbackDate, setCallbackDate] = useState('')
  const [callbackTime, setCallbackTime] = useState('')

  const [saving, setSaving] = useState(false)

  // Load service list once
  useEffect(() => {
    getServices()
      .then(r => {
        const list = r.data?.results ?? r.data ?? []
        setServices(Array.isArray(list) ? list.filter(s => s.is_active !== false) : [])
      })
      .catch(() => setServices([]))
  }, [])

  const callNum = (customer.call_count ?? 0) + 1

  // Check if chosen appointment datetime is in the future
  const apptInPast = apptDate && apptTime
    ? new Date(`${apptDate}T${apptTime}:00`) <= new Date()
    : false

  const handleSave = async () => {
    if (!callResult) { toast.error('Chọn kết quả cuộc gọi'); return }

    // Validate appointment time before hitting API
    if (consultResult === 'dat_lich') {
      if (!apptDate || !apptTime) { toast.error('Chọn ngày và giờ hẹn'); return }
      if (apptInPast) { toast.error('Giờ hẹn phải ở tương lai'); return }
    }

    setSaving(true)
    try {
      if (callResult === 'hoan_so') {
        if (!returnReason) { toast.error('Chọn lý do hoàn số'); setSaving(false); return }
        const fd = new FormData()
        fd.append('customer_id', customer.id)
        fd.append('reason', returnReason)
        fd.append('notes', returnNotes)
        if (returnFile) fd.append('recording_file', returnFile)
        await createReturnRequest(fd)
        toast.success('Đã gửi yêu cầu hoàn số — chờ Lead Tele duyệt')
      } else {
        const payload = {
          customer_id: customer.id,
          result: callResult,
          consult_result: consultResult,
          notes: notes + (callbackDate ? ` | Hẹn gọi lại: ${callbackDate} ${callbackTime}` : ''),
        }
        await logCall(payload)

        if (consultResult === 'dat_lich') {
          const scheduledAt = `${apptDate}T${apptTime}:00`
          const apptPayload = {
            customer: customer.id,
            scheduled_at: scheduledAt,
            notes,
          }
          // Only include service if an ID was selected
          if (apptServiceId !== '') {
            apptPayload.service = Number(apptServiceId)
          }
          await createAppointment(apptPayload)
          toast.success('Đã ghi kết quả & tạo lịch hẹn!')
        } else {
          toast.success('Đã ghi kết quả gọi')
        }
      }
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(parseApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modal}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14,
            }}>
              {(customer.full_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{customer.full_name}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{customer.phone} · Lần gọi #{callNum}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <IconX size={20} />
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Kết quả cuộc gọi */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Kết quả cuộc gọi
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {CALL_RESULTS.map(r => (
                <button key={r.value}
                  onClick={() => { setCallResult(r.value); setConsultResult('') }}
                  style={chip(callResult === r.value, r.color)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Đã gọi → kết quả tư vấn */}
          {callResult === 'da_goi' && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kết quả tư vấn
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CONSULT_RESULTS.map(r => (
                  <button key={r.value}
                    onClick={() => setConsultResult(r.value)}
                    style={chip(consultResult === r.value, accent)}>
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Đặt lịch → form */}
              {consultResult === 'dat_lich' && (
                <div style={{ marginTop: 12, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginBottom: 10 }}>📅 Thông tin lịch hẹn</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Ngày hẹn *</label>
                      <input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)}
                        style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Giờ hẹn *</label>
                      <input type="time" value={apptTime} onChange={e => setApptTime(e.target.value)}
                        style={{ width: '100%', border: `1px solid ${apptInPast ? '#fca5a5' : '#dde3ef'}`, borderRadius: 7, padding: '6px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>

                  {/* Past-time warning */}
                  {apptInPast && (
                    <p style={{ fontSize: 11, color: '#dc2626', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      ⚠️ Giờ hẹn phải ở tương lai
                    </p>
                  )}

                  {/* Service dropdown */}
                  <div>
                    <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Dịch vụ</label>
                    <select
                      value={apptServiceId}
                      onChange={e => setApptServiceId(e.target.value)}
                      style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
                    >
                      <option value="">-- Chưa xác định --</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {services.length === 0 && (
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '4px 0 0' }}>Không có danh sách dịch vụ — có thể để trống</p>
                    )}
                  </div>
                </div>
              )}

              {/* Hẹn gọi lại */}
              {consultResult === 'hen_goi' && (
                <div style={{ marginTop: 12, padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginBottom: 8 }}>🔁 Lịch gọi lại</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Ngày</label>
                      <input type="date" value={callbackDate} onChange={e => setCallbackDate(e.target.value)}
                        style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Giờ</label>
                      <input type="time" value={callbackTime} onChange={e => setCallbackTime(e.target.value)}
                        style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hoàn số */}
          {callResult === 'hoan_so' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>
                  ⚠️ Yêu cầu hoàn số — cần Lead Tele duyệt trong 24h
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Lý do hoàn số *
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {RETURN_REASONS.map(r => (
                    <button key={r.value} onClick={() => setReturnReason(r.value)}
                      style={chip(returnReason === r.value, '#dc2626')}>
                      {r.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Ghi âm cuộc gọi</label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', borderRadius: 7, border: '1px dashed #fca5a5',
                    cursor: 'pointer', fontSize: 12, color: '#6b7280',
                  }}>
                    <IconUpload size={14} stroke={2} />
                    {returnFile ? returnFile.name : 'Chọn file ghi âm (tùy chọn)'}
                    <input type="file" accept="audio/*" style={{ display: 'none' }}
                      onChange={e => setReturnFile(e.target.files[0])} />
                  </label>
                </div>
                <div style={{ marginTop: 8 }}>
                  <textarea placeholder="Ghi chú thêm về lý do hoàn số..." value={returnNotes}
                    onChange={e => setReturnNotes(e.target.value)}
                    style={{ width: '100%', border: '1px solid #fecaca', borderRadius: 7, padding: '6px 10px', fontSize: 12, resize: 'vertical', minHeight: 60, boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>
          )}

          {/* Ghi chú chung */}
          {callResult && callResult !== 'hoan_so' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#374151', display: 'block', marginBottom: 4 }}>Ghi chú</label>
              <textarea
                placeholder="Nội dung tư vấn, quan tâm dịch vụ, ghi chú thêm..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '8px 10px', fontSize: 13, resize: 'vertical', minHeight: 72, boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose}
              style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Hủy
            </button>
            <button onClick={handleSave} disabled={saving || !callResult}
              style={{
                padding: '8px 20px', borderRadius: 7, border: 'none',
                background: callResult && !saving ? accent : '#d1d5db',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: saving || !callResult ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}>
              {saving ? 'Đang lưu...' : 'Lưu kết quả'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
