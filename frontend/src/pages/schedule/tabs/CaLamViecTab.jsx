import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconRefresh, IconX, IconSearch, IconCalendarWeek } from '@tabler/icons-react'
import { getShifts, getShiftAssignments, createShiftAssignment, approveShiftAssignment } from '../../../api/attendance'
import { getClinics } from '../../../api/clinics'
import KetoanListShell from '../../ketoan/components/KetoanListShell'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import toast from 'react-hot-toast'

const ACCENT = '#0369a1'
const APPROVER_ROLES = ['QUAN_LY', 'CHU_DN', 'LEAD_TELE', 'LEAD_SALE', 'LEAD_CSKH', 'LEAD_MKT', 'LEAD_TRUC_PAGE']
const LST = { pending: { l: 'Chờ duyệt', bg: '#fef9c3', c: '#854d0e' }, approved: { l: 'Đã duyệt', bg: '#dcfce7', c: '#15803d' }, rejected: { l: 'Từ chối', bg: '#fee2e2', c: '#dc2626' } }
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']

const th = { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }
const thAction = { ...th, right: 0, zIndex: 3, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
const td = { padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }
const tdAction = { ...td, position: 'sticky', right: 0, background: '#fff', zIndex: 2, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)', textAlign: 'right' }
const tbl = { width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1100 }
const selStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: '#fff', color: '#334155', outline: 'none', cursor: 'pointer' }
const inp = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

const fmtDate = s => s ? new Date(s).toLocaleDateString('vi-VN') : '—'
const fmtShift = sh => { if (!sh) return '—'; const n = sh.name_display ?? sh.name ?? '—'; return sh.start_time && sh.end_time ? `${n} (${sh.start_time.slice(0, 5)}–${sh.end_time.slice(0, 5)})` : n }
const toISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function getMonday(s) { const b = s ? new Date(`${s}T00:00:00`) : new Date(); const day = b.getDay(); b.setDate(b.getDate() + (day === 0 ? -6 : 1 - day)); return toISO(b) }
const addDays = (s, n) => { const d = new Date(`${s}T00:00:00`); d.setDate(d.getDate() + n); return toISO(d) }
const Pill = ({ children, bg, c }) => <span style={{ display: 'inline-block', background: bg, color: c, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}>{children}</span>
const StatCard = ({ label, value, sub, accent }) => (
  <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '11px 14px' }}>
    <div style={{ fontSize: 19, fontWeight: 700, color: accent, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
  </div>
)

// Modal đăng ký ca theo tuần (lưới tick shift × ngày)
function RegisterModal({ shifts, clinics, onClose, onDone }) {
  const [clinic, setClinic] = useState('')
  const [weekStart, setWeekStart] = useState(() => getMonday())
  const [checks, setChecks] = useState({})
  const [saving, setSaving] = useState(false)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const toggle = (date, sid) => setChecks(c => ({ ...c, [`${date}|${sid}`]: !c[`${date}|${sid}`] }))

  const submit = async () => {
    const entries = Object.entries(checks).filter(([, v]) => v)
    if (!entries.length) return toast.error('Chưa chọn ca nào')
    setSaving(true)
    let ok = 0, fail = 0
    for (const [key] of entries) {
      const [date, sid] = key.split('|')
      try { await createShiftAssignment({ shift: sid, date, clinic: clinic || null }); ok++ } catch { fail++ }
    }
    setSaving(false)
    if (ok) toast.success(`Đã gửi ${ok} đăng ký ca, chờ duyệt`)
    if (fail) toast.error(`${fail} ca thất bại (trùng?)`)
    onDone()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 760, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid #eef1f6' }}>
          <IconCalendarWeek size={17} color={ACCENT} /><span style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>Đăng ký ca theo tuần</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 440 }}>
            <div><label style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>Chi nhánh / cơ sở</label>
              <select value={clinic} onChange={e => setClinic(e.target.value)} style={{ ...inp, width: '100%', cursor: 'pointer' }}>
                <option value="">— Chọn cơ sở —</option>{clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>Tuần bắt đầu (Thứ 2)</label>
              <input type="date" value={weekStart} onChange={e => setWeekStart(getMonday(e.target.value))} style={{ ...inp, width: '100%' }} />
            </div>
          </div>
          {shifts.length === 0 ? <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Chưa cấu hình ca làm việc</div> : (
            <div style={{ overflowX: 'auto', border: '1px solid #eef1f6', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...th, position: 'static' }}>Ca</th>
                  {weekDays.map((d, i) => <th key={d} style={{ ...th, position: 'static', textAlign: 'center' }}>{DAY_LABELS[i]}<br /><span style={{ color: '#94a3b8', fontWeight: 400 }}>{fmtDate(d)}</span></th>)}
                </tr></thead>
                <tbody>
                  {shifts.map(s => (
                    <tr key={s.id}>
                      <td style={{ ...td, fontWeight: 600, color: '#0f2044' }}>{fmtShift(s)}</td>
                      {weekDays.map(d => <td key={`${s.id}-${d}`} style={{ ...td, textAlign: 'center' }}><input type="checkbox" checked={!!checks[`${d}|${s.id}`]} onChange={() => toggle(d, s.id)} style={{ width: 15, height: 15, cursor: 'pointer' }} /></td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Tick các ca muốn đăng ký → gửi 1 lần. Đơn ở trạng thái “Chờ duyệt”.</div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid #eef1f6', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? .6 : 1 }}>{saving ? 'Đang gửi...' : '＋ Gửi đăng ký tuần'}</button>
        </div>
      </div>
    </div>
  )
}

export default function CaLamViecTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isApprover = APPROVER_ROLES.includes(role)

  const [shifts, setShifts] = useState([])
  const [rows, setRows] = useState([])
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [regOpen, setRegOpen] = useState(false)

  const [q, setQ] = useState('')
  const [fCs, setFCs] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getShiftAssignments({ page_size: 500 })
      const d = r.data
      setRows(Array.isArray(d) ? d : (d?.results ?? []))
    } catch { setRows([]) } finally { setLoading(false) }
  }, [])
  useEffect(() => {
    getShifts().then(r => setShifts(r.data?.results ?? r.data ?? [])).catch(() => {})
    getClinics().then(r => setClinics(r.data?.results ?? r.data ?? [])).catch(() => {})
    load()
  }, [load])
  useEffect(() => { setPage(1) }, [q, fCs, fStatus, pageSize])

  const filtered = rows.filter(a => {
    if (q && !(a.user_name || '').toLowerCase().includes(q.toLowerCase())) return false
    if (fCs && String(a.clinic ?? '') !== String(fCs)) return false
    if (fStatus && a.status !== fStatus) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
  const cnt = k => rows.filter(a => a.status === k).length

  const stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }}>
      <StatCard label="Tổng ca đăng ký" value={rows.length} accent={ACCENT} />
      <StatCard label="Chờ duyệt" value={cnt('pending')} sub="Cần duyệt" accent="#854d0e" />
      <StatCard label="Đã duyệt" value={cnt('approved')} accent="#15803d" />
      <StatCard label="Từ chối" value={cnt('rejected')} accent="#dc2626" />
    </div>
  )
  const toolbar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#0f2044' }}>Tất cả ca đăng ký</span>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 11 }}><IconRefresh size={12} /> Tải lại</button>
        <button onClick={() => setRegOpen(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><IconPlus size={14} /> Đăng ký ca (theo tuần)</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 200 }}>
          <IconSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm nhân viên..." style={{ ...inp, paddingLeft: 28, width: '100%' }} />
        </div>
        <select value={fCs} onChange={e => setFCs(e.target.value)} style={selStyle}><option value="">Tất cả cơ sở</option>{clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={selStyle}><option value="">Tất cả trạng thái</option><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Từ chối</option></select>
        <button onClick={() => { setQ(''); setFCs(''); setFStatus('') }} style={{ ...selStyle, color: '#64748b' }}>✕ Xóa lọc</button>
      </div>
    </div>
  )

  const doApprove = async (a, action) => {
    try { await approveShiftAssignment(a.id, { action }); toast.success(action === 'approve' ? 'Đã duyệt ca' : 'Đã từ chối'); load() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') }
  }

  return (
    <>
      <KetoanListShell stats={stats} toolbar={toolbar} pagination={{ page, pageSize, count: filtered.length, onPage: setPage, onPageSize: setPageSize }}>
        <table style={tbl}>
          <thead><tr>
            <th style={th}>Nhân viên / Bộ phận</th><th style={th}>Ca làm việc</th><th style={th}>Ngày</th>
            <th style={th}>Trạng thái</th><th style={th}>Người duyệt</th><th style={thAction}>Thao tác</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 32 }} colSpan={6}>Đang tải...</td></tr>
              : paged.length === 0 ? <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 32 }} colSpan={6}>Chưa có ca đăng ký</td></tr>
                : paged.map(a => {
                  const s = LST[a.status] || { l: a.status, bg: '#f1f5f9', c: '#64748b' }
                  return (
                    <tr key={a.id}>
                      <td style={td}><div style={{ fontWeight: 600, color: '#0f2044' }}>{a.user_name || '—'}</div><div style={{ fontSize: 9, color: '#94a3b8' }}>{a.department_display || ''}{a.clinic_name ? ' · ' + a.clinic_name : ''}</div></td>
                      <td style={td}><span style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{fmtShift(a.shift_detail)}</span></td>
                      <td style={{ ...td, fontSize: 11, color: '#475569' }}>{fmtDate(a.date)}</td>
                      <td style={td}><Pill bg={s.bg} c={s.c}>{s.l}</Pill></td>
                      <td style={{ ...td, color: '#64748b' }}>{a.approved_by_name || '—'}</td>
                      <td style={tdAction}>
                        {a.status === 'pending' && a.can_approve ? <>
                          <button onClick={() => doApprove(a, 'approve')} style={{ padding: '3px 9px', border: 'none', borderRadius: 6, background: '#15803d', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}>Duyệt</button>
                          <button onClick={() => doApprove(a, 'reject')} style={{ padding: '3px 9px', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}>✕</button>
                        </> : <span style={{ fontSize: 10, color: '#cbd5e1' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </KetoanListShell>
      {regOpen && <RegisterModal shifts={shifts} clinics={clinics} onClose={() => setRegOpen(false)} onDone={() => { setRegOpen(false); load() }} />}
    </>
  )
}
