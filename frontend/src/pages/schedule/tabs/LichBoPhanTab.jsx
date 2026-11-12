import { useState, useEffect, useCallback } from 'react'
import { IconChevronLeft, IconChevronRight, IconCalendarEvent, IconSearch } from '@tabler/icons-react'
import { getDepartmentWeekShifts } from '../../../api/attendance'
import { getClinics } from '../../../api/clinics'
import KetoanListShell from '../../ketoan/components/KetoanListShell'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'

const ACCENT = '#0369a1'
const MANAGEMENT = ['QUAN_LY', 'CHU_DN', 'KE_TOAN']
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
const DEPARTMENTS = ['Tele', 'Sale', 'CSKH', 'MKT', 'Trực page', 'Y tế', 'Lễ tân', 'Kế toán', 'Ban quản lý']
const SHIFT_BG = { sang: ['#dbeafe', '#1e40af'], chieu: ['#fef3c7', '#92400e'], toi: ['#ede9fe', '#6d28d9'], full: ['#dcfce7', '#15803d'] }
const STATUS_RING = { pending: '1.5px solid #fbbf24', approved: 'none', rejected: '1.5px solid #fca5a5' }

const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function getMonday(s) { const b = s ? new Date(`${s}T00:00:00`) : new Date(); const day = b.getDay(); b.setDate(b.getDate() + (day === 0 ? -6 : 1 - day)); return toISO(b) }
const addDays = (s, n) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + n); return toISO(d) }
const dshort = s => { const d = new Date(`${s}T00:00:00`); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` }

const th = { padding: '8px 12px', textAlign: 'center', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }
const thFrz = { ...th, textAlign: 'left', left: 0, zIndex: 4, boxShadow: '6px 0 6px -4px rgba(15,23,42,0.08)' }
const td = { padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap', textAlign: 'center' }
const tdFrz = { ...td, textAlign: 'left', position: 'sticky', left: 0, background: '#fff', zIndex: 2, boxShadow: '6px 0 6px -4px rgba(15,23,42,0.08)' }
const selStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: '#fff', color: '#334155', outline: 'none', cursor: 'pointer' }
const navBtn = { border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 3 }
const inp = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

export default function LichBoPhanTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isManagement = MANAGEMENT.includes(role)

  const [weekStart, setWeekStart] = useState(() => getMonday())
  const [data, setData] = useState({ department: null, assignments: [] })
  const [loading, setLoading] = useState(false)
  const [clinics, setClinics] = useState([])
  const [selDept, setSelDept] = useState('')
  const [fCs, setFCs] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { week_start: weekStart }
      if (isManagement && selDept) params.department = selDept
      const r = await getDepartmentWeekShifts(params)
      setData(r.data ?? { department: null, assignments: [] })
    } catch { setData({ department: null, assignments: [] }) } finally { setLoading(false) }
  }, [weekStart, selDept, isManagement])
  useEffect(() => { load() }, [load])
  useEffect(() => { getClinics().then(r => setClinics(r.data?.results ?? r.data ?? [])).catch(() => {}) }, [])
  useEffect(() => { setPage(1) }, [weekStart, selDept, fCs, q])

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  // group by user → date
  const byUser = {}
  for (const a of (data.assignments ?? [])) {
    if (fCs && String(a.clinic ?? '') !== String(fCs)) continue
    if (q && !(a.user_name || '').toLowerCase().includes(q.toLowerCase())) continue
    const key = a.user_name ?? '—'
    if (!byUser[key]) byUser[key] = { user_name: a.user_name, department_display: a.department_display, clinic_name: a.clinic_name, byDate: {} }
    if (!byUser[key].byDate[a.date]) byUser[key].byDate[a.date] = []
    byUser[key].byDate[a.date].push(a)
  }
  const users = Object.values(byUser)
  const pagedUsers = users.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)

  const visAssigns = (data.assignments ?? []).filter(a => (!fCs || String(a.clinic ?? '') === String(fCs)) && (!q || (a.user_name || '').toLowerCase().includes(q.toLowerCase())))
  const acnt = k => visAssigns.filter(a => a.status === k).length
  const card = (label, value, sub, accent) => (
    <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '11px 14px' }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: accent, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
    </div>
  )
  const stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }}>
      {card('Tổng ca trong tuần', visAssigns.length, `${users.length} nhân sự có lịch`, ACCENT)}
      {card('Chờ duyệt', acnt('pending'), 'Cần duyệt', '#854d0e')}
      {card('Đã duyệt', acnt('approved'), 'Trong tuần', '#15803d')}
      {card('Từ chối', acnt('rejected'), '', '#dc2626')}
    </div>
  )

  const toolbar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#0f2044' }}>Lịch bộ phận theo tuần{data.department ? ` — ${data.department}` : ''}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} style={navBtn}><IconChevronLeft size={14} /> Tuần trước</button>
          <span style={{ fontWeight: 700, color: '#0f2044', fontSize: 12, minWidth: 130, textAlign: 'center' }}>{dshort(weekDays[0])} – {dshort(weekDays[6])}</span>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} style={navBtn}>Tuần sau <IconChevronRight size={14} /></button>
          <button onClick={() => setWeekStart(getMonday())} style={{ ...navBtn, background: '#eff6ff', color: ACCENT, borderColor: ACCENT, fontWeight: 600 }}>Tuần này</button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 200 }}>
          <IconSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm nhân viên..." style={{ ...inp, paddingLeft: 28, width: '100%' }} />
        </div>
        {isManagement && <select value={selDept} onChange={e => setSelDept(e.target.value)} style={selStyle}><option value="">— Phòng của tôi —</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>}
        <select value={fCs} onChange={e => setFCs(e.target.value)} style={selStyle}><option value="">Tất cả cơ sở</option>{clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input type="date" onChange={e => e.target.value && setWeekStart(getMonday(e.target.value))} title="Nhảy tới tuần chứa ngày" style={selStyle} />
        <span style={{ fontSize: 10, color: '#94a3b8' }}>· viền vàng = chờ duyệt</span>
      </div>
    </div>
  )

  return (
    <KetoanListShell stats={stats} toolbar={toolbar} pagination={{ page, pageSize, count: users.length, onPage: setPage, onPageSize: setPageSize }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 980 }}>
        <thead><tr>
          <th style={thFrz}>Nhân viên / Bộ phận</th>
          {weekDays.map((d, i) => <th key={d} style={th}>{DAY_LABELS[i]}<br /><span style={{ color: '#94a3b8', fontWeight: 400 }}>{dshort(d)}</span></th>)}
        </tr></thead>
        <tbody>
          {loading ? <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 32 }} colSpan={8}>Đang tải...</td></tr>
            : users.length === 0 ? <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 32 }} colSpan={8}>Chưa có ca trong tuần này</td></tr>
              : pagedUsers.map(u => (
                <tr key={u.user_name}>
                  <td style={tdFrz}><div style={{ fontWeight: 600, color: '#0f2044' }}>{u.user_name || '—'}</div><div style={{ fontSize: 9, color: '#94a3b8' }}>{u.department_display || ''}{u.clinic_name ? ' · ' + u.clinic_name : ''}</div></td>
                  {weekDays.map(d => (
                    <td key={d} style={td}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        {(u.byDate[d] ?? []).map(a => {
                          const bg = SHIFT_BG[a.shift_detail?.name] || ['#f1f5f9', '#475569']
                          return <span key={a.id} title={a.status_display || a.status} style={{ background: bg[0], color: bg[1], padding: '2px 7px', borderRadius: 6, fontSize: 9, fontWeight: 700, outline: STATUS_RING[a.status] || 'none' }}>{a.shift_detail?.name_display ?? a.shift_detail?.name ?? 'ca'}</span>
                        })}
                        {!(u.byDate[d] ?? []).length && <span style={{ color: '#e2e8f0' }}>·</span>}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </KetoanListShell>
  )
}
