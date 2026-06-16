import { useState, useEffect, useCallback } from 'react'
import { IconRefresh } from '@tabler/icons-react'
import { getDepartmentWeekShifts } from '../../../api/attendance'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'

const MANAGEMENT_ROLES = ['QUAN_LY', 'CHU_DN']
const ACCENT = '#0369a1'

const STATUS_CFG = {
  pending:  { label: 'Chờ duyệt', bg: '#fef9c3', color: '#854d0e' },
  approved: { label: 'Đã duyệt',  bg: '#dcfce7', color: '#15803d' },
  rejected: { label: 'Từ chối',   bg: '#fee2e2', color: '#dc2626' },
}

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

const DEPARTMENTS = ['Tele', 'Sale', 'CSKH', 'MKT', 'Trực page', 'Y tế', 'Lễ tân', 'Kế toán', 'Ban quản lý']

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

export default function LichBoPhanTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isManagement = MANAGEMENT_ROLES.includes(role)

  const [weekStart, setWeekStart] = useState(() => getMonday())

  const [deptWeek, setDeptWeek]   = useState({ department: null, week_start: null, assignments: [] })
  const [loadingDept, setLoadingDept] = useState(false)
  const [selectedDept, setSelectedDept] = useState('')

  const loadDeptWeek = useCallback(async () => {
    setLoadingDept(true)
    try {
      const params = { week_start: weekStart }
      if (isManagement && selectedDept) params.department = selectedDept
      const r = await getDepartmentWeekShifts(params)
      setDeptWeek(r.data ?? { department: null, week_start: weekStart, assignments: [] })
    } catch {
      setDeptWeek({ department: null, week_start: weekStart, assignments: [] })
    } finally {
      setLoadingDept(false)
    }
  }, [weekStart, selectedDept, isManagement])

  useEffect(() => { loadDeptWeek() }, [loadDeptWeek])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // group dept-week assignments by user → date → list
  const deptByUser = {}
  for (const a of (deptWeek.assignments ?? [])) {
    const key = a.user_name ?? '—'
    if (!deptByUser[key]) {
      deptByUser[key] = { user_name: a.user_name, department_display: a.department_display, byDate: {} }
    }
    if (!deptByUser[key].byDate[a.date]) deptByUser[key].byDate[a.date] = []
    deptByUser[key].byDate[a.date].push(a)
  }
  const deptUsers = Object.values(deptByUser)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>Lịch bộ phận</span>
        <button onClick={() => loadDeptWeek()} style={btnOutline}><IconRefresh size={13} /> Làm mới</button>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Lịch tuần của bộ phận ── */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>
              Lịch tuần của bộ phận{deptWeek.department ? ` — ${deptWeek.department}` : ''}
            </span>
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
              {isManagement && (
                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
                  <option value="">— Phòng của tôi —</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
          </div>
          {loadingDept ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Đang tải...</div>
          ) : !deptWeek.department ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🏢</div>
              <div style={{ fontSize: 12 }}>Không xác định được bộ phận của bạn</div>
            </div>
          ) : deptUsers.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🗓️</div>
              <div style={{ fontSize: 12 }}>Chưa có ca nào trong tuần này</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>Nhân viên / Bộ phận</th>
                    {weekDays.map((d, i) => (
                      <th key={d} style={{ padding: '7px 11px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>
                        {DAY_LABELS[i]}<br />{fmtDate(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deptUsers.map(u => (
                    <tr key={u.user_name}>
                      <td style={td}>
                        <div style={{ fontWeight: 600, color: '#111827' }}>{u.user_name ?? '—'}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{u.department_display ?? ''}</div>
                      </td>
                      {weekDays.map(d => (
                        <td key={d} style={{ ...td, textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                            {(u.byDate[d] ?? []).map(a => {
                              const cfg = STATUS_CFG[a.status] ?? { bg: '#f1f5f9', color: '#64748b' }
                              return (
                                <span key={a.id}
                                  title={a.status_display}
                                  style={{ padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                                  {a.shift_detail?.name_display ?? fmtShift(a.shift_detail)}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const btnOutline = { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 11, cursor: 'pointer' }
const labelStyle = { fontSize: 10, fontWeight: 600, color: '#475569' }
const inputStyle = { padding: '6px 10px', borderRadius: 7, border: '1px solid #dde3ef', fontSize: 12, color: '#0f2044', background: '#fff', width: '100%' }
const td = { padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }
