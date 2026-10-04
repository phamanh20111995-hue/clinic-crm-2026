import { useState, useEffect, useCallback } from 'react'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import { getCustomerNotes, createCustomerNote, deleteCustomerNote } from '../../../api/customerDetail'

const ACCENT = '#1e40af'

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 12, color: '#6b7280', minWidth: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{value || '—'}</span>
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '14px 18px' }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: color ?? ACCENT, margin: 0 }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: 11, color: color ?? ACCENT, margin: '2px 0 0', fontWeight: 600 }}>{sub}</p>}
      <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}

const STATUS_CFG = {
  new:           { bg: '#dbeafe', color: '#1e40af', label: 'Mới' },
  contacted:     { bg: '#e0e7ff', color: '#4338ca', label: 'Đã liên hệ' },
  consulting:    { bg: '#fef9c3', color: '#92400e', label: 'Đang tư vấn' },
  closed:        { bg: '#dcfce7', color: '#15803d', label: 'Đã chốt' },
  treatment:     { bg: '#fff7ed', color: '#c2410c', label: 'Điều trị' },
  done:          { bg: '#f0fdf4', color: '#15803d', label: 'Hoàn thành' },
  cancelled:     { bg: '#fef2f2', color: '#dc2626', label: 'Hủy' },
}

const CHANNELS = [
  { key: 'khai_thac', label: 'Khai thác' },
  { key: 'cham_soc',  label: 'Chăm sóc' },
  { key: 'dieu_tri',  label: 'Điều trị' },
  { key: 'noi_bo',    label: 'Nội bộ' },
]

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateTime(s) {
  if (!s) return '—'
  return new Date(s).toLocaleString('vi', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtMoney(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('vi') + ' ₫'
}

function NoteAvatar({ name }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
      {initial}
    </div>
  )
}

export default function TongQuanTab({ customer, contracts }) {
  const currentUser = useAuthStore(s => s.user)
  const role = getUserRole(currentUser)
  const st = STATUS_CFG[customer.status] ?? { bg: '#f3f4f6', color: '#374151', label: customer.status_display ?? customer.status }

  const totalContract = contracts.reduce((s, c) => s + Number(c.final_amount ?? 0), 0)
  const totalPaid     = contracts
    .filter(c => c.payment_status === 'paid')
    .reduce((s, c) => s + Number(c.final_amount ?? 0), 0)
  const debt          = totalContract - totalPaid

  const initial = (customer.full_name || '?')[0].toUpperCase()
  const genderLabel = customer.gender === 'M' ? 'Nam' : customer.gender === 'F' ? 'Nữ' : 'Không xác định'
  const showFinanceStats = role !== 'TRUC_PAGE'

  // Notes state
  const [activeChannel, setActiveChannel] = useState('khai_thac')
  const [notes, setNotes]                 = useState([])
  const [loadingNotes, setLoadingNotes]   = useState(false)
  const [noteText, setNoteText]           = useState('')
  const [sending, setSending]             = useState(false)

  const loadNotes = useCallback(() => {
    if (!customer?.id) return
    setLoadingNotes(true)
    getCustomerNotes(customer.id, activeChannel)
      .then(res => setNotes(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoadingNotes(false))
  }, [customer?.id, activeChannel])

  useEffect(() => { loadNotes() }, [loadNotes])

  const handleSend = async () => {
    if (!noteText.trim()) return
    setSending(true)
    try {
      await createCustomerNote({ customer: customer.id, channel: activeChannel, content: noteText.trim() })
      setNoteText('')
      loadNotes()
    } catch (_) {}
    finally { setSending(false) }
  }

  const handleDelete = async (noteId) => {
    if (!window.confirm('Xóa ghi chú này?')) return
    try {
      await deleteCustomerNote(noteId)
      loadNotes()
    } catch (_) {}
  }

  const canDelete = (note) =>
    note.author === currentUser?.id || ['QUAN_LY', 'CHU_DN'].includes(role)

  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* ===== CỘT TRÁI ===== */}
      <div style={{ flex: '1.1 1 320px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* KH Header Card */}
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: ACCENT, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, flexShrink: 0 }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{customer.full_name}</h2>
              <span style={{ fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 99 }}>
                {st.label}
              </span>
              <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', padding: '2px 8px', borderRadius: 99 }}>
                {customer.data_type_display ?? customer.data_type}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#374151' }}>📞 {customer.phone}</span>
              {customer.source_display && <span style={{ fontSize: 13, color: '#374151' }}>📌 {customer.source_display}</span>}
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Tạo: {fmtDate(customer.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {showFinanceStats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <StatCard label="Tổng HĐ"        value={contracts.length}       color={ACCENT} />
            <StatCard label="Tổng chi tiêu"   value={fmtMoney(totalContract)} color="#15803d" />
            <StatCard label="Đã thanh toán"   value={fmtMoney(totalPaid)}    color="#0369a1" />
            <StatCard label="Công nợ"         value={fmtMoney(debt)}         color={debt > 0 ? '#dc2626' : '#6b7280'} />
            <StatCard label="Số lần gọi"      value={customer.call_count ?? 0} color="#6d28d9" />
          </div>
        )}

        {/* Thông tin cơ bản */}
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Thông tin cơ bản</span>
          </div>
          <div style={{ padding: '0 16px' }}>
            <InfoRow label="Họ tên"           value={customer.full_name} />
            <InfoRow label="Số điện thoại"    value={customer.phone} />
            <InfoRow label="Giới tính"        value={genderLabel} />
            <InfoRow label="Ngày sinh"        value={fmtDate(customer.dob)} />
            <InfoRow label="Địa chỉ"          value={customer.address} />
            <InfoRow label="Email"            value={customer.email} />
            <InfoRow label="Dịch vụ quan tâm" value={(customer.services_interest_names && customer.services_interest_names.length) ? customer.services_interest_names.join(', ') : null} />
            <InfoRow label="Nguồn"            value={customer.source_display} />
            <InfoRow label="Loại data"        value={customer.data_type_display} />
            <InfoRow label="Sale phụ trách"   value={customer.sale_name} />
            <InfoRow label="Tele phụ trách"   value={customer.tele_name} />
            <InfoRow label="CSKH phụ trách"   value={customer.cskh_name} />
            <InfoRow label="Ads phụ trách"    value={customer.ads_name} />
            <InfoRow label="BS gần nhất"      value={customer.last_bs_name} />
            <InfoRow label="KTV gần nhất"     value={customer.last_ktv_name} />
            <InfoRow label="Người tạo"        value={customer.created_by_name} />
            <InfoRow label="Ngày tạo"         value={fmtDate(customer.created_at)} />
          </div>
        </div>
      </div>

      {/* ===== CỘT PHẢI — GHI CHÚ ===== */}
      <div style={{ flex: '1 1 360px', minWidth: 320, display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Card header */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Ghi chú đa kênh</span>
          </div>

          {/* Channel tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
            {CHANNELS.map(ch => (
              <button
                key={ch.key}
                onClick={() => setActiveChannel(ch.key)}
                style={{
                  flex: 1, padding: '9px 4px', fontSize: 11, fontWeight: activeChannel === ch.key ? 700 : 400,
                  color: activeChannel === ch.key ? ACCENT : '#6b7280',
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  borderBottom: activeChannel === ch.key ? `2px solid ${ACCENT}` : '2px solid transparent',
                  transition: 'color .15s',
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend() }}
              placeholder={`Ghi chú kênh ${CHANNELS.find(c => c.key === activeChannel)?.label ?? ''}… (Ctrl+Enter gửi)`}
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                border: '1px solid #dde3ef', borderRadius: 7, padding: '8px 10px',
                fontSize: 12, fontFamily: 'inherit', outline: 'none',
                color: '#111827', background: '#fff',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                onClick={handleSend}
                disabled={sending || !noteText.trim()}
                style={{
                  padding: '6px 18px', borderRadius: 7, border: 'none',
                  background: sending || !noteText.trim() ? '#d1d5db' : ACCENT,
                  color: '#fff', fontSize: 12, fontWeight: 600, cursor: sending || !noteText.trim() ? 'default' : 'pointer',
                }}
              >
                {sending ? 'Đang gửi…' : 'Gửi'}
              </button>
            </div>
          </div>

          {/* Notes list */}
          <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 480, overflowY: 'auto' }}>
            {loadingNotes ? (
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '20px 0', margin: 0 }}>Đang tải…</p>
            ) : notes.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', padding: '20px 0', margin: 0 }}>Chưa có ghi chú ở kênh này</p>
            ) : notes.map(note => (
              <div key={note.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <NoteAvatar name={note.author_name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{note.author_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{fmtDateTime(note.created_at)}</span>
                      {canDelete(note) && (
                        <button
                          onClick={() => handleDelete(note.id)}
                          title="Xóa ghi chú"
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2, lineHeight: 1, fontSize: 12 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8fafc', borderRadius: 6, padding: '6px 10px', borderLeft: `3px solid ${ACCENT}` }}>
                    {note.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
