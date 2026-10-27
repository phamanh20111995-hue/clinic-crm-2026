import { useState, useEffect, useMemo } from 'react'
import { IconRefresh, IconSearch } from '@tabler/icons-react'
import { getCongNo } from '../../../api/payments'
import ThuNoKTModal from '../../ketoan/modals/ThuNoKTModal'
import StatCard from '../../tele/components/StatCard'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const COLS = '2.5fr 1fr 1fr 1fr 110px'
const PAGE_SIZES = [20, 50, 100, 200]
const selectStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff', color: '#334155' }

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

const SORTS = [
  { value: 'no_desc', label: 'Còn nợ nhiều nhất' },
  { value: 'no_asc', label: 'Còn nợ ít nhất' },
  { value: 'moi', label: 'HĐ mới nhất' },
  { value: 'cu', label: 'HĐ cũ nhất' },
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

export default function CongNoTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [thuNoTarget, setThuNoTarget] = useState(null)

  const [q, setQ] = useState('')
  const [timePreset, setTimePreset] = useState('')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [sort, setSort] = useState('no_desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = async () => {
    setLoading(true)
    try { const r = await getCongNo(); setRows(r.data ?? []) } catch { } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = (q || '').trim().toLowerCase()
    let out = rows.filter(c => {
      if (!inPreset(c.created_at, timePreset, customFrom, customTo)) return false
      if (s && !(String(c.customer_name || '').toLowerCase().includes(s) || String(c.customer_phone || '').toLowerCase().includes(s))) return false
      return true
    })
    out = [...out].sort((a, b) => {
      if (sort === 'no_desc') return Number(b.remaining ?? 0) - Number(a.remaining ?? 0)
      if (sort === 'no_asc') return Number(a.remaining ?? 0) - Number(b.remaining ?? 0)
      if (sort === 'moi') return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      if (sort === 'cu') return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      return 0
    })
    return out
  }, [rows, q, timePreset, customFrom, customTo, sort])

  useEffect(() => { setPage(1) }, [q, timePreset, customFrom, customTo, sort])

  const totalDebt = filtered.reduce((s, c) => s + Number(c.remaining ?? 0), 0)
  const totalPaid = filtered.reduce((s, c) => s + Number(c.paid ?? 0), 0)

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const curPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((curPage - 1) * pageSize, curPage * pageSize)

  return (
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header cố định: thẻ + bộ lọc */}
      <div style={{ flexShrink: 0, padding: '14px 16px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <StatCard label="Tổng công nợ" value={fmt(totalDebt) + 'đ'} accent="#dc2626" />
          <StatCard label="Số HĐ còn nợ" value={String(filtered.length)} accent="#d97706" />
          <StatCard label="Tổng đã thu" value={fmt(totalPaid) + 'đ'} accent="#15803d" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 210 }}>
            <IconSearch size={14} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm tên / SĐT..."
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
          <select value={sort} onChange={e => setSort(e.target.value)} style={selectStyle}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button onClick={load} style={{ marginLeft: 'auto', padding: '7px 11px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
            <IconRefresh size={14} /> Làm mới
          </button>
        </div>
      </div>

      {/* Bảng — lấp đầy chiều cao, cuộn bám đáy giống Khách của tôi */}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', padding: '0 16px' }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'scroll' }}>
            <div style={{ minWidth: 2000 }}>
              <div style={{ position: 'sticky', top: 0, zIndex: 1, padding: '10px 14px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'grid', gridTemplateColumns: COLS, gap: 10, fontSize: 10, fontWeight: 700, color: '#64748b' }}>
            <span>Khách hàng / HĐ</span>
            <span style={{ textAlign: 'right' }}>Tổng HĐ</span>
            <span style={{ textAlign: 'right' }}>Đã thu</span>
            <span style={{ textAlign: 'right' }}>Còn nợ</span>
            <span></span>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Đang tải...</div>
          ) : pageRows.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#15803d', fontSize: 12 }}>Không có công nợ</div>
          ) : pageRows.map(c => (
            <div key={c.contract_id} style={{ padding: '10px 14px', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: COLS, gap: 10, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2044', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.customer_name}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{c.contract_no}</div>
              </div>
              <div style={{ fontSize: 12, textAlign: 'right', color: '#374151' }}>{fmt(c.final_amount)}đ</div>
              <div style={{ fontSize: 12, textAlign: 'right', color: '#15803d' }}>{fmt(c.paid)}đ</div>
              <div style={{ fontSize: 12, textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>{fmt(c.remaining)}đ</div>
              <div>
                <button
                  onClick={() => setThuNoTarget({ id: c.contract_id, customer_name: c.customer_name, final_amount: c.final_amount, paid: c.paid, remaining: c.remaining })}
                  style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: 'none', background: '#15803d', color: '#fff', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
                  Thu
                </button>
              </div>
            </div>
          ))}
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

      {thuNoTarget && <ThuNoKTModal contract={thuNoTarget} onClose={() => setThuNoTarget(null)} onDone={() => { setThuNoTarget(null); load() }} />}
    </div>
  )
}
