import { useState, useEffect, useMemo } from 'react'
import { IconRefresh, IconEdit, IconSearch } from '@tabler/icons-react'
import { getPaymentsMine } from '../../../api/payments'
import SuaThuModal from '../modals/SuaThuModal'
import StatCard from '../../tele/components/StatCard'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const COLS = '1.7fr 1.1fr 1.4fr 1fr 1.1fr 90px'
const PAGE_SIZES = [20, 50, 100, 200]
const selectStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#334155' }

const STATUS = {
  cho_xac_nhan: { l: 'Chờ xác nhận', c: '#854d0e', bg: '#fef9c3' },
  da_xac_nhan:  { l: 'Đã xác nhận', c: '#15803d', bg: '#dcfce7' },
  lech:         { l: 'Lệch - cần sửa', c: '#991b1b', bg: '#fee2e2' },
}

const TIME_PRESETS = [
  { value: '', label: 'Tất cả thời gian' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'yesterday', label: 'Hôm qua' },
  { value: 'this_week', label: 'Tuần này' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'this_quarter', label: 'Quý này' },
  { value: 'this_year', label: 'Năm nay' },
  { value: 'custom', label: 'Tùy chọn...' },
]

function inPreset(dateStr, preset, from, to) {
  if (!preset) return true
  if (!dateStr) return false
  const d = new Date(dateStr)
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  switch (preset) {
    case 'today': return dd.getTime() === today.getTime()
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return dd.getTime() === y.getTime() }
    case 'this_week': { const s = new Date(today); const day = (s.getDay() + 6) % 7; s.setDate(s.getDate() - day); return dd >= s }
    case 'this_month': return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
    case 'this_quarter': return d.getFullYear() === today.getFullYear() && Math.floor(d.getMonth() / 3) === Math.floor(today.getMonth() / 3)
    case 'this_year': return d.getFullYear() === today.getFullYear()
    case 'custom': {
      if (from && dd < new Date(from)) return false
      if (to) { const t = new Date(to); t.setHours(23, 59, 59, 999); if (dd > t) return false }
      return true
    }
    default: return true
  }
}

export default function KhoanThuTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [suaTarget, setSuaTarget] = useState(null)

  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')      // all | cho | lech | da
  const [method, setMethod] = useState('')          // '' | tm | ck | tg
  const [timePreset, setTimePreset] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = async () => {
    setLoading(true)
    try { const r = await getPaymentsMine(); setRows(r.data ?? []) } catch { } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const lechCount = rows.filter(r => r.verify_status === 'lech').length
  const choCount = rows.filter(r => r.verify_status === 'cho_xac_nhan').length
  const tongThu = rows.reduce((s, r) => s + Number(r.total ?? 0), 0)

  const breakdown = p => [
    Number(p.cash_amount) > 0 && `TM ${fmt(p.cash_amount)}`,
    Number(p.transfer_amount) > 0 && `CK ${fmt(p.transfer_amount)}`,
    Number(p.installment_amount) > 0 && `Trả góp ${fmt(p.installment_amount)}`,
  ].filter(Boolean).join(' · ')

  const filtered = useMemo(() => {
    const s = (q || '').trim().toLowerCase()
    return rows.filter(p => {
      if (status === 'cho' && p.verify_status !== 'cho_xac_nhan') return false
      if (status === 'lech' && p.verify_status !== 'lech') return false
      if (status === 'da' && p.verify_status !== 'da_xac_nhan') return false
      if (method === 'tm' && !(Number(p.cash_amount) > 0)) return false
      if (method === 'ck' && !(Number(p.transfer_amount) > 0)) return false
      if (method === 'tg' && !(Number(p.installment_amount) > 0)) return false
      if (!inPreset(p.received_at, timePreset, customFrom, customTo)) return false
      if (s && !(String(p.customer_name || '').toLowerCase().includes(s) || String(p.contract_no || '').toLowerCase().includes(s))) return false
      return true
    })
  }, [rows, q, status, method, timePreset, customFrom, customTo])

  useEffect(() => { setPage(1) }, [q, status, method, timePreset, customFrom, customTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const curPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((curPage - 1) * pageSize, curPage * pageSize)

  const seg = (k, l) => (
    <button key={k} onClick={() => setStatus(k)}
      style={{ padding: '6px 11px', border: `1px solid ${status === k ? '#15803d' : '#dde3ef'}`, borderRadius: 7, background: status === k ? '#15803d' : '#fff', color: status === k ? '#fff' : '#64748b', fontSize: 11.5, fontWeight: status === k ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>{l}</button>
  )

  return (
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header cố định: thẻ + bộ lọc */}
      <div style={{ flexShrink: 0, padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard label="Tổng đã ghi thu" value={fmt(tongThu) + 'đ'} accent="#0f766e" />
          <StatCard label="Chờ xác nhận" value={String(choCount)} accent="#d97706" />
          <StatCard label="Cần sửa (lệch)" value={String(lechCount)} accent="#dc2626" />
        </div>

        {lechCount > 0 && (
          <div style={{ padding: '9px 13px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 12, color: '#991b1b', fontWeight: 700 }}>
            ⚠️ Có {lechCount} khoản bị Kế toán báo lệch — cần sửa lại.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 210 }}>
            <IconSearch size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm khách / HĐ..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px 7px 28px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
          </div>
          <select value={timePreset} onChange={e => setTimePreset(e.target.value)} style={selectStyle}>
            {TIME_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {timePreset === 'custom' && (
            <>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={selectStyle} />
              <span style={{ color: '#94a3b8', fontSize: 12 }}>→</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={selectStyle} />
            </>
          )}
          <select value={method} onChange={e => setMethod(e.target.value)} style={selectStyle}>
            <option value="">Mọi hình thức</option>
            <option value="tm">Tiền mặt</option>
            <option value="ck">Chuyển khoản</option>
            <option value="tg">Trả góp</option>
          </select>
          <button onClick={load} style={{ marginLeft: 'auto', padding: '7px 11px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <IconRefresh size={14} /> Làm mới
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {seg('all', `Tất cả (${rows.length})`)}
          {seg('cho', `Chờ xác nhận (${choCount})`)}
          {seg('lech', `Cần sửa (${lechCount})`)}
          {seg('da', 'Đã xác nhận')}
        </div>
      </div>

      {/* Bảng — lấp đầy chiều cao, cuộn bám đáy giống Khách của tôi */}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'scroll' }}>
            <div style={{ minWidth: 2000 }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'grid', gridTemplateColumns: COLS, gap: 10, fontSize: 10, fontWeight: 700, color: '#64748b' }}>
            <span>Khách / HĐ</span>
            <span>Tổng thu</span>
            <span>Chi tiết</span>
            <span>Ngày</span>
            <span>Trạng thái</span>
            <span></span>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Đang tải...</div>
          ) : pageRows.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#15803d', fontSize: 12 }}>Không có khoản thu</div>
          ) : pageRows.map(p => {
            const st = STATUS[p.verify_status] || { l: p.verify_status, c: '#64748b', bg: '#f1f5f9' }
            return (
              <div key={p.id} style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: COLS, gap: 10, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2044', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.customer_name}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{p.contract_no}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>{fmt(p.total)}đ</div>
                <div style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{breakdown(p)}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{(p.received_at || '').slice(0, 10)}</div>
                <div>
                  <span style={{ background: st.bg, color: st.c, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>{st.l}</span>
                  {p.verify_status === 'lech' && p.verify_note && (
                    <div style={{ fontSize: 9, color: '#991b1b', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.verify_note}</div>
                  )}
                </div>
                <div>
                  {p.verify_status === 'lech' && (
                    <button onClick={() => setSuaTarget(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'center', fontSize: 11, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
                      <IconEdit size={12} /> Sửa
                    </button>
                  )}
                </div>
              </div>
            )
          })}
            </div>
          </div>
        </div>
      </div>

      {/* Thanh phân trang dán đáy — giống màn Khách của tôi (position:fixed bottom:0) */}
      <div style={{ position: 'fixed', bottom: 0, left: 'var(--sidebar-w)', right: 0, zIndex: 50, borderTop: '1px solid #dde3ef', background: '#fff', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>
          Trang {curPage} / {totalPages} ({filtered.length} kết quả)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} style={selectStyle}>
            {PAGE_SIZES.map(opt => <option key={opt} value={opt}>Hiển thị {opt}/trang</option>)}
          </select>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={curPage <= 1}
            style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: curPage <= 1 ? 'default' : 'pointer', opacity: curPage <= 1 ? 0.4 : 1, fontFamily: 'inherit' }}>← Trước</button>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={curPage >= totalPages}
            style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: curPage >= totalPages ? 'default' : 'pointer', opacity: curPage >= totalPages ? 0.4 : 1, fontFamily: 'inherit' }}>Tiếp →</button>
        </div>
      </div>

      {suaTarget && <SuaThuModal payment={suaTarget} onClose={() => setSuaTarget(null)} onDone={() => { setSuaTarget(null); load() }} />}
    </div>
  )
}
