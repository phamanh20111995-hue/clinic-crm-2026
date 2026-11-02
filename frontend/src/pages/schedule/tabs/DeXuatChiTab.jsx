import { useState, useEffect } from 'react'
import { IconPlus, IconCheck, IconX, IconEdit, IconTrash, IconRefresh, IconArrowRight } from '@tabler/icons-react'
import { getExpenses, approveExpense, rejectExpense, deleteExpense } from '../../../api/expenses'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import ChiModal from '../../ketoan/modals/ChiModal'
import toast from 'react-hot-toast'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const ACCENT = '#0369a1'
const APPROVER_ROLES = ['LEAD_TELE', 'LEAD_MKT', 'LEAD_CSKH', 'LEAD_SALE', 'KE_TOAN', 'QUAN_LY', 'CHU_DN']

const STATUS_META = {
  cho_duyet: { label: 'Chờ duyệt', bg: '#fef9c3', color: '#854d0e' },
  da_duyet: { label: 'Đã duyệt - chờ chi', bg: '#dbeafe', color: '#1e40af' },
  da_chi: { label: 'Đã chi', bg: '#dcfce7', color: '#15803d' },
  tu_choi: { label: 'Từ chối', bg: '#fee2e2', color: '#b91c1c' },
}
const STEP_COLOR = { cho: { bg: '#f1f5f9', color: '#64748b' }, duyet: { bg: '#dcfce7', color: '#15803d' }, tu_choi: { bg: '#fee2e2', color: '#b91c1c' } }
const COLS = ['Mã', 'Ngày', 'Loại', 'Nội dung', 'Số tiền', 'HTTT', 'Chuỗi duyệt', 'Trạng thái', '']

export default function DeXuatChiTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const isApprover = APPROVER_ROLES.includes(role)

  const [view, setView] = useState('mine')      // 'mine' | 'approve'
  const [mineRows, setMineRows] = useState([])
  const [apRows, setApRows] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = () => {
    getExpenses({ scope: 'mine' }).then(r => setMineRows(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    if (isApprover) getExpenses({ scope: 'to_approve' }).then(r => setApRows(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const doApprove = async (e) => {
    try { await approveExpense(e.id, {}); toast.success('Đã duyệt'); load() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi duyệt') }
  }
  const doReject = async (e) => {
    const reason = window.prompt(`Lý do từ chối ${e.code}:`, '')
    if (reason === null) return
    try { await rejectExpense(e.id, { reason }); toast.success('Đã từ chối'); load() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi từ chối') }
  }
  const doDelete = async (e) => {
    if (!window.confirm(`Xóa đề xuất ${e.code}?`)) return
    try { await deleteExpense(e.id); toast.success('Đã xóa'); load() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi xóa') }
  }
  const canEdit = (e) => ['cho_duyet', 'tu_choi'].includes(e.status)

  const mineFiltered = mineRows.filter(e => statusFilter === 'all' || e.status === statusFilter)
  const rows = view === 'approve' ? apRows : mineFiltered

  const chip = (k, txt, n, on, active) => (
    <button onClick={on} style={{ padding: '5px 11px', borderRadius: 7, border: `1px solid ${active ? ACCENT : '#dde3ef'}`, background: active ? '#eff6ff' : '#fff', color: active ? ACCENT : '#64748b', fontWeight: active ? 700 : 500, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{txt}{n != null ? ` (${n})` : ''}</button>
  )
  const th = align => ({ padding: '8px 12px', textAlign: align, fontSize: 10, fontWeight: 600, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0 })
  const btn = (bg, icon, txt, on) => (
    <button onClick={on} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', border: 'none', borderRadius: 6, background: bg, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 4 }}>{icon}{txt}</button>
  )
  const ghost = (icon, on, color) => (
    <button onClick={on} style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: color ?? '#64748b', fontSize: 10, cursor: 'pointer', marginLeft: 4 }}>{icon}</button>
  )

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toggle mine / approve */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 2, background: '#f1f5f9', borderRadius: 8, padding: 2 }}>
          <button onClick={() => setView('mine')} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: view === 'mine' ? ACCENT : 'transparent', color: view === 'mine' ? '#fff' : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Đề xuất của tôi ({mineRows.length})</button>
          {isApprover && (
            <button onClick={() => setView('approve')} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: view === 'approve' ? '#b45309' : 'transparent', color: view === 'approve' ? '#fff' : (apRows.length ? '#b45309' : '#64748b'), fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Chờ tôi duyệt ({apRows.length})</button>
          )}
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 11 }}><IconRefresh size={12} /> Tải lại</button>
        <button onClick={() => { setEditing(null); setShowModal(true) }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 7, border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          <IconPlus size={14} stroke={2.5} /> Tạo đề xuất chi
        </button>
      </div>

      {/* Status filter (only in 'mine') */}
      {view === 'mine' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {chip('all', 'Tất cả', mineRows.length, () => setStatusFilter('all'), statusFilter === 'all')}
          {chip('cho_duyet', 'Chờ duyệt', mineRows.filter(e => e.status === 'cho_duyet').length, () => setStatusFilter('cho_duyet'), statusFilter === 'cho_duyet')}
          {chip('da_duyet', 'Đã duyệt', mineRows.filter(e => e.status === 'da_duyet').length, () => setStatusFilter('da_duyet'), statusFilter === 'da_duyet')}
          {chip('da_chi', 'Đã chi', mineRows.filter(e => e.status === 'da_chi').length, () => setStatusFilter('da_chi'), statusFilter === 'da_chi')}
          {chip('tu_choi', 'Từ chối', mineRows.filter(e => e.status === 'tu_choi').length, () => setStatusFilter('tu_choi'), statusFilter === 'tu_choi')}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 1100 }}>
          <thead>
            <tr>{COLS.map((h, i) => <th key={i} style={th(h === 'Số tiền' ? 'right' : 'left')}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={COLS.length} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>{view === 'approve' ? 'Không có đề xuất chờ bạn duyệt 🎉' : 'Bạn chưa có đề xuất chi nào'}</td></tr>
            ) : rows.map(e => {
              const sm = STATUS_META[e.status] ?? { label: e.status, bg: '#f1f5f9', color: '#64748b' }
              return (
                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: ACCENT }}>{e.code}</td>
                  <td style={{ padding: '8px 12px', fontSize: 10, color: '#64748b' }}>{(e.created_at || '').slice(0, 10)}</td>
                  <td style={{ padding: '8px 12px', fontSize: 10 }}>{e.category_label}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f2044' }}>{e.title}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      {view === 'approve' ? `bởi ${e.requested_by_name}` : ''}
                      {e.status === 'tu_choi' && e.reject_reason ? ` · từ chối: ${e.reject_reason}` : ''}
                      {e.is_installment ? ` · trả góp ${(e.payouts || []).filter(p => p.status === 'da_chi').length}/${e.so_ky} kỳ` : ''}
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{fmt(e.amount)}đ</td>
                  <td style={{ padding: '8px 12px', fontSize: 10 }}>{e.payment_method === 'cash' ? 'Tiền mặt' : e.payment_method === 'transfer' ? 'Chuyển khoản' : 'Trả góp'}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                      {e.approvals.length === 0 ? <span style={{ fontSize: 9, color: '#15803d' }}>Tự duyệt</span> : e.approvals.map((a, i) => {
                        const c = STEP_COLOR[a.status] ?? STEP_COLOR.cho
                        const isCur = e.current_step && e.current_step.step_order === a.step_order && e.status === 'cho_duyet'
                        return (
                          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <span title={a.approver_name || ''} style={{ background: c.bg, color: c.color, padding: '1px 7px', borderRadius: 8, fontSize: 9, fontWeight: 600, border: isCur ? `1px solid ${ACCENT}` : '1px solid transparent' }}>{a.label.replace('Trưởng bộ phận ', '').replace('(', '').replace(')', '')}{a.status === 'duyet' ? ' ✓' : a.status === 'tu_choi' ? ' ✕' : ''}</span>
                            {i < e.approvals.length - 1 && <IconArrowRight size={10} color="#cbd5e1" />}
                          </span>
                        )
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px' }}><span style={{ background: sm.bg, color: sm.color, padding: '2px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{sm.label}</span></td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {e.can_i_approve && <>{btn('#15803d', <IconCheck size={11} />, 'Duyệt', () => doApprove(e))}{btn('#dc2626', <IconX size={11} />, '', () => doReject(e))}</>}
                    {view === 'mine' && canEdit(e) && ghost(<IconEdit size={12} />, () => { setEditing(e); setShowModal(true) })}
                    {view === 'mine' && canEdit(e) && ghost(<IconTrash size={12} />, () => doDelete(e), '#dc2626')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && <ChiModal editing={editing} userRole={role} onClose={() => setShowModal(false)} onDone={() => { setShowModal(false); load() }} />}
    </div>
  )
}
