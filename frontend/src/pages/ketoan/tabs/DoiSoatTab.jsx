import { useState, useEffect } from 'react'
import { IconBuildingBank, IconCreditCard, IconCoin, IconCheck, IconRefresh } from '@tabler/icons-react'
import { getBankSettlement, confirmCardSettled, confirmInstallment, getCashRecon, saveCashRecon } from '../../../api/payments'
import KetoanListShell from '../components/KetoanListShell'
import toast from 'react-hot-toast'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const BANK_COLS = ['Loại', 'Số HĐ', 'KH', 'Nhà cung cấp', 'Mã GD / Số HĐ TG', 'Khách trả', 'Phí', 'Net về bank', 'Ngày', '']

export default function DoiSoatTab() {
  const [view, setView] = useState('bank') // 'bank' = tiền về bank | 'ket' = két TM

  // ---- View: Tiền về bank ----
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState({})
  const [showDa, setShowDa] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const loadBank = () => getBankSettlement(showDa ? {} : { status: 'cho' })
    .then(r => { setRows(r.data?.rows ?? []); setSummary(r.data?.summary ?? {}) })
    .catch(() => {})
  useEffect(() => { if (view === 'bank') loadBank() }, [view, showDa])
  useEffect(() => { setPage(1) }, [view, showDa, pageSize])

  const confirmVe = async (row) => {
    try {
      if (row.kind === 'the') await confirmCardSettled(row.payment_id, {})
      else await confirmInstallment(row.installment_id, {})
      toast.success('Đã xác nhận tiền về bank')
      loadBank()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi xác nhận') }
  }

  // ---- View: Két TM cuối ngày ----
  const [date, setDate] = useState(todayStr())
  const [soSach, setSoSach] = useState(0)
  const [tienDem, setTienDem] = useState('')
  const [existing, setExisting] = useState(null)
  const [note, setNote] = useState('')
  const [recons, setRecons] = useState([])

  const loadKet = () => {
    getCashRecon({ date }).then(r => {
      setSoSach(Number(r.data?.so_sach ?? 0))
      const ex = r.data?.existing ?? null
      setExisting(ex)
      setTienDem(ex ? String(ex.tien_dem) : '')
      setNote(ex?.note ?? '')
    }).catch(() => {})
    getCashRecon().then(r => setRecons(Array.isArray(r.data) ? r.data : [])).catch(() => {})
  }
  useEffect(() => { if (view === 'ket') loadKet() }, [view, date])

  const lechLive = (Number(tienDem || 0)) - Number(soSach || 0)
  const saveKet = async () => {
    try {
      await saveCashRecon({ date, tien_dem: Number(tienDem || 0), note })
      toast.success('Đã lưu đối soát két')
      loadKet()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi lưu') }
  }

  // ---- shared UI ----
  const card = (icon, label, value, sub, color, border) => (
    <div style={{ background: '#fff', border: `1px solid ${border ?? '#dde3ef'}`, borderRadius: 9, padding: '11px 13px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
    </div>
  )
  const tabBtn = (k, txt) => (
    <button onClick={() => setView(k)}
      style={{ padding: '6px 14px', border: 'none', borderBottom: `2px solid ${view === k ? '#b45309' : 'transparent'}`, background: 'transparent', color: view === k ? '#b45309' : '#64748b', fontWeight: view === k ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
      {txt}
    </button>
  )
  const thStyle = align => ({ padding: '7px 11px', textAlign: align, fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 })
  const thAction = { ...thStyle('right'), right: 0, zIndex: 3, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
  const tdR = { padding: '7px 11px', textAlign: 'right' }
  const tdAction = { padding: '7px 11px', textAlign: 'right', position: 'sticky', right: 0, background: '#fff', zIndex: 2, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }

  const stats = view === 'bank' ? (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {card(<IconBuildingBank size={13} color="#1e40af" />, 'Chờ về bank (net)', fmt(summary.cho_ve_net) + 'đ', `${summary.cho_ve_count ?? 0} khoản (thẻ + trả góp)`, '#1e40af', '#1e40af')}
      {card(<IconCheck size={13} color="#15803d" />, 'Đã về bank (net)', fmt(summary.da_ve_net) + 'đ', `${summary.da_ve_count ?? 0} khoản`, '#15803d')}
      {card(<IconCreditCard size={13} color="#0891b2" />, 'Tổng khoản', String((summary.cho_ve_count ?? 0) + (summary.da_ve_count ?? 0)), 'Thẻ VNPAY + trả góp', '#0891b2')}
    </div>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {card(<IconCoin size={13} color="#854d0e" />, 'Sổ sách (TM ghi)', fmt(soSach) + 'đ', `Ngày ${date}`, '#854d0e')}
      {card(<IconCoin size={13} color="#0f766e" />, 'Tiền đếm thực', fmt(tienDem) + 'đ', existing ? 'Đã lưu đối soát' : 'Chưa lưu', '#0f766e')}
      {card(<IconBuildingBank size={13} color={lechLive === 0 ? '#15803d' : '#dc2626'} />, 'Lệch (đếm − sổ)', (lechLive > 0 ? '+' : '') + fmt(lechLive) + 'đ', lechLive === 0 ? 'Khớp ✓' : (lechLive < 0 ? 'Thiếu két ⚠️' : 'Thừa két'), lechLive === 0 ? '#15803d' : '#dc2626', lechLive === 0 ? undefined : '#dc2626')}
    </div>
  )

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #eef1f6' }}>
      {tabBtn('bank', 'Tiền về bank (thẻ + trả góp)')}
      {tabBtn('ket', 'Két tiền mặt cuối ngày')}
      {view === 'bank' && (
        <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b', cursor: 'pointer', paddingRight: 8 }}>
          <input type="checkbox" checked={showDa} onChange={e => setShowDa(e.target.checked)} /> Hiện cả đã về
        </label>
      )}
    </div>
  )

  const bankPaged = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <KetoanListShell
      stats={stats}
      toolbar={toolbar}
      pagination={view === 'bank' ? { page, pageSize, count: rows.length, onPage: setPage, onPageSize: setPageSize } : null}
    >
      {view === 'bank' ? (
        <div style={{ minWidth: 1700 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {BANK_COLS.map((h, i) => <th key={i} style={i === BANK_COLS.length - 1 ? thAction : thStyle(['Khách trả', 'Phí', 'Net về bank'].includes(h) ? 'right' : 'left')}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {bankPaged.length === 0 ? (
                <tr><td colSpan={BANK_COLS.length} style={{ padding: 24, textAlign: 'center', color: '#15803d', fontSize: 12 }}>Không có khoản chờ về bank 🎉</td></tr>
              ) : bankPaged.map((r, idx) => (
                <tr key={`${r.kind}-${r.payment_id}-${r.installment_id ?? idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '7px 11px' }}>
                    <span style={{ background: r.kind === 'the' ? '#ecfeff' : '#f5f3ff', color: r.kind === 'the' ? '#0891b2' : '#7c3aed', padding: '1px 7px', borderRadius: 10, fontSize: 9, fontWeight: 700 }}>
                      {r.kind === 'the' ? 'Thẻ' : 'Trả góp'}
                    </span>
                  </td>
                  <td style={{ padding: '7px 11px', fontWeight: 700 }}>{r.contract_no}</td>
                  <td style={{ padding: '7px 11px' }}>{r.customer_name}</td>
                  <td style={{ padding: '7px 11px' }}>{r.provider}</td>
                  <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{r.ref || '—'}</td>
                  <td style={tdR}>{fmt(r.gross)}đ</td>
                  <td style={{ ...tdR, color: '#dc2626' }}>{r.phi ? '− ' + fmt(r.phi) + 'đ' : '—'}</td>
                  <td style={{ ...tdR, color: '#15803d', fontWeight: 700 }}>{fmt(r.net)}đ</td>
                  <td style={{ padding: '7px 11px', color: r.settled ? '#15803d' : '#1e40af', fontWeight: 600 }}>{(r.settled_at || r.date) ?? '—'}</td>
                  <td style={tdAction}>
                    {r.settled ? (
                      <span style={{ color: '#15803d', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>✓ Đã về</span>
                    ) : (
                      <button onClick={() => confirmVe(r)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 11px', border: 'none', borderRadius: 6, background: '#1e40af', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <IconCheck size={11} /> Về bank
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Form đối soát két */}
          <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: 16, maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>Đếm két tiền mặt</span>
              <button onClick={loadKet} style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', fontSize: 11 }}><IconRefresh size={12} /> Tải lại</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ngày đối soát</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Sổ sách — TM ghi trong CRM</label>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 7, padding: '7px 10px', fontSize: 13, background: '#f9fafb', color: '#854d0e', fontWeight: 700 }}>{fmt(soSach)}đ</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Tiền đếm thực trong két (₫) *</label>
                <input type="number" value={tienDem} onChange={e => setTienDem(e.target.value)} placeholder="0"
                  style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Lệch (đếm − sổ)</label>
                <div style={{ border: `1px solid ${lechLive === 0 ? '#a7f3d0' : '#fecaca'}`, borderRadius: 7, padding: '7px 10px', fontSize: 13, background: lechLive === 0 ? '#f0fdf4' : '#fef2f2', color: lechLive === 0 ? '#15803d' : '#dc2626', fontWeight: 700 }}>
                  {(lechLive > 0 ? '+' : '') + fmt(lechLive)}đ {lechLive === 0 ? '✓ khớp' : (lechLive < 0 ? '⚠️ thiếu két' : 'thừa két')}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Ghi chú</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Lý do lệch, người nộp, ca..."
                style={{ width: '100%', border: '1px solid #dde3ef', borderRadius: 7, padding: '7px 10px', fontSize: 13, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={saveKet} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#b45309', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {existing ? 'Cập nhật đối soát' : 'Lưu đối soát'}
              </button>
            </div>
          </div>

          {/* Lịch sử đối soát gần đây */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2044', margin: '0 0 8px' }}>Lịch sử đối soát két</div>
            <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Ngày', 'Cơ sở', 'Sổ sách', 'Đếm thực', 'Lệch', 'Người đếm', 'Ghi chú'].map((h, i) => (
                      <th key={i} style={{ padding: '7px 11px', textAlign: ['Sổ sách', 'Đếm thực', 'Lệch'].includes(h) ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recons.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 18, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Chưa có đối soát nào</td></tr>
                  ) : recons.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 11px', fontWeight: 600 }}>{r.date}</td>
                      <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{r.clinic_name}</td>
                      <td style={tdR}>{fmt(r.so_sach)}đ</td>
                      <td style={tdR}>{fmt(r.tien_dem)}đ</td>
                      <td style={{ ...tdR, color: r.lech === 0 ? '#15803d' : '#dc2626', fontWeight: 700 }}>{(r.lech > 0 ? '+' : '') + fmt(r.lech)}đ</td>
                      <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{r.counted_by_name}</td>
                      <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </KetoanListShell>
  )
}
