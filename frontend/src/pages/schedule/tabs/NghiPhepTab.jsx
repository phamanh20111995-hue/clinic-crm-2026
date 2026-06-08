import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconRefresh } from '@tabler/icons-react'
import { getLeaves, createLeave } from '../../../api/attendance'
import NghiPhepKTModal from '../../ketoan/modals/NghiPhepKTModal'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import toast from 'react-hot-toast'

const MANAGEMENT_ROLES = ['QUAN_LY', 'CHU_DN']
const APPROVER_ROLES = ['QUAN_LY', 'CHU_DN', 'LEAD_TELE', 'LEAD_SALE', 'LEAD_CSKH', 'LEAD_MKT', 'LEAD_TRUC_PAGE']
const ACCENT = '#0369a1'

const STATUS_CFG = {
  pending:  { label: 'Chờ duyệt', bg: '#fef9c3', color: '#854d0e' },
  approved: { label: 'Đã duyệt',  bg: '#dcfce7', color: '#15803d' },
  rejected: { label: 'Từ chối',   bg: '#fee2e2', color: '#dc2626' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status, bg: '#f1f5f9', color: '#64748b' }
  return (
    <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi-VN')
}

function fmtTimeRange(l) {
  const base = `${fmtDate(l.start_date)} – ${fmtDate(l.end_date)}`
  const durLabel = l.duration_type_display ?? ''
  if (l.duration_type === 'hourly' && l.start_time && l.end_time) {
    return `${base}\n${l.start_time.slice(0,5)}–${l.end_time.slice(0,5)}`
  }
  if (l.duration_type && l.duration_type !== 'full_day') {
    return `${base}\n(${durLabel})`
  }
  return base
}

const LEAVE_TYPES = [
  { value: 'annual', label: 'Nghỉ phép năm' },
  { value: 'sick',   label: 'Nghỉ ốm' },
  { value: 'unpaid', label: 'Nghỉ không lương' },
]

const DURATION_TYPES = [
  { value: 'full_day',       label: 'Cả ngày' },
  { value: 'half_morning',   label: 'Nửa ngày sáng' },
  { value: 'half_afternoon', label: 'Nửa ngày chiều' },
  { value: 'hourly',         label: 'Theo giờ' },
]

const EMPTY_FORM = { leave_type: 'annual', duration_type: 'full_day', start_date: '', end_date: '', start_time: '', end_time: '', reason: '' }

export default function NghiPhepTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isApprover = APPROVER_ROLES.includes(role)

  const [myLeaves, setMyLeaves]         = useState([])
  const [pendingLeaves, setPending]     = useState([])
  const [loadingMy, setLoadingMy]       = useState(true)
  const [loadingPending, setLoadingP]   = useState(false)
  const [form, setForm]                 = useState(EMPTY_FORM)
  const [submitting, setSubmitting]     = useState(false)
  const [approveModal, setApproveModal] = useState(null)

  const loadMy = useCallback(async () => {
    setLoadingMy(true)
    try {
      const r = await getLeaves()
      const data = r.data?.results ?? r.data ?? []
      setMyLeaves(Array.isArray(data) ? data : [])
    } catch {
      setMyLeaves([])
    } finally {
      setLoadingMy(false)
    }
  }, [])

  const loadPending = useCallback(async () => {
    setLoadingP(true)
    try {
      const r = await getLeaves({ status: 'pending' })
      const data = r.data?.results ?? r.data ?? []
      // only keep leaves this user can approve (backend may already filter, belt+suspenders)
      const list = Array.isArray(data) ? data : []
      setPending(list.filter(l => l.can_approve))
    } catch {
      setPending([])
    } finally {
      setLoadingP(false)
    }
  }, [])

  useEffect(() => { loadMy(); loadPending() }, [loadMy, loadPending])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.start_date || !form.end_date) { toast.error('Chọn ngày bắt đầu và kết thúc'); return }
    if (form.duration_type === 'hourly' && (!form.start_time || !form.end_time)) {
      toast.error('Nghỉ theo giờ cần nhập giờ bắt đầu và kết thúc'); return
    }
    setSubmitting(true)
    try {
      const body = {
        leave_type:    form.leave_type,
        duration_type: form.duration_type,
        start_date:    form.start_date,
        end_date:      form.end_date,
        reason:        form.reason,
      }
      if (form.duration_type === 'hourly') {
        body.start_time = form.start_time
        body.end_time   = form.end_time
      }
      await createLeave(body)
      toast.success('Đã gửi đơn nghỉ phép, chờ HR duyệt')
      setForm(EMPTY_FORM)
      loadMy()
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? JSON.stringify(err?.response?.data) ?? 'Lỗi gửi đơn')
    } finally {
      setSubmitting(false)
    }
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isHourly = form.duration_type === 'hourly'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>Nghỉ phép</span>
        <button onClick={() => { loadMy(); loadPending() }} style={btnOutline}><IconRefresh size={13} /> Làm mới</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Đăng ký đơn ── */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconPlus size={13} color={ACCENT} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>Đăng ký nghỉ phép</span>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Loại nghỉ</label>
                <select value={form.leave_type} onChange={e => setField('leave_type', e.target.value)} style={inputStyle}>
                  {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Loại thời gian</label>
                <select value={form.duration_type} onChange={e => setField('duration_type', e.target.value)} style={inputStyle}>
                  {DURATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Từ ngày</label>
                <input type="date" value={form.start_date} onChange={e => setField('start_date', e.target.value)} style={inputStyle} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Đến ngày</label>
                <input type="date" value={form.end_date} onChange={e => setField('end_date', e.target.value)} style={inputStyle} required />
              </div>
            </div>
            {/* Row 2 — giờ (chỉ khi hourly) */}
            {isHourly && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={labelStyle}>Giờ bắt đầu</label>
                  <input type="time" value={form.start_time} onChange={e => setField('start_time', e.target.value)} style={inputStyle} required={isHourly} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={labelStyle}>Giờ kết thúc</label>
                  <input type="time" value={form.end_time} onChange={e => setField('end_time', e.target.value)} style={inputStyle} required={isHourly} />
                </div>
                <div />
              </div>
            )}
            {/* Row 3 — lý do */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={labelStyle}>Lý do</label>
              <input value={form.reason} onChange={e => setField('reason', e.target.value)} placeholder="Nhập lý do nghỉ..." style={inputStyle} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={submitting} style={btnPrimary}>
                <IconPlus size={13} /> {submitting ? 'Đang gửi...' : 'Gửi đơn'}
              </button>
            </div>
          </form>
        </div>

        {/* ── Đơn chờ duyệt ── */}
        {pendingLeaves.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
            <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>Đơn chờ duyệt</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{pendingLeaves.length} đơn</span>
            </div>
            {loadingPending ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Đang tải...</div>
            ) : pendingLeaves.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Không có đơn chờ duyệt</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Nhân viên / Bộ phận', 'Loại nghỉ', 'Thời gian', 'Lý do', 'Trạng thái', 'Thao tác'].map(h => (
                        <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeaves.map(l => (
                      <tr key={l.id}>
                        <td style={td}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{l.user_name ?? '—'}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>{l.department_display ?? ''}</div>
                        </td>
                        <td style={td}>
                          <div>{l.leave_type_display ?? l.leave_type ?? '—'}</div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>{l.duration_type_display ?? ''}</div>
                        </td>
                        <td style={{ ...td, whiteSpace: 'pre-line', fontSize: 10 }}>{fmtTimeRange(l)}</td>
                        <td style={{ ...td, maxWidth: 180, color: '#475569' }}>{l.reason || '—'}</td>
                        <td style={td}><StatusBadge status={l.status} /></td>
                        <td style={td}>
                          {l.can_approve ? (
                            <button onClick={() => setApproveModal(l)}
                              style={{ padding: '3px 10px', borderRadius: 5, border: 'none', background: ACCENT, color: '#fff', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                              Xử lý
                            </button>
                          ) : (
                            <span style={{ fontSize: 9, color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Đơn của tôi / Tất cả đơn nghỉ ── */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>{isApprover ? 'Tất cả đơn nghỉ' : 'Đơn của tôi'}</span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{myLeaves.length} đơn</span>
          </div>
          {loadingMy ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Đang tải...</div>
          ) : myLeaves.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📋</div>
              <div style={{ fontSize: 12 }}>Chưa có đơn nghỉ phép nào</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {[
                      ...(isApprover ? ['Nhân viên / Bộ phận'] : []),
                      'Loại nghỉ', 'Thời gian', 'Lý do', 'Trạng thái', 'Người duyệt', 'Ghi chú',
                    ].map(h => (
                      <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myLeaves.map(l => (
                    <tr key={l.id} style={{ background: l.status === 'rejected' ? '#fef2f2' : '#fff' }}>
                      {isApprover && (
                        <td style={td}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{l.user_name ?? '—'}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>{l.department_display ?? ''}</div>
                        </td>
                      )}
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#0f2044' }}>{l.leave_type_display ?? l.leave_type ?? '—'}</div>
                        <div style={{ fontSize: 9, color: '#64748b' }}>{l.duration_type_display ?? ''}</div>
                      </td>
                      <td style={{ ...td, whiteSpace: 'pre-line', fontSize: 10 }}>{fmtTimeRange(l)}</td>
                      <td style={{ ...td, color: '#475569', maxWidth: 180 }}>{l.reason || '—'}</td>
                      <td style={td}><StatusBadge status={l.status} /></td>
                      <td style={{ ...td, color: '#64748b' }}>{l.approved_by_name ?? '—'}</td>
                      <td style={{ ...td, color: '#dc2626', fontSize: 10 }}>{l.reject_reason || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {approveModal && (
        <NghiPhepKTModal
          leave={approveModal}
          onClose={() => setApproveModal(null)}
          onDone={() => { loadMy(); loadPending() }}
        />
      )}
    </div>
  )
}

const btnPrimary = { display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }
const btnOutline = { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 11, cursor: 'pointer' }
const labelStyle = { fontSize: 10, fontWeight: 600, color: '#475569' }
const inputStyle = { padding: '6px 10px', borderRadius: 7, border: '1px solid #dde3ef', fontSize: 12, color: '#0f2044', background: '#fff', width: '100%' }
const td = { padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }
