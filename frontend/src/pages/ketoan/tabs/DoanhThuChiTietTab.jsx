import { useState, useEffect, useMemo } from 'react'
import { IconRefresh, IconSearch, IconDownload, IconTrendingUp, IconFileInvoice } from '@tabler/icons-react'
import { getDoanhThuChiTiet } from '../../../api/payments'
import KetoanListShell from '../components/KetoanListShell'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const selectStyle = { border: '1px solid #dde3ef', borderRadius: 6, padding: '5px 9px', fontSize: 11, fontFamily: 'inherit', outline: 'none', background: '#fff', color: '#334155' }

const PERIODS = [
  { v: '', l: 'Tất cả thời gian' },
  { v: 'thismonth', l: 'Tháng này' },
  { v: 'lastmonth', l: 'Tháng trước' },
  { v: 'thisquarter', l: 'Quý này' },
  { v: 'thisyear', l: 'Năm nay' },
  { v: 'custom', l: 'Tùy chọn...' },
]
const ROLES = [
  { v: '', l: 'Mọi vai trò' },
  { v: 'SALE', l: 'Sale' }, { v: 'TELE', l: 'Tele' }, { v: 'CSKH', l: 'CSKH' },
  { v: 'ADS', l: 'Marketing/Ads' }, { v: 'TRUC_PAGE', l: 'Trực page' },
]
const GROUPS = [
  { v: 'user', l: 'Theo người' }, { v: 'role', l: 'Theo vai trò' },
  { v: 'clinic', l: 'Theo cơ sở' }, { v: 'region', l: 'Theo miền' },
]

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
function periodRange(preset, cf, ct) {
  const now = new Date(); const y = now.getFullYear(); const m = now.getMonth()
  const first = (yy, mm) => new Date(yy, mm, 1); const last = (yy, mm) => new Date(yy, mm + 1, 0)
  switch (preset) {
    case 'thismonth': return [iso(first(y, m)), iso(last(y, m))]
    case 'lastmonth': { const d = new Date(y, m - 1, 1); return [iso(first(d.getFullYear(), d.getMonth())), iso(last(d.getFullYear(), d.getMonth()))] }
    case 'thisquarter': { const q = Math.floor(m / 3); return [iso(first(y, q * 3)), iso(last(y, q * 3 + 2))] }
    case 'thisyear': return [iso(new Date(y, 0, 1)), iso(new Date(y, 11, 31))]
    case 'custom': return [cf || '', ct || '']
    default: return ['', '']
  }
}

function downloadCSV(filename, headers, matrix) {
  const esc = v => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const lines = [headers.map(esc).join(','), ...matrix.map(r => r.map(esc).join(','))]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function DoanhThuChiTietTab() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('thismonth')
  const [cf, setCf] = useState(''); const [ct, setCt] = useState('')
  const [roleF, setRoleF] = useState('')
  const [groupBy, setGroupBy] = useState('user')
  const [mode, setMode] = useState('summary')   // 'summary' | 'detail'
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const load = () => {
    setLoading(true)
    const [from, to] = periodRange(period, cf, ct)
    const params = {}
    if (from) params.from = from
    if (to) params.to = to
    if (roleF) params.role = roleF
    getDoanhThuChiTiet(params)
      .then(r => setRows(r.data?.rows ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [period, cf, ct, roleF])
  useEffect(() => { setPage(1) }, [groupBy, mode, q, period, roleF])

  // tổng (distinct theo HĐ, tránh cộng trùng nhiều vai trò)
  const totals = useMemo(() => {
    const seen = new Map()
    rows.forEach(r => { if (!seen.has(r.contract_id)) seen.set(r.contract_id, r.thuc_thu) })
    let tt = 0; seen.forEach(v => tt += Number(v || 0))
    return { thucThu: tt, soHD: seen.size }
  }, [rows])

  // gộp nhóm phía client
  const summary = useMemo(() => {
    const g = new Map()
    rows.forEach(r => {
      let key, label
      if (groupBy === 'user') { key = r.user_id; label = r.user_name || '—' }
      else if (groupBy === 'role') { key = r.role; label = r.role_display }
      else if (groupBy === 'clinic') { key = r.clinic_name || '∅'; label = r.clinic_name || '(Chưa gán cơ sở)' }
      else { key = r.region || '∅'; label = r.region || '(Chưa gán miền)' }
      const cur = g.get(key) || { label, so_hd: 0, thuc_thu: 0 }
      cur.so_hd += 1; cur.thuc_thu += Number(r.thuc_thu || 0)
      g.set(key, cur)
    })
    const tot = [...g.values()].reduce((s, x) => s + x.thuc_thu, 0) || 1
    return [...g.values()].map(x => ({ ...x, pct: Math.round(x.thuc_thu / tot * 100) })).sort((a, b) => b.thuc_thu - a.thuc_thu)
  }, [rows, groupBy])

  const detail = useMemo(() => {
    const s = (q || '').trim().toLowerCase()
    if (!s) return rows
    return rows.filter(r => [r.contract_no, r.customer_name, r.user_name, r.role_display].some(x => String(x || '').toLowerCase().includes(s)))
  }, [rows, q])

  const list = mode === 'summary' ? summary : detail
  const paged = list.slice((page - 1) * pageSize, page * pageSize)

  const stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      <div style={{ background: '#fff', border: '1px solid #0f766e', borderRadius: 9, padding: '11px 13px' }}>
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconTrendingUp size={13} color="#0f766e" />Tổng thực thu (kỳ)</div>
        <div style={{ fontSize: 19, fontWeight: 700, color: '#0f766e' }}>{fmt(totals.thucThu)}đ</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Cộng đúng theo HĐ, không trùng vai trò</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconFileInvoice size={13} color="#1e40af" />Số HĐ có thu</div>
        <div style={{ fontSize: 19, fontWeight: 700, color: '#1e40af' }}>{totals.soHD}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{rows.length} dòng quy doanh thu</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Đang nhóm</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#b45309' }}>{(GROUPS.find(x => x.v === groupBy) || {}).l}</div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{summary.length} nhóm</div>
      </div>
    </div>
  )

  const seg = (k, l) => (
    <button onClick={() => setMode(k)} key={k}
      style={{ padding: '5px 11px', border: `1px solid ${mode === k ? '#b45309' : '#dde3ef'}`, borderRadius: 7, background: mode === k ? '#b45309' : '#fff', color: mode === k ? '#fff' : '#64748b', fontSize: 11, fontWeight: mode === k ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>{l}</button>
  )

  const exportCSV = () => {
    if (mode === 'summary') {
      downloadCSV('doanh-thu-' + groupBy + '.csv', ['Nhóm', 'Số HĐ', 'Thực thu', '%'],
        summary.map(s => [s.label, s.so_hd, s.thuc_thu, s.pct + '%']))
    } else {
      downloadCSV('doanh-thu-chi-tiet.csv', ['Số HĐ', 'Khách', 'Người', 'Vai trò', 'Cơ sở', 'Miền', 'Tổng HĐ', 'Thực thu'],
        detail.map(r => [r.contract_no, r.customer_name, r.user_name, r.role_display, r.clinic_name, r.region, r.final_amount, r.thuc_thu]))
    }
  }

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <select value={period} onChange={e => setPeriod(e.target.value)} style={selectStyle}>
        {PERIODS.map(p => <option key={p.v} value={p.v}>{p.l}</option>)}
      </select>
      {period === 'custom' && (
        <>
          <input type="date" value={cf} onChange={e => setCf(e.target.value)} style={selectStyle} />
          <span style={{ color: '#94a3b8', fontSize: 11 }}>→</span>
          <input type="date" value={ct} onChange={e => setCt(e.target.value)} style={selectStyle} />
        </>
      )}
      <select value={roleF} onChange={e => setRoleF(e.target.value)} style={selectStyle}>
        {ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
      </select>
      <select value={groupBy} onChange={e => setGroupBy(e.target.value)} style={selectStyle}>
        {GROUPS.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 4 }}>{seg('summary', 'Tổng hợp')}{seg('detail', 'Chi tiết')}</div>
      {mode === 'detail' && (
        <div style={{ position: 'relative', width: 180 }}>
          <IconSearch size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm HĐ/khách/người..."
            style={{ ...selectStyle, width: '100%', boxSizing: 'border-box', paddingLeft: 26 }} />
        </div>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer', color: '#15803d', fontWeight: 600 }}>
          <IconDownload size={13} /> Xuất Excel
        </button>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer', color: '#64748b' }}>
          <IconRefresh size={13} /> Làm mới
        </button>
      </div>
    </div>
  )

  const th = (align) => ({ padding: '7px 11px', textAlign: align || 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 })
  const td = { padding: '7px 11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

  return (
    <KetoanListShell stats={stats} toolbar={toolbar} pagination={{ page, pageSize, count: list.length, onPage: setPage, onPageSize: setPageSize }}>
      <div style={{ minWidth: mode === 'summary' ? 640 : 1200 }}>
        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 11 }}>
          {mode === 'summary' ? (
            <>
              <colgroup><col style={{ width: '46%' }} /><col style={{ width: '16%' }} /><col style={{ width: '24%' }} /><col style={{ width: '14%' }} /></colgroup>
              <thead><tr>
                <th style={th()}>Nhóm ({(GROUPS.find(x => x.v === groupBy) || {}).l})</th>
                <th style={th()}>Số HĐ</th><th style={th()}>Thực thu</th><th style={th()}>%</th>
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</td></tr>
                  : paged.length === 0 ? <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#15803d' }}>Không có dữ liệu</td></tr>
                    : paged.map((s, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ ...td, fontWeight: 700, color: '#0f2044' }}>{s.label}</td>
                        <td style={td}>{s.so_hd}</td>
                        <td style={{ ...td, fontWeight: 700, color: '#0f766e' }}>{fmt(s.thuc_thu)}đ</td>
                        <td style={td}>{s.pct}%</td>
                      </tr>
                    ))}
              </tbody>
            </>
          ) : (
            <>
              <colgroup><col style={{ width: '12%' }} /><col style={{ width: '16%' }} /><col style={{ width: '16%' }} /><col style={{ width: '13%' }} /><col style={{ width: '15%' }} /><col style={{ width: '10%' }} /><col style={{ width: '9%' }} /><col style={{ width: '9%' }} /></colgroup>
              <thead><tr>
                {['Số HĐ', 'Khách', 'Người', 'Vai trò', 'Cơ sở', 'Miền', 'Tổng HĐ', 'Thực thu'].map(h => <th key={h} style={th()}>{h}</th>)}
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#9ca3af' }}>Đang tải...</td></tr>
                  : paged.length === 0 ? <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#15803d' }}>Không có dữ liệu</td></tr>
                    : paged.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ ...td, fontWeight: 700 }}>{r.contract_no}</td>
                        <td style={td}>{r.customer_name}</td>
                        <td style={{ ...td, fontWeight: 600, color: '#0f2044' }}>{r.user_name}</td>
                        <td style={td}>{r.role_display}</td>
                        <td style={td}>{r.clinic_name || '—'}</td>
                        <td style={td}>{r.region || '—'}</td>
                        <td style={{ ...td, color: '#374151' }}>{fmt(r.final_amount)}đ</td>
                        <td style={{ ...td, fontWeight: 700, color: '#0f766e' }}>{fmt(r.thuc_thu)}đ</td>
                      </tr>
                    ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    </KetoanListShell>
  )
}
