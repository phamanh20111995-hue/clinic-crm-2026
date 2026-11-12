import { useState, useEffect } from 'react'
import { IconPlus, IconCheck, IconX, IconEdit, IconTrash, IconRefresh, IconArrowRight, IconSearch, IconFileInvoice } from '@tabler/icons-react'
import { getExpenses, approveExpense, rejectExpense, deleteExpense, payExpense } from '../../../api/expenses'
import { getClinics } from '../../../api/clinics'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import ChiModal from '../../ketoan/modals/ChiModal'
import KetoanListShell from '../../ketoan/components/KetoanListShell'
import toast from 'react-hot-toast'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const ACCENT = '#0369a1'
const APPROVER_ROLES = ['LEAD_TELE', 'LEAD_MKT', 'LEAD_CSKH', 'LEAD_SALE', 'KE_TOAN', 'QUAN_LY', 'CHU_DN']

const STATUS_META = {
  cho_duyet: { label: 'Chờ duyệt', bg: '#fef9c3', c: '#854d0e' },
  da_duyet: { label: 'Đã duyệt - chờ chi', bg: '#dbeafe', c: '#1e40af' },
  da_chi: { label: 'Đã chi', bg: '#dcfce7', c: '#15803d' },
  tu_choi: { label: 'Từ chối', bg: '#fee2e2', c: '#b91c1c' },
}
const STEP_COLOR = { cho: { bg: '#f1f5f9', c: '#64748b' }, duyet: { bg: '#dcfce7', c: '#15803d' }, tu_choi: { bg: '#fee2e2', c: '#b91c1c' } }
const PERIODS = [['', 'Tất cả thời gian'], ['thismonth', 'Tháng này'], ['lastmonth', 'Tháng trước'], ['thisyear', 'Năm nay']]

const th = { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }
const thR = { ...th, textAlign: 'right' }
const thAction = { ...th, right: 0, zIndex: 3, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
const td = { padding: '9px 12px', fontSize: 12, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }
const tdAction = { ...td, position: 'sticky', right: 0, background: '#fff', zIndex: 2, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)', textAlign: 'right' }
const tbl = { width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 1480 }
const selStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', background: '#fff', color: '#334155', outline: 'none', cursor: 'pointer' }
const inp = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }

const StatCard = ({ label, value, sub, accent }) => (
  <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '11px 14px' }}>
    <div style={{ fontSize: 19, fontWeight: 700, color: accent, lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{sub}</div>}
  </div>
)

// Modal Ghi chi — người chi (NV/KT/Chủ DN) xác nhận đã chi + tải chứng từ
function GhiChiModal({ expense, onClose, onDone }) {
  const [method, setMethod] = useState(expense.payment_method === 'transfer' ? 'transfer' : 'cash')
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [chungTu, setChungTu] = useState('')
  const [saving, setSaving] = useState(false)
  const lbl = { fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block' }

  const submit = async () => {
    setSaving(true)
    try {
      await payExpense(expense.id, { paid_method: method, paid_at: paidAt, note, chung_tu: chungTu ? [chungTu] : [] })
      toast.success('Đã ghi chi + lưu chứng từ')
      onDone()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi ghi chi') } finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, width: 520, maxWidth: '100%', boxShadow: '0 20px 50px rgba(0,0,0,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderBottom: '1px solid #eef1f6' }}>
          <IconFileInvoice size={17} color="#15803d" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f2044' }}>Ghi chi — {expense.code}</span>
          <button onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><IconX size={18} /></button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#475569' }}>{expense.title} · <b>{fmt(expense.amount)}đ</b></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Phương thức chi thực tế</label>
              <select value={method} onChange={e => setMethod(e.target.value)} style={{ ...inp, width: '100%', cursor: 'pointer' }}>
                <option value="cash">Tiền mặt</option><option value="transfer">Chuyển khoản</option>
              </select>
            </div>
            <div><label style={lbl}>Ngày chi</label><input type="date" value={paidAt} onChange={e => setPaidAt(e.target.value)} style={{ ...inp, width: '100%' }} /></div>
          </div>
          <div><label style={lbl}>Chứng từ chi (link ảnh ủy nhiệm chi / biên nhận)</label><input value={chungTu} onChange={e => setChungTu(e.target.value)} placeholder="Dán link ảnh chứng từ (hoặc mô tả)" style={{ ...inp, width: '100%' }} /></div>
          <div><label style={lbl}>Ghi chú</label><input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú khi chi..." style={{ ...inp, width: '100%' }} /></div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Sau khi ghi chi: phiếu chuyển “Đã chi”, ghi sổ quỹ (nếu TM), báo người đề xuất.</div>
        </div>
        <div style={{ padding: '12px 18px', borderTop: '1px solid #eef1f6', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={submit} disabled={saving} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#15803d', color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? .6 : 1 }}>{saving ? 'Đang ghi...' : '✓ Xác nhận đã chi'}</button>
        </div>
      </div>
    </div>
  )
}

export default function DeXuatChiTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isApprover = APPROVER_ROLES.includes(role)

  const [view, setView] = useState('mine')
  const [mineRows, setMineRows] = useState([])
  const [apRows, setApRows] = useState([])
  const [clinics, setClinics] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [ghiChi, setGhiChi] = useState(null)

  const [q, setQ] = useState('')
  const [fDept, setFDept] = useState('')
  const [fCs, setFCs] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fCat, setFCat] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = () => {
    getExpenses({ scope: 'mine' }).then(r => setMineRows(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    if (isApprover) getExpenses({ scope: 'to_approve' }).then(r => setApRows(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }
  useEffect(() => { load(); getClinics().then(r => setClinics(r.data?.results ?? r.data ?? [])).catch(() => {}) }, [])
  useEffect(() => { setPage(1) }, [view, q, fDept, fCs, fStatus, fCat, pageSize])

  const baseRows = view === 'approve' ? apRows : mineRows
  const depts = [...new Set(baseRows.map(e => e.requested_by_role_display).filter(Boolean))]
  const filtered = baseRows.filter(e => {
    if (q) { const s = q.toLowerCase(); if (!((e.code || '').toLowerCase().includes(s) || (e.title || '').toLowerCase().includes(s))) return false }
    if (fDept && e.requested_by_role_display !== fDept) return false
    if (fCs && String(e.clinic_id ?? '') !== String(fCs)) return false
    if (fStatus && e.status !== fStatus) return false
    if (fCat && e.category !== fCat) return false
    return true
  })
  const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
  const cnt = k => mineRows.filter(e => e.status === k).length

  const doApprove = async e => { try { await approveExpense(e.id, {}); toast.success('Đã duyệt'); load() } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi duyệt') } }
  const doReject = async e => { const reason = window.prompt(`Lý do từ chối ${e.code}:`, ''); if (reason === null) return; try { await rejectExpense(e.id, { reason }); toast.success('Đã từ chối'); load() } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') } }
  const doDelete = async e => { if (!window.confirm(`Xóa đề xuất ${e.code}?`)) return; try { await deleteExpense(e.id); toast.success('Đã xóa'); load() } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') } }
  const canEdit = e => ['cho_duyet', 'tu_choi'].includes(e.status)

  const stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 10 }}>
      <StatCard label="Tổng đề xuất (của tôi)" value={mineRows.length} accent={ACCENT} />
      <StatCard label="Chờ duyệt" value={cnt('cho_duyet')} sub="Cần duyệt" accent="#854d0e" />
      <StatCard label="Đã duyệt · chờ chi" value={cnt('da_duyet')} sub="Chờ chi" accent="#1e40af" />
      <StatCard label="Đã chi" value={cnt('da_chi')} sub="Hoàn tất" accent="#15803d" />
    </div>
  )

  const clearFilters = () => { setQ(''); setFDept(''); setFCs(''); setFStatus(''); setFCat('') }
  const toolbar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
          <button onClick={() => setView('mine')} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: view === 'mine' ? ACCENT : 'transparent', color: view === 'mine' ? '#fff' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Đề xuất của tôi ({mineRows.length})</button>
          {isApprover && <button onClick={() => setView('approve')} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: view === 'approve' ? '#b45309' : 'transparent', color: view === 'approve' ? '#fff' : (apRows.length ? '#b45309' : '#64748b'), fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Chờ tôi duyệt ({apRows.length})</button>}
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 11 }}><IconRefresh size={12} /> Tải lại</button>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><IconPlus size={14} /> Tạo đề xuất chi</button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 200 }}>
          <IconSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã / nội dung..." style={{ ...inp, paddingLeft: 28, width: '100%' }} />
        </div>
        <select value={fDept} onChange={e => setFDept(e.target.value)} style={selStyle}><option value="">Tất cả bộ phận</option>{depts.map(d => <option key={d} value={d}>{d}</option>)}</select>
        <select value={fCs} onChange={e => setFCs(e.target.value)} style={selStyle}><option value="">Tất cả cơ sở</option>{clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={selStyle}><option value="">Tất cả trạng thái</option><option value="cho_duyet">Chờ duyệt</option><option value="da_duyet">Đã duyệt - chờ chi</option><option value="da_chi">Đã chi</option><option value="tu_choi">Từ chối</option></select>
        <button onClick={clearFilters} style={{ ...selStyle, color: '#64748b' }}>✕ Xóa lọc</button>
      </div>
    </div>
  )

  return (
    <>
      <KetoanListShell stats={stats} toolbar={toolbar} pagination={{ page, pageSize, count: filtered.length, onPage: setPage, onPageSize: setPageSize }}>
        <table style={tbl}>
          <thead><tr>
            <th style={th}>Mã</th><th style={th}>Ngày</th><th style={th}>Bộ phận / Cơ sở</th><th style={th}>Loại</th>
            <th style={th}>Nội dung</th><th style={thR}>Số tiền</th><th style={th}>HTTT</th><th style={th}>Chuỗi duyệt</th>
            <th style={th}>Trạng thái</th><th style={thAction}>Thao tác</th>
          </tr></thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={10} style={{ ...td, textAlign: 'center', color: '#94a3b8', padding: 28 }}>{view === 'approve' ? 'Không có đề xuất chờ bạn duyệt 🎉' : 'Không có đề xuất phù hợp'}</td></tr>
            ) : paged.map(e => {
              const sm = STATUS_META[e.status] ?? { label: e.status, bg: '#f1f5f9', c: '#64748b' }
              const isAdv = e.category === 'luong_ung'
              return (
                <tr key={e.id}>
                  <td style={{ ...td, fontWeight: 700, color: ACCENT }}>{e.code}</td>
                  <td style={{ ...td, fontSize: 10, color: '#64748b' }}>{(e.created_at || '').slice(0, 10)}</td>
                  <td style={{ ...td, fontSize: 11, color: '#64748b' }}>{e.requested_by_role_display || '—'}<div style={{ fontSize: 9, color: '#94a3b8' }}>{e.clinic_name || ''}</div></td>
                  <td style={{ ...td, fontSize: 11 }}>{isAdv ? <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600 }}>{e.category_label}</span> : e.category_label}</td>
                  <td style={td}><div style={{ fontWeight: 600, color: '#0f2044' }}>{e.title}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      {view === 'approve' ? `bởi ${e.requested_by_name}` : ''}
                      {e.status === 'tu_choi' && e.reject_reason ? <span style={{ color: '#dc2626' }}> ↩ Bị từ chối: {e.reject_reason}</span> : ''}
                      {e.is_installment ? ` · trả góp ${(e.payouts || []).filter(p => p.status === 'da_chi').length}/${e.so_ky} kỳ` : ''}
                    </div>
                  </td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{fmt(e.amount)}đ</td>
                  <td style={{ ...td, fontSize: 10 }}>{e.payment_method === 'cash' ? 'Tiền mặt' : e.payment_method === 'transfer' ? 'CK' : 'Trả góp'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                      {(e.approvals || []).length === 0 ? <span style={{ fontSize: 9, color: '#15803d' }}>Tự duyệt</span> : e.approvals.map((a, i) => {
                        const c = STEP_COLOR[a.status] ?? STEP_COLOR.cho
                        const isCur = e.current_step && e.current_step.step_order === a.step_order && e.status === 'cho_duyet'
                        return (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <span title={a.approver_name || ''} style={{ background: c.bg, color: c.c, padding: '1px 7px', borderRadius: 8, fontSize: 9, fontWeight: 600, border: isCur ? `1px solid ${ACCENT}` : '1px solid transparent' }}>{a.label.replace('Trưởng bộ phận ', '').replace('Trưởng BP ', '')}{a.status === 'duyet' ? ' ✓' : a.status === 'tu_choi' ? ' ✕' : ''}</span>
                            {i < e.approvals.length - 1 && <IconArrowRight size={10} color="#cbd5e1" />}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td style={td}><span style={{ background: sm.bg, color: sm.c, padding: '2px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{sm.label}</span></td>
                  <td style={tdAction}>
                    {e.can_i_approve && <>
                      <button onClick={() => doApprove(e)} style={{ padding: '3px 9px', border: 'none', borderRadius: 6, background: '#15803d', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}><IconCheck size={11} style={{ verticalAlign: 'middle' }} /> Duyệt</button>
                      <button onClick={() => doReject(e)} style={{ padding: '3px 9px', border: 'none', borderRadius: 6, background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}><IconX size={11} style={{ verticalAlign: 'middle' }} /></button>
                    </>}
                    {e.status === 'da_duyet' && (role === 'KE_TOAN' || role === 'QUAN_LY' || role === 'CHU_DN' || e.requested_by_name === user?.display_name) &&
                      <button onClick={() => setGhiChi(e)} style={{ padding: '3px 10px', border: 'none', borderRadius: 6, background: '#15803d', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}>Ghi chi</button>}
                    {view === 'mine' && e.status === 'tu_choi' && <button onClick={() => { setEditing(e); setShowModal(true) }} style={{ padding: '3px 10px', border: 'none', borderRadius: 6, background: '#b45309', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', marginLeft: 4 }}>Sửa & gửi lại</button>}
                    {view === 'mine' && e.status === 'cho_duyet' && canEdit(e) && <>
                      <button onClick={() => { setEditing(e); setShowModal(true) }} style={{ padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#64748b', fontSize: 10, cursor: 'pointer', marginLeft: 4 }}><IconEdit size={12} /></button>
                      <button onClick={() => doDelete(e)} style={{ padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#dc2626', fontSize: 10, cursor: 'pointer', marginLeft: 4 }}><IconTrash size={12} /></button>
                    </>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </KetoanListShell>

      {showModal && <ChiModal editing={editing} userRole={role} onClose={() => { setShowModal(false); setEditing(null) }} onDone={() => { setShowModal(false); setEditing(null); load() }} />}
      {ghiChi && <GhiChiModal expense={ghiChi} onClose={() => setGhiChi(null)} onDone={() => { setGhiChi(null); load() }} />}
    </>
  )
}
