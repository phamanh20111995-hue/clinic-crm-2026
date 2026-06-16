import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconRefresh, IconX, IconCheck, IconCalendarWeek } from '@tabler/icons-react'
import { getShifts, getShiftAssignments, createShiftAssignment, approveShiftAssignment } from '../../../api/attendance'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import Pagination from '../../../components/ui/Pagination'
import toast from 'react-hot-toast'

const APPROVER_ROLES = ['QUAN_LY', 'CHU_DN', 'LEAD_TELE', 'LEAD_SALE', 'LEAD_CSKH', 'LEAD_MKT', 'LEAD_TRUC_PAGE']
const ACCENT = '#0369a1'

const STATUS_CFG = {
  pending:  { label: 'Chờ duyệt', bg: '#fef9c3', color: '#854d0e' },
  approved: { label: 'Đã duyệt',  bg: '#dcfce7', color: '#15803d' },
  rejected: { label: 'Từ chối',   bg: '#fee2e2', color: '#dc2626' },
}

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

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

function fmtShift(shift) {
  if (!shift) return '—'
  const name = shift.name_display ?? shift.name ?? '—'
  if (shift.start_time && shift.end_time) {
    return `${name} (${shift.start_time.slice(0,5)}–${shift.end_time.slice(0,5)})`
  }
  return name
}

function toISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + day
}

function getMonday(dateStr) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date()
  const day = base.getDay() // 0 = Sun .. 6 = Sat
  const diff = day === 0 ? -6 : 1 - day
  base.setDate(base.getDate() + diff)
  return toISODate(base)
}

function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }

function CaLamViecApproveModal({ onClose, onDone, assignment }) {
  const [saving, setSaving] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const handle = async (approved) => {
    setSaving(true)
    try {
      if (assignment?.id) {
        await approveShiftAssignment(assignment.id, { action: approved ? 'approve' : 'reject', reason })
      }
      toast.success(approved ? `Đã duyệt ca cho ${assignment?.user_name ?? ''}` : 'Đã từ chối đơn đăng ký ca')
      onDone?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Lỗi xử lý')
    } finally { setSaving(false) }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: '#0f2044', margin: 0 }}>Ca làm việc — Duyệt đơn</p>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 11, lineHeight: 1.8 }}>
            <b>{assignment?.user_name ?? 'Nhân viên'}</b> đăng ký ca {fmtShift(assignment?.shift_detail)}<br />
            Ngày: {fmtDate(assignment?.date)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>Ghi chú (tuỳ chọn)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Lý do từ chối hoặc ghi chú duyệt..."
              style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #dde3ef', fontSize: 12, color: '#0f2044' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ padding: '7px 14px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Đóng</button>
            <button onClick={() => handle(false)} disabled={saving}
              style={{ padding: '7px 14px', borderRadius: 7, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Từ chối
            </button>
            <button onClick={() => handle(true)} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 7, border: 'none', background: '#15803d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <IconCheck size={14} /> Duyệt ca
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CaLamViecTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isApprover = APPROVER_ROLES.includes(role)

  const [shifts, setShifts]             = useState([])
  const [assignments, setAssignments]   = useState([])
  const [loading, setLoading]           = useState(true)
  const [submitting, setSubmitting]     = useState(false)
  const [approveModal, setApproveModal] = useState(null)

  // ── Đăng ký theo tuần ──
  const [weekStart, setWeekStart] = useState(() => getMonday())
  const [weekChecks, setWeekChecks] = useState({})

  // ── Phân trang bảng đăng ký ca (server-side) ──
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalCount, setTotalCount] = useState(0)

  const loadShifts = useCallback(async () => {
    const r = await getShifts()
    const data = r.data?.results ?? r.data ?? []
    setShifts(Array.isArray(data) ? data : [])
  }, [])

  const loadAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getShiftAssignments({ page, page_size: pageSize })
      const data = r.data
      if (Array.isArray(data)) {
        setAssignments(data)
        setTotalCount(data.length)
      } else {
        setAssignments(data?.results ?? [])
        setTotalCount(data?.count ?? 0)
      }
    } catch {
      setAssignments([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => { loadShifts() }, [loadShifts])
  useEffect(() => { loadAssignments() }, [loadAssignments])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const regShifts = shifts

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setPage(1)
  }

  const toggleCheck = (date, shiftId) => {
    const key = `${date}|${shiftId}`
    setWeekChecks(c => ({ ...c, [key]: !c[key] }))
  }

  const handleSubmitWeek = async () => {
    const entries = Object.entries(weekChecks).filter(([, checked]) => checked)
    if (entries.length === 0) { toast.error('Chưa chọn ca nào'); return }
    setSubmitting(true)
    let success = 0
    let failed = 0
    for (const [key] of entries) {
      const [date, shiftId] = key.split('|')
      try {
        await createShiftAssignment({ shift: shiftId, date })
        success++
      } catch {
        failed++
      }
    }
    setSubmitting(false)
    setWeekChecks({})
    if (success) toast.success(`Đã gửi ${success} đăng ký ca, chờ duyệt`)
    if (failed) toast.error(`${failed} ca đăng ký thất bại`)
    loadAssignments()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>Ca làm việc</span>
        <button onClick={() => { loadShifts(); loadAssignments() }} style={btnOutline}><IconRefresh size={13} /> Làm mới</button>
      </div>

      <div style={{ padding: '14px 14px 84px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Đăng ký ca theo tuần ── */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <IconCalendarWeek size={13} color={ACCENT} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>Đăng ký ca theo tuần</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={labelStyle}>Tuần bắt đầu (Thứ 2)</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={e => setWeekStart(getMonday(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>

            {regShifts.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Chưa có ca làm việc nào được cấu hình</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>Ca</th>
                      {weekDays.map((d, i) => (
                        <th key={d} style={{ padding: '7px 11px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>
                          {DAY_LABELS[i]}<br />{fmtDate(d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {regShifts.map(s => (
                      <tr key={s.id}>
                        <td style={{ ...td, fontWeight: 600, color: '#0f2044' }}>{fmtShift(s)}</td>
                        {weekDays.map(d => (
                          <td key={`${s.id}-${d}`} style={{ ...td, textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={!!weekChecks[`${d}|${s.id}`]}
                              onChange={() => toggleCheck(d, s.id)}
                              style={{ width: 15, height: 15, cursor: 'pointer' }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSubmitWeek} disabled={submitting} style={btnPrimary}>
                <IconPlus size={13} /> {submitting ? 'Đang gửi...' : 'Gửi đăng ký tuần'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Ca của tôi / Tất cả ca đăng ký ── */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>{isApprover ? 'Tất cả ca đăng ký' : 'Ca của tôi'}</span>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{totalCount} đơn</span>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Đang tải...</div>
          ) : assignments.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🗓️</div>
              <div style={{ fontSize: 12 }}>Chưa có ca đăng ký nào</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {[
                      ...(isApprover ? ['Nhân viên / Bộ phận'] : []),
                      'Ca làm việc', 'Ngày', 'Trạng thái', 'Người duyệt',
                      ...(isApprover ? ['Thao tác'] : []),
                    ].map(h => (
                      <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.id} style={{ background: a.status === 'rejected' ? '#fef2f2' : '#fff' }}>
                      {isApprover && (
                        <td style={td}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{a.user_name ?? '—'}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>{a.department_display ?? ''}</div>
                        </td>
                      )}
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#0f2044' }}>{fmtShift(a.shift_detail)}</div>
                      </td>
                      <td style={td}>{fmtDate(a.date)}</td>
                      <td style={td}><StatusBadge status={a.status} /></td>
                      <td style={{ ...td, color: '#64748b' }}>{a.approved_by_name ?? '—'}</td>
                      {isApprover && (
                        <td style={td}>
                          {a.can_approve ? (
                            <button onClick={() => setApproveModal(a)}
                              style={{ padding: '3px 10px', borderRadius: 5, border: 'none', background: ACCENT, color: '#fff', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
                              Xử lý
                            </button>
                          ) : (
                            <span style={{ fontSize: 9, color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && assignments.length > 0 && (
            <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #eef1f6', padding: '8px 14px' }}>
              <Pagination
                page={page}
                count={totalCount}
                pageSize={pageSize}
                onChange={(p) => setPage(p)}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
                showPageSize
              />
            </div>
          )}
        </div>
      </div>

      {approveModal && (
        <CaLamViecApproveModal
          assignment={approveModal}
          onClose={() => setApproveModal(null)}
          onDone={() => { loadAssignments() }}
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
