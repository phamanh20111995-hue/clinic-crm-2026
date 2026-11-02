import { useState, useEffect } from 'react'
import { IconFileInvoice, IconCoin, IconPlus, IconCheck, IconX, IconCash, IconEdit, IconTrash, IconRefresh, IconClockDollar, IconReceipt } from '@tabler/icons-react'
import { getExpenses, approveExpense, rejectExpense, payExpense, payPayout, deleteExpense, getCashBook } from '../../../api/expenses'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import KetoanListShell from '../components/KetoanListShell'
import ChiModal from '../modals/ChiModal'
import toast from 'react-hot-toast'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const PAY_ROLES = ['KE_TOAN', 'QUAN_LY', 'CHU_DN']
const monthStart = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01` }
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }

const STATUS_META = {
  cho_duyet: { label: 'Chờ duyệt', bg: '#fef9c3', color: '#854d0e' },
  da_duyet: { label: 'Đã duyệt - chờ chi', bg: '#dbeafe', color: '#1e40af' },
  da_chi: { label: 'Đã chi', bg: '#dcfce7', color: '#15803d' },
  tu_choi: { label: 'Từ chối', bg: '#fee2e2', color: '#b91c1c' },
}
const STEP_COLOR = { cho: { bg: '#f1f5f9', color: '#64748b' }, duyet: { bg: '#dcfce7', color: '#15803d' }, tu_choi: { bg: '#fee2e2', color: '#b91c1c' } }

const DX_COLS = ['Mã', 'Ngày', 'Loại', 'Nội dung', 'Số tiền', 'HTTT', 'VAT', 'Chuỗi duyệt', 'Trạng thái', '']

export default function ChiTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const canPay = PAY_ROLES.includes(role)

  const [view, setView] = useState('dexuat')

  // ----- Đề xuất chi -----
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const loadExpenses = () => getExpenses().then(r => setRows(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  useEffect(() => { if (view === 'dexuat') loadExpenses() }, [view])
  useEffect(() => { setPage(1) }, [filter, view, pageSize])

  const toApproveCount = rows.filter(r => r.can_i_approve).length
  const counts = {
    all: rows.length,
    to_approve: toApproveCount,
    cho_duyet: rows.filter(r => r.status === 'cho_duyet').length,
    da_duyet: rows.filter(r => r.status === 'da_duyet').length,
    da_chi: rows.filter(r => r.status === 'da_chi').length,
    tu_choi: rows.filter(r => r.status === 'tu_choi').length,
  }
  const filtered = rows.filter(r => {
    if (filter === 'all') return true
    if (filter === 'to_approve') return r.can_i_approve
    return r.status === filter
  })

  const doApprove = async (e) => {
    try { await approveExpense(e.id, {}); toast.success('Đã duyệt'); loadExpenses() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi duyệt') }
  }
  const doReject = async (e) => {
    const reason = window.prompt(`Lý do từ chối đề xuất ${e.code}:`, '')
    if (reason === null) return
    try { await rejectExpense(e.id, { reason }); toast.success('Đã từ chối'); loadExpenses() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi từ chối') }
  }
  const doPay = async (e) => {
    if (!window.confirm(`Xác nhận đã chi ${fmt(e.amount)}đ cho "${e.title}" bằng ${e.payment_method === 'cash' ? 'tiền mặt' : 'chuyển khoản'}?`)) return
    try { await payExpense(e.id, { paid_method: e.payment_method, paid_at: todayStr() }); toast.success('Đã ghi chi'); loadExpenses() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi ghi chi') }
  }
  const doPayKy = async (e) => {
    const next = (e.payouts || []).find(p => p.status === 'cho_chi')
    if (!next) return
    if (!window.confirm(`Ghi chi kỳ ${next.ky_no}/${e.so_ky} — ${fmt(next.amount)}đ (${next.method === 'cash' ? 'TM' : 'CK'})?`)) return
    try { await payPayout(next.id, { paid_at: todayStr() }); toast.success('Đã ghi chi kỳ ' + next.ky_no); loadExpenses() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi ghi chi kỳ') }
  }
  const doDelete = async (e) => {
    if (!window.confirm(`Xóa đề xuất ${e.code}?`)) return
    try { await deleteExpense(e.id); toast.success('Đã xóa'); loadExpenses() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi xóa') }
  }
  const canEdit = (e) => ['cho_duyet', 'tu_choi'].includes(e.status) && (e.requested_by_name === (user?.display_name ?? user?.email) || ['QUAN_LY', 'CHU_DN'].includes(role))

  // ----- Sổ quỹ TM -----
  const [cbFrom, setCbFrom] = useState(monthStart())
  const [cbTo, setCbTo] = useState(todayStr())
  const [cbRows, setCbRows] = useState([])
  const [cbSum, setCbSum] = useState({})
  const loadCashBook = () => getCashBook({ from: cbFrom, to: cbTo }).then(r => { setCbRows(r.data?.rows ?? []); setCbSum(r.data?.summary ?? {}) }).catch(() => {})
  useEffect(() => { if (view === 'soquy') loadCashBook() }, [view, cbFrom, cbTo])

  // ----- shared UI -----
  const card = (icon, label, value, sub, color, border) => (
    <div style={{ background: '#fff', border: `1px solid ${border ?? '#dde3ef'}`, borderRadius: 9, padding: '11px 13px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
    </div>
  )
  const tabBtn = (k, txt) => (
    <button onClick={() => setView(k)} style={{ padding: '6px 14px', border: 'none', borderBottom: `2px solid ${view === k ? '#b45309' : 'transparent'}`, background: 'transparent', color: view === k ? '#b45309' : '#64748b', fontWeight: view === k ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{txt}</button>
  )
  const chip = (k, txt, n) => (
    <button onClick={() => setFilter(k)} style={{ padding: '5px 11px', borderRadius: 7, border: `1px solid ${filter === k ? '#b45309' : '#dde3ef'}`, background: filter === k ? '#fff7ed' : '#fff', color: filter === k ? '#b45309' : '#64748b', fontWeight: filter === k ? 700 : 500, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{txt}{n ? ` (${n})` : ''}</button>
  )
  const thStyle = align => ({ padding: '7px 11px', textAlign: align, fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 })
  const thAction = { ...thStyle('right'), right: 0, zIndex: 3, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
  const tdR = { padding: '7px 11px', textAlign: 'right' }
  const tdAction = { padding: '7px 11px', textAlign: 'right', position: 'sticky', right: 0, background: '#fff', zIndex: 2, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
  const btn = (bg, icon, txt, on) => (
    <button onClick={on} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', border: 'none', borderRadius: 6, background: bg, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 4 }}>{icon}{txt}</button>
  )
  const ghostBtn = (icon, on, color) => (
    <button onClick={on} title="" style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 6px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: color ?? '#64748b', fontSize: 10, cursor: 'pointer', marginLeft: 4 }}>{icon}</button>
  )

  const stats = view === 'dexuat' ? (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
      {card(<IconClockDollar size={13} color="#854d0e" />, 'Chờ duyệt', String(counts.cho_duyet), fmt(rows.filter(r => r.status === 'cho_duyet').reduce((s, r) => s + r.amount, 0)) + 'đ', '#854d0e')}
      {card(<IconCheck size={13} color="#b45309" />, 'Chờ tôi duyệt', String(counts.to_approve), 'Cần tôi ký', '#b45309', counts.to_approve ? '#b45309' : undefined)}
      {card(<IconCash size={13} color="#1e40af" />, 'Đã duyệt - chờ chi', String(counts.da_duyet), fmt(rows.filter(r => r.status === 'da_duyet').reduce((s, r) => s + r.amount, 0)) + 'đ', '#1e40af')}
      {card(<IconReceipt size={13} color="#15803d" />, 'Đã chi', String(counts.da_chi), fmt(rows.filter(r => r.status === 'da_chi').reduce((s, r) => s + r.amount, 0)) + 'đ', '#15803d')}
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {card(<IconCoin size={13} color="#15803d" />, 'Tổng thu TM', fmt(cbSum.tong_thu) + 'đ', `${cbFrom} → ${cbTo}`, '#15803d')}
      {card(<IconReceipt size={13} color="#dc2626" />, 'Tổng chi TM', fmt(cbSum.tong_chi) + 'đ', 'Đề xuất chi đã chi (TM)', '#dc2626')}
      {card(<IconCoin size={13} color="#1e40af" />, 'Chênh trong kỳ', (Number(cbSum.chenh || 0) >= 0 ? '+' : '') + fmt(cbSum.chenh) + 'đ', 'Thu − Chi', Number(cbSum.chenh || 0) >= 0 ? '#1e40af' : '#dc2626')}
    </div>
  )

  const toolbar = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #eef1f6' }}>
        {tabBtn('dexuat', 'Đề xuất chi')}
        {tabBtn('soquy', 'Sổ quỹ tiền mặt')}
        {view === 'dexuat' && (
          <button onClick={() => { setEditing(null); setShowModal(true) }} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: 'none', background: '#b45309', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 4 }}>
            <IconPlus size={13} /> Tạo đề xuất chi
          </button>
        )}
      </div>
      {view === 'dexuat' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {chip('all', 'Tất cả', counts.all)}
          {chip('to_approve', 'Chờ tôi duyệt', counts.to_approve)}
          {chip('cho_duyet', 'Chờ duyệt', counts.cho_duyet)}
          {chip('da_duyet', 'Chờ chi', counts.da_duyet)}
          {chip('da_chi', 'Đã chi', counts.da_chi)}
          {chip('tu_choi', 'Từ chối', counts.tu_choi)}
          <button onClick={loadExpenses} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 11 }}><IconRefresh size={12} /> Tải lại</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 11, color: '#64748b' }}>Từ</label>
          <input type="date" value={cbFrom} onChange={e => setCbFrom(e.target.value)} style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '5px 9px', fontSize: 12 }} />
          <label style={{ fontSize: 11, color: '#64748b' }}>đến</label>
          <input type="date" value={cbTo} onChange={e => setCbTo(e.target.value)} style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '5px 9px', fontSize: 12 }} />
          <button onClick={loadCashBook} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 11 }}><IconRefresh size={12} /> Tải lại</button>
        </div>
      )}
    </div>
  )

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <KetoanListShell
        stats={stats}
        toolbar={toolbar}
        pagination={view === 'dexuat' ? { page, pageSize, count: filtered.length, onPage: setPage, onPageSize: setPageSize } : null}
      >
        {view === 'dexuat' ? (
          <div style={{ minWidth: 1500 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {DX_COLS.map((h, i) => <th key={i} style={i === DX_COLS.length - 1 ? thAction : thStyle(h === 'Số tiền' ? 'right' : 'left')}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={DX_COLS.length} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Không có đề xuất chi</td></tr>
                ) : paged.map(e => {
                  const sm = STATUS_META[e.status] ?? { label: e.status, bg: '#f1f5f9', color: '#64748b' }
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 11px', fontWeight: 700, color: '#b45309' }}>{e.code}</td>
                      <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{(e.created_at || '').slice(0, 10)}</td>
                      <td style={{ padding: '7px 11px', fontSize: 10 }}>{e.category_label}</td>
                      <td style={{ padding: '7px 11px' }}>
                        <div style={{ fontWeight: 600, color: '#0f2044' }}>{e.title}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>bởi {e.requested_by_name}{e.status === 'tu_choi' && e.reject_reason ? ` · từ chối: ${e.reject_reason}` : ''}</div>
                      </td>
                      <td style={{ ...tdR, fontWeight: 700 }}>{fmt(e.amount)}đ</td>
                      <td style={{ padding: '7px 11px', fontSize: 10 }}>{e.payment_method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
                      <td style={{ padding: '7px 11px' }}>{e.co_hoa_don_vat ? <span style={{ background: '#ecfdf5', color: '#047857', padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 700 }}>VAT</span> : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                      <td style={{ padding: '7px 11px' }}>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {e.approvals.map((a, i) => {
                            const c = STEP_COLOR[a.status] ?? STEP_COLOR.cho
                            const isCur = e.current_step && e.current_step.step_order === a.step_order && e.status === 'cho_duyet'
                            return <span key={i} title={a.approver_name || ''} style={{ background: c.bg, color: c.color, padding: '1px 7px', borderRadius: 8, fontSize: 9, fontWeight: 600, border: isCur ? '1px solid #b45309' : '1px solid transparent' }}>{a.label.replace('Trưởng bộ phận ', '').replace('(', '').replace(')', '')}{a.status === 'duyet' ? ' ✓' : a.status === 'tu_choi' ? ' ✕' : ''}</span>
                          })}
                          {e.approvals.length === 0 && <span style={{ fontSize: 9, color: '#15803d' }}>Tự duyệt</span>}
                        </div>
                      </td>
                      <td style={{ padding: '7px 11px' }}>
                        <span style={{ background: sm.bg, color: sm.color, padding: '2px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{sm.label}</span>
                        {e.is_installment && (
                          <div style={{ fontSize: 9, color: '#92400e', marginTop: 3 }}>
                            Trả góp: {(e.payouts || []).filter(p => p.status === 'da_chi').length}/{e.so_ky} kỳ · còn {fmt(e.remaining)}đ
                          </div>
                        )}
                      </td>
                      <td style={tdAction}>
                        {e.can_i_approve && <>{btn('#15803d', <IconCheck size={11} />, 'Duyệt', () => doApprove(e))}{btn('#dc2626', <IconX size={11} />, '', () => doReject(e))}</>}
                        {canPay && !e.is_installment && e.status === 'da_duyet' && btn('#1e40af', <IconCash size={11} />, 'Ghi chi', () => doPay(e))}
                        {canPay && e.is_installment && e.remaining > 0 && (e.payouts || []).length > 0 && btn('#1e40af', <IconCash size={11} />, 'Ghi kỳ', () => doPayKy(e))}
                        {canEdit(e) && ghostBtn(<IconEdit size={12} />, () => { setEditing(e); setShowModal(true) })}
                        {canEdit(e) && ghostBtn(<IconTrash size={12} />, () => doDelete(e), '#dc2626')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ minWidth: 900 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Ngày', 'Loại', 'Nội dung', 'Mã CT', 'Số tiền', 'Người'].map((h, i) => <th key={i} style={thStyle(h === 'Số tiền' ? 'right' : 'left')}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {cbRows.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Không có phát sinh TM trong kỳ</td></tr>
                ) : cbRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 11px', fontWeight: 600 }}>{r.date}</td>
                    <td style={{ padding: '7px 11px' }}><span style={{ background: r.kind === 'thu' ? '#dcfce7' : '#fee2e2', color: r.kind === 'thu' ? '#15803d' : '#b91c1c', padding: '1px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>{r.kind === 'thu' ? 'Thu' : 'Chi'}</span></td>
                    <td style={{ padding: '7px 11px' }}>{r.label}</td>
                    <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{r.ref}</td>
                    <td style={{ ...tdR, color: r.kind === 'thu' ? '#15803d' : '#dc2626', fontWeight: 700 }}>{r.kind === 'thu' ? '+' : '−'} {fmt(r.amount)}đ</td>
                    <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{r.by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </KetoanListShell>

      {showModal && <ChiModal editing={editing} userRole={role} onClose={() => setShowModal(false)} onDone={() => { setShowModal(false); loadExpenses() }} />}
    </>
  )
}
