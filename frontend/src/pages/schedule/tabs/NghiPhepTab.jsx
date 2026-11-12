import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconRefresh, IconSearch, IconX } from '@tabler/icons-react'
import { getLeaves, createLeave, resubmitLeave } from '../../../api/attendance'
import { getClinics } from '../../../api/clinics'
import NghiPhepKTModal from '../../ketoan/modals/NghiPhepKTModal'
import KetoanListShell from '../../ketoan/components/KetoanListShell'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import toast from 'react-hot-toast'

const ACCENT = '#0369a1'
const APPROVER_ROLES = ['QUAN_LY', 'CHU_DN', 'LEAD_TELE', 'LEAD_SALE', 'LEAD_CSKH', 'LEAD_MKT', 'LEAD_TRUC_PAGE', 'KE_TOAN']

const LTYPE = {
  annual: { l: 'Nghỉ phép năm', bg: '#dbeafe', c: '#1e40af' },
  sick: { l: 'Nghỉ ốm', bg: '#fef3c7', c: '#92400e' },
  unpaid: { l: 'Nghỉ không lương', bg: '#f1f5f9', c: '#475569' },
}
const LST = {
  pending: { l: 'Chờ duyệt', bg: '#fef9c3', c: '#854d0e' },
  approved: { l: 'Đã duyệt', bg: '#dcfce7', c: '#15803d' },
  rejected: { l: 'Từ chối', bg: '#fee2e2', c: '#dc2626' },
}
const DURATION_TYPES = [
  { value: 'full_day', label: 'Cả ngày' },
  { value: 'half_morning', label: 'Nửa ngày sáng' },
  { value: 'half_afternoon', label: 'Nửa ngày chiều' },
  { value: 'hourly', label: 'Theo giờ' },
]
const LEAVE_TYPES = [
  { value: 'annual', label: 'Nghỉ phép năm' },
  { value: 'sick', label: 'Nghỉ ốm' },
  { value: 'unpaid', label: 'Nghỉ không lương' },
]

// ── Styles chuẩn bảng (giống CustomerTable/Luong3PTab) ──
const th = { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }
const thR = { ...th, textAlign: 'right' }
const thAction = { ...th, right: 0, zIndex: 3, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
const td = { padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }
const tdAction = { ...td, position: 'sticky', right: 0, background: '#fff', zIndex: 2, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)', textAlign: 'right' }
const tbl = { width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1180 }
const selStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: '#fff', color: '#334155', outline: 'none', cursor: 'pointer' }
const inp = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }
const lbl = { fontSize: 10, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }

const fmtDate = s => s ? new Date(s).toLocaleDateString('vi-VN') : '—'
function leaveDays(l) {
  if (!l.start_date || !l.end_date) return '—'
  if (l.duration_type === 'half_morning' || l.duration_type === 'half_afternoon') return 0.5
  if (l.duration_type === 'hourly') {
    if (l.start_time && l.end_time) {
      const h = parseInt(l.end_time) - parseInt(l.start_time)
      return Math.max(0.5, Math.min(1, +(h / 8).toFixed(2)))
    }
    return 0.5
  }
  const d1 = new Date(l.start_date), d2 = new Date(l.end_date)
  return Math.round((d2 - d1) / 86400000) + 1
}
const Pill = ({ children, bg = '#f1f5f9', c = '#475569' }) => (
  <span style={{ display: 'inline-block', background: bg, color: c, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{children}</span>
)
const StatCard = ({ label, value, sub, accent }) => (
  <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '11px 14px' }}>
    <div style={{ fontSize: 19, fontWeight: 700, color: accent, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
  </div>
)

const EMPTY = { clinic: '', leave_type: 'annual', duration_type: 'full_day', start_date: '', end_date: '', start_time: '', end_time: '', reason: '' }

// Modal đăng ký / sửa-gửi-lại đơn nghỉ
function LeaveFormModal({ clinics, editing, onClose, onDone }) {
  const [form, setForm] = useState(editing
    ? { clinic: editing.clinic || '', leave_type: editing.leave_type, duration_type: editing.duration_type, start_date: editing.start_date || '', end_date: editing.end_date || '', start_time: editing.start_time || '', end_time: editing.end_time || '', reason: editing.reason || '' }
    : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isHourly = form.duration_type === 'hourly'

  const submit = async () => {
    if (!form.start_date || !form.end_date) return toast.error('Chọn ngày bắt đầu và kết thúc')
    if (isHourly && (!form.start_time || !form.end_time)) return toast.error('Nghỉ theo giờ cần nhập giờ')
    setSaving(true)
    const body = {
      clinic: form.clinic || null,
      leave_type: form.leave_type, duration_type: form.duration_type,
      start_date: form.start_date, end_date: form.end_date, reason: form.reason,
    }
    if (isHourly) { body.start_time = form.start_time; body.end_time = form.end_time }
    try {
      if (editing) await resubmitLeave(editing.id, body)
      else await createLeave(body)
      toast.success(editing ? 'Đã sửa & gửi lại, chờ duyệt' : 'Đã gửi đơn nghỉ, chờ duyệt')
      onDone()
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Lỗi gửi đơn')
    } finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,68,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 560, maxWidth: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #eef1f6' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>{editing ? `Sửa & gửi lại đơn nghỉ` : 'Đăng ký nghỉ phép'}</span>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {editing?.reject_reason && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 11px', fontSize: 11, color: '#b91c1c' }}>↩ Bị từ chối: {editing.reject_reason}</div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Chi nhánh / cơ sở</label>
              <select value={form.clinic} onChange={e => set('clinic', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">— Chọn cơ sở —</option>
                {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Loại nghỉ</label>
              <select value={form.leave_type} onChange={e => set('leave_type', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Loại thời gian</label>
              <select value={form.duration_type} onChange={e => set('duration_type', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {DURATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Từ ngày</label><input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Đến ngày</label><input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} style={inp} /></div>
          </div>
          {isHourly && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label style={lbl}>Giờ bắt đầu</label><input type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Giờ kết thúc</label><input type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} style={inp} /></div>
            </div>
          )}
          <div><label style={lbl}>Lý do</label><input value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Nhập lý do nghỉ..." style={inp} /></div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Đơn gửi đi ở trạng thái “Chờ duyệt”. Ngày nghỉ không tính công nhưng không bị phạt như vắng.</div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid #eef1f6', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? .6 : 1 }}>
            {saving ? 'Đang gửi...' : (editing ? 'Sửa & gửi lại' : 'Gửi đơn')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NghiPhepTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isApprover = APPROVER_ROLES.includes(role)

  const [leaves, setLeaves] = useState([])
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)      // resubmit
  const [approveModal, setApproveModal] = useState(null)

  const [q, setQ] = useState('')
  const [fDept, setFDept] = useState('')
  const [fCs, setFCs] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fType, setFType] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getLeaves()
      const d = r.data?.results ?? r.data ?? []
      setLeaves(Array.isArray(d) ? d : [])
    } catch { setLeaves([]) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load(); getClinics().then(r => setClinics(r.data?.results ?? r.data ?? [])).catch(() => {}) }, [load])
  useEffect(() => { setPage(1) }, [q, fDept, fCs, fStatus, fType, pageSize])

  const depts = [...new Set(leaves.map(l => l.department_display).filter(Boolean))]
  const filtered = leaves.filter(l => {
    if (q) { const s = q.toLowerCase(); if (!((l.user_name || '').toLowerCase().includes(s) || (l.reason || '').toLowerCase().includes(s))) return false }
    if (fDept && l.department_display !== fDept) return false
    if (fCs && String(l.clinic ?? '') !== String(fCs)) return false
    if (fStatus && l.status !== fStatus) return false
    if (fType && l.leave_type !== fType) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
  const cnt = k => leaves.filter(l => l.status === k).length

  const stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }}>
      <StatCard label="Tổng đơn" value={leaves.length} sub="Tất cả kỳ" accent={ACCENT} />
      <StatCard label="Chờ duyệt" value={cnt('pending')} sub="Cần xử lý" accent="#854d0e" />
      <StatCard label="Đã duyệt" value={cnt('approved')} accent="#15803d" />
      <StatCard label="Từ chối" value={cnt('rejected')} accent="#dc2626" />
    </div>
  )

  const clearFilters = () => { setQ(''); setFDept(''); setFCs(''); setFStatus(''); setFType('') }
  const toolbar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#0f2044' }}>Tất cả đơn nghỉ phép</span>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>· {isApprover ? 'bạn thấy đơn thuộc quyền duyệt' : 'đơn của bạn'}</span>
        <button onClick={() => { setEditing(null); setFormOpen(true) }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <IconPlus size={14} /> Đăng ký nghỉ phép
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 200 }}>
          <IconSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm nhân viên / lý do..." style={{ ...inp, paddingLeft: 28, width: '100%' }} />
        </div>
        <select value={fDept} onChange={e => setFDept(e.target.value)} style={selStyle}><option value="">Tất cả bộ phận</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}</select>
        <select value={fCs} onChange={e => setFCs(e.target.value)} style={selStyle}><option value="">Tất cả cơ sở</option>{clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={selStyle}><option value="">Tất cả trạng thái</option><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Từ chối</option></select>
        <select value={fType} onChange={e => setFType(e.target.value)} style={selStyle}><option value="">Tất cả loại nghỉ</option>{LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
        <button onClick={clearFilters} style={{ ...selStyle, color: '#64748b' }}>✕ Xóa lọc</button>
      </div>
    </div>
  )

  return (
    <>
      <KetoanListShell stats={stats} toolbar={toolbar} pagination={{ page, pageSize, count: filtered.length, onPage: setPage, onPageSize: setPageSize }}>
        <table style={tbl}>
          <thead><tr>
            <th style={th}>Nhân viên / Bộ phận</th><th style={th}>Loại nghỉ</th><th style={th}>Thời gian</th>
            <th style={thR}>Số ngày</th><th style={th}>Lý do</th><th style={th}>Trạng thái</th>
            <th style={th}>Người duyệt</th><th style={th}>Ghi chú</th><th style={thAction}>Thao tác</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 32 }} colSpan={9}>Đang tải...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 32 }} colSpan={9}>Không có đơn phù hợp</td></tr>
            ) : paged.map(l => {
              const t = LTYPE[l.leave_type] || { l: l.leave_type, bg: '#f1f5f9', c: '#475569' }
              const s = LST[l.status] || { l: l.status, bg: '#f1f5f9', c: '#64748b' }
              const isOwner = l.user === user?.id
              return (
                <tr key={l.id}>
                  <td style={td}><div style={{ fontWeight: 600, color: '#0f2044' }}>{l.user_name || '—'}</div><div style={{ fontSize: 9, color: '#94a3b8' }}>{l.department_display || ''}{l.clinic_name ? ' · ' + l.clinic_name : ''}</div></td>
                  <td style={td}><Pill bg={t.bg} c={t.c}>{t.l}</Pill><div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{l.duration_type_display || ''}</div></td>
                  <td style={{ ...td, fontSize: 11, color: '#475569' }}>{fmtDate(l.start_date)} – {fmtDate(l.end_date)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{leaveDays(l)}</td>
                  <td style={{ ...td, color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.reason || '—'}</td>
                  <td style={td}><Pill bg={s.bg} c={s.c}>{s.l}</Pill></td>
                  <td style={{ ...td, color: '#64748b' }}>{l.approved_by_name || '—'}</td>
                  <td style={{ ...td, color: '#dc2626', fontSize: 11 }}>{l.reject_reason || ''}</td>
                  <td style={tdAction}>
                    {l.status === 'pending' && l.can_approve
                      ? <button onClick={() => setApproveModal(l)} style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: ACCENT, color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Xử lý</button>
                      : l.status === 'rejected' && isOwner
                        ? <button onClick={() => { setEditing(l); setFormOpen(true) }} style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: '#b45309', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Sửa & gửi lại</button>
                        : <span style={{ fontSize: 10, color: '#cbd5e1' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </KetoanListShell>

      {formOpen && <LeaveFormModal clinics={clinics} editing={editing} onClose={() => { setFormOpen(false); setEditing(null) }} onDone={() => { setFormOpen(false); setEditing(null); load() }} />}
      {approveModal && <NghiPhepKTModal leave={approveModal} onClose={() => setApproveModal(null)} onDone={() => { setApproveModal(null); load() }} />}
    </>
  )
}
