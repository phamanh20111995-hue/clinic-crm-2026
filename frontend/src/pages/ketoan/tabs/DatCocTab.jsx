import { useState, useEffect } from 'react'
import { IconCoin, IconPlus, IconRefresh, IconX, IconArrowRight, IconWallet, IconReceipt, IconArrowBackUp, IconBan } from '@tabler/icons-react'
import { getDeposits, getDepositContracts, applyDeposit, settleDeposit, deleteDeposit } from '../../../api/deposits'
import useAuthStore from '../../../store/authStore'
import { getUserRole } from '../../../utils/rolesV2'
import KetoanListShell from '../components/KetoanListShell'
import ChotHDModal from '../../sale/modals/ChotHDModal'
import toast from 'react-hot-toast'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const PAY_ROLES = ['KE_TOAN', 'QUAN_LY', 'CHU_DN']
const SM = {
  giu: { label: 'Đang giữ', bg: '#cffafe', color: '#0e7490' },
  da_dung: { label: 'Đã trừ HĐ', bg: '#dcfce7', color: '#15803d' },
  hoan: { label: 'Đã hoàn', bg: '#fef3c7', color: '#92400e' },
  mat: { label: 'Mất cọc', bg: '#fee2e2', color: '#b91c1c' },
}
const VM = {
  cho_xac_nhan: { label: 'Chờ xác nhận', bg: '#fef9c3', color: '#854d0e' },
  da_xac_nhan: { label: 'Đã xác nhận', bg: '#dcfce7', color: '#15803d' },
  lech: { label: 'Lệch', bg: '#fee2e2', color: '#b91c1c' },
}
const COLS = ['Mã', 'Ngày', 'Khách', 'Số tiền', 'HTTT', 'Lý do / Kết quả', 'Xác nhận', 'Trạng thái', '']

export default function DatCocTab() {
  const user = useAuthStore(s => s.user)
  const role = getUserRole(user)
  const canManage = PAY_ROLES.includes(role)

  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [applyFor, setApplyFor] = useState(null)     // deposit đang trừ vào HĐ
  const [contracts, setContracts] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = () => getDeposits().then(r => setRows(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [filter, pageSize])

  const counts = {
    all: rows.length,
    giu: rows.filter(r => r.status === 'giu').length,
    da_dung: rows.filter(r => r.status === 'da_dung').length,
    hoan: rows.filter(r => r.status === 'hoan').length,
    mat: rows.filter(r => r.status === 'mat').length,
  }
  const sumGiu = rows.filter(r => r.status === 'giu').reduce((s, r) => s + r.amount, 0)
  const filtered = rows.filter(r => filter === 'all' || r.status === filter)

  const openApply = async (d) => {
    setApplyFor(d); setContracts([])
    try { const r = await getDepositContracts(d.customer_id); setContracts(r.data ?? []) }
    catch { setContracts([]) }
  }
  const doApply = async (contractId) => {
    try { await applyDeposit(applyFor.id, { contract_id: contractId }); toast.success('Đã trừ cọc vào HĐ'); setApplyFor(null); load() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi trừ cọc') }
  }
  const doHoan = async (d) => {
    const m = window.confirm(`HOÀN cọc ${fmt(d.amount)}đ cho ${d.customer_name}?\nOK = hoàn bằng ${d.method === 'cash' ? 'tiền mặt' : 'chuyển khoản'} (như lúc nhận).`)
    if (!m) return
    try { await settleDeposit(d.id, { action: 'hoan', settle_method: d.method }); toast.success('Đã hoàn cọc'); load() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi hoàn cọc') }
  }
  const doMat = async (d) => {
    const note = window.prompt(`MẤT cọc ${fmt(d.amount)}đ của ${d.customer_name} (PK giữ → thu nhập khác).\nLý do:`, '')
    if (note === null) return
    try { await settleDeposit(d.id, { action: 'mat', note }); toast.success('Đã ghi mất cọc'); load() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi') }
  }
  const doDelete = async (d) => {
    if (!window.confirm(`Xóa phiếu cọc ${d.code}?`)) return
    try { await deleteDeposit(d.id); toast.success('Đã xóa'); load() }
    catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi xóa') }
  }

  const card = (icon, label, value, sub, color, border) => (
    <div style={{ background: '#fff', border: `1px solid ${border ?? '#dde3ef'}`, borderRadius: 9, padding: '11px 13px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
    </div>
  )
  const chip = (k, txt, n) => (
    <button onClick={() => setFilter(k)} style={{ padding: '5px 11px', borderRadius: 7, border: `1px solid ${filter === k ? '#0891b2' : '#dde3ef'}`, background: filter === k ? '#ecfeff' : '#fff', color: filter === k ? '#0e7490' : '#64748b', fontWeight: filter === k ? 700 : 500, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{txt}{n != null ? ` (${n})` : ''}</button>
  )
  const th = align => ({ padding: '7px 11px', textAlign: align, fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 })
  const thAction = { ...th('right'), right: 0, zIndex: 3, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
  const tdAction = { padding: '7px 11px', textAlign: 'right', position: 'sticky', right: 0, background: '#fff', zIndex: 2, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
  const btn = (bg, icon, txt, on) => (
    <button onClick={on} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 9px', border: 'none', borderRadius: 6, background: bg, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 4 }}>{icon}{txt}</button>
  )

  const stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
      {card(<IconWallet size={13} color="#0e7490" />, 'Đang giữ', String(counts.giu), fmt(sumGiu) + 'đ (nợ phải trả/giữ hộ)', '#0e7490', counts.giu ? '#0891b2' : undefined)}
      {card(<IconReceipt size={13} color="#15803d" />, 'Đã trừ HĐ', String(counts.da_dung), 'Đã dùng cho dịch vụ/SP', '#15803d')}
      {card(<IconArrowBackUp size={13} color="#92400e" />, 'Đã hoàn', String(counts.hoan), 'Trả lại khách', '#92400e')}
      {card(<IconBan size={13} color="#b91c1c" />, 'Mất cọc', String(counts.mat), 'PK giữ → thu nhập khác', '#b91c1c')}
    </div>
  )
  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {chip('all', 'Tất cả', counts.all)}
      {chip('giu', 'Đang giữ', counts.giu)}
      {chip('da_dung', 'Đã trừ HĐ', counts.da_dung)}
      {chip('hoan', 'Đã hoàn', counts.hoan)}
      {chip('mat', 'Mất cọc', counts.mat)}
      <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 11 }}><IconRefresh size={12} /> Tải lại</button>
      <button onClick={() => setShowCreate(true)} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 7, border: 'none', background: '#0891b2', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
        <IconPlus size={13} /> Tạo phiếu cọc
      </button>
    </div>
  )

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
      <KetoanListShell stats={stats} toolbar={toolbar} pagination={{ page, pageSize, count: filtered.length, onPage: setPage, onPageSize: setPageSize }}>
        <div style={{ minWidth: 1200 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>{COLS.map((h, i) => <th key={i} style={i === COLS.length - 1 ? thAction : th(h === 'Số tiền' ? 'right' : 'left')}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={COLS.length} style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Chưa có phiếu cọc nào</td></tr>
              ) : paged.map(d => {
                const sm = SM[d.status] ?? { label: d.status, bg: '#f1f5f9', color: '#64748b' }
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 11px', fontWeight: 700, color: '#0891b2' }}>{d.code}</td>
                    <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{d.received_at || (d.created_at || '').slice(0, 10)}</td>
                    <td style={{ padding: '7px 11px' }}>
                      <div style={{ fontWeight: 600, color: '#0f2044' }}>{d.customer_name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{d.customer_phone}</div>
                    </td>
                    <td style={{ padding: '7px 11px', textAlign: 'right', fontWeight: 700 }}>{fmt(d.amount)}đ</td>
                    <td style={{ padding: '7px 11px', fontSize: 10 }}>{d.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
                    <td style={{ padding: '7px 11px', fontSize: 11 }}>
                      {d.status === 'da_dung' ? <span style={{ color: '#15803d' }}>→ trừ vào {d.applied_contract_no}</span>
                        : d.status === 'hoan' ? <span style={{ color: '#92400e' }}>hoàn {d.settle_method === 'cash' ? 'TM' : 'CK'}{d.settle_note ? ` · ${d.settle_note}` : ''}</span>
                        : d.status === 'mat' ? <span style={{ color: '#b91c1c' }}>{d.settle_note || 'mất cọc'}</span>
                        : <span style={{ color: '#64748b' }}>{d.reason || '—'}</span>}
                    </td>
                    <td style={{ padding: '7px 11px' }}>{(() => { const vm = VM[d.verify_status] ?? VM.cho_xac_nhan; return <span style={{ background: vm.bg, color: vm.color, padding: '2px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{vm.label}</span> })()}</td>
                    <td style={{ padding: '7px 11px' }}><span style={{ background: sm.bg, color: sm.color, padding: '2px 9px', borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{sm.label}</span></td>
                    <td style={tdAction}>
                      {d.status === 'giu' && d.verify_status === 'da_xac_nhan' && canManage && <>
                        {btn('#0891b2', <IconArrowRight size={11} />, 'Trừ HĐ', () => openApply(d))}
                        {btn('#92400e', <IconArrowBackUp size={11} />, 'Hoàn', () => doHoan(d))}
                        {btn('#b91c1c', <IconBan size={11} />, 'Mất', () => doMat(d))}
                      </>}
                      {d.status === 'giu' && d.verify_status === 'cho_xac_nhan' && <span style={{ fontSize: 10, color: '#854d0e', fontStyle: 'italic', whiteSpace: 'nowrap' }}>⏳ chờ KT xác nhận</span>}
                      {d.status === 'giu' && d.verify_status === 'lech' && <span style={{ fontSize: 10, color: '#b91c1c', fontStyle: 'italic', whiteSpace: 'nowrap' }}>⚠ lệch - người ghi sửa</span>}
                      {d.status === 'giu' && d.verify_status !== 'da_xac_nhan' && btn('#94a3b8', <IconX size={11} />, '', () => doDelete(d))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </KetoanListShell>

      {showCreate && <ChotHDModal defaultMode="coc" onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); load() }} />}

      {applyFor && (
        <div onClick={() => setApplyFor(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: 520, maxWidth: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(15,23,42,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #eef1f6' }}>
              <IconArrowRight size={18} color="#0891b2" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0f2044' }}>Trừ cọc {fmt(applyFor.amount)}đ vào HĐ</span>
              <button onClick={() => setApplyFor(null)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}><IconX size={18} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>Khách <b>{applyFor.customer_name}</b> — chọn HĐ để trừ cọc (dịch vụ ban đầu hoặc SP/DV khách đổi sang):</div>
              {contracts.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 12, background: '#f8fafc', borderRadius: 8 }}>
                  Khách chưa có HĐ đã duyệt nào.<br />Tạo HĐ cho dịch vụ/SP (kể cả cái khách đổi sang) rồi quay lại trừ cọc.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {contracts.map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #dde3ef', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>{c.contract_no}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>Tổng {fmt(c.final_amount)}đ · còn nợ <b style={{ color: c.con_no > 0 ? '#dc2626' : '#15803d' }}>{fmt(c.con_no)}đ</b></div>
                      </div>
                      <button onClick={() => doApply(c.id)} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#0891b2', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Trừ vào đây</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
