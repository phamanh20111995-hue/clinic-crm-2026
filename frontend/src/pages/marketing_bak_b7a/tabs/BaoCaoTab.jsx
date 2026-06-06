import { useState, useEffect } from 'react'
import { IconUpload, IconFileAnalytics } from '@tabler/icons-react'
import { getMktReport } from '../../../api/marketing'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const fmtK = n => n > 0 ? Math.round(n / 1000).toLocaleString('vi-VN') + 'k' : '—'

const kpiRoas  = v => v >= 1.5 ? '#15803d' : v >= 1.3 ? '#854d0e' : '#dc2626'
const kpiCpdt  = v => v <= 60 ? '#15803d' : v <= 75 ? '#854d0e' : '#dc2626'

const DEMO_MONTHS = [
  { month: 'T1/2026', cp: 72000000, mess: 298, data: 74, cp_mess: 242, cpl: 973, roas: 1.38, ds: 99000000, total_ds: 112000000, cpdt: 72.7 },
  { month: 'T2/2026', cp: 68500000, mess: 310, data: 79, cp_mess: 221, cpl: 867, roas: 1.46, ds: 100000000, total_ds: 115000000, cpdt: 68.5 },
  { month: 'T3/2026', cp: 75000000, mess: 325, data: 82, cp_mess: 231, cpl: 915, roas: 1.44, ds: 108000000, total_ds: 122000000, cpdt: 69.4 },
  { month: 'T4/2026', cp: 76200000, mess: 318, data: 84, cp_mess: 240, cpl: 907, roas: 1.45, ds: 110000000, total_ds: 125000000, cpdt: 69.3 },
  { month: 'T5/2026', cp: 85500000, mess: 342, data: 89, cp_mess: 250, cpl: 960, roas: 1.41, ds: 120500000, total_ds: 135000000, cpdt: 70.9, current: true },
]

const DEMO_FB_MONTHS = [
  { t: 'T1', cp: '38.500k', mess: 162, data: 41, cp_mess: '238k', cpl: '939k', roas: 1.40, ds: '54.000k', cpdt: 71.3 },
  { t: 'T2', cp: '36.200k', mess: 171, data: 44, cp_mess: '212k', cpl: '822k', roas: 1.52, ds: '55.000k', cpdt: 65.8 },
  { t: 'T3', cp: '41.000k', mess: 178, data: 46, cp_mess: '230k', cpl: '891k', roas: 1.46, ds: '60.000k', cpdt: 68.3 },
  { t: 'T4', cp: '40.800k', mess: 175, data: 45, cp_mess: '233k', cpl: '907k', roas: 1.47, ds: '60.000k', cpdt: 68.0 },
  { t: 'T5', cp: '45.200k', mess: 189, data: 48, cp_mess: '239k', cpl: '941k', roas: 1.37, ds: '62.000k', cpdt: 72.9 },
]

const DETAIL_ROWS = ['Chi phí MKT', 'Tổng Mess', 'Tổng Data', 'CP/Mess', 'CPL', 'ROAS', 'DS thực', 'CP MKT/DT']

export default function BaoCaoTab() {
  const [year, setYear] = useState('2026')
  const [platTab, setPlatTab] = useState('fb')
  const [rows, setRows] = useState([])

  useEffect(() => {
    getMktReport({ year }).then(r => {
      const d = r.data?.results ?? r.data ?? []
      setRows(Array.isArray(d) && d.length > 0 ? d : DEMO_MONTHS)
    })
  }, [year])

  const ytdCp   = rows.reduce((s, r) => s + Number(r.cp ?? 0), 0)
  const ytdMess = rows.reduce((s, r) => s + Number(r.mess ?? 0), 0)
  const ytdData = rows.reduce((s, r) => s + Number(r.data ?? 0), 0)
  const ytdDs   = rows.reduce((s, r) => s + Number(r.ds ?? 0), 0)

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <select value={year} onChange={e => setYear(e.target.value)}
          style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '5px 9px', fontSize: 11, background: '#fff', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
          <option>2026</option><option>2025</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: '1px solid #dde3ef', borderRadius: 7, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
            <IconUpload size={12} /> Xuất Excel
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: 'none', borderRadius: 7, background: '#0284c7', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <IconFileAnalytics size={12} /> Xuất PDF
          </button>
        </div>
      </div>

      {/* Bảng 12 tháng */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Phần 1 — Tổng hợp theo tháng (năm {year})</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 820 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Tháng', 'Chi phí MKT', 'Tổng Mess', 'Tổng Data', 'CP/Mess', 'CPL', 'ROAS', 'DS thực', 'Tổng DS', 'CP MKT/DT'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Tháng' ? 'left' : 'right', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.month} style={{ borderBottom: '1px solid #f1f5f9', background: r.current ? '#eff6ff' : undefined }}>
                  <td style={{ padding: '7px 10px', fontWeight: r.current ? 700 : 400 }}>{r.month}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: r.current ? '#0284c7' : '#334155', fontWeight: r.current ? 600 : 400 }}>{fmt(r.cp)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.mess}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{r.data}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: r.cp_mess <= 230 ? '#15803d' : '#854d0e', fontWeight: 600 }}>{r.cp_mess}k</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: r.cpl <= 900 ? '#15803d' : '#854d0e', fontWeight: 600 }}>{r.cpl}k</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: kpiRoas(r.roas), fontWeight: 600 }}>{r.roas}x</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(r.ds)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right' }}>{fmt(r.total_ds)}</td>
                  <td style={{ padding: '7px 10px', textAlign: 'right', color: kpiCpdt(r.cpdt), fontWeight: 600 }}>{r.cpdt}%</td>
                </tr>
              ))}
              {Array.from({ length: Math.max(0, 12 - rows.length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #f1f5f9', color: '#94a3b8' }}>
                  <td style={{ padding: '7px 10px' }}>T{rows.length + i + 1}/{year}</td>
                  <td colSpan={9} style={{ padding: '7px 10px', textAlign: 'center', fontStyle: 'italic', fontSize: 10 }}>Chưa có dữ liệu</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e9eef6' }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>TỔNG YTD</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>{fmt(ytdCp)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{ytdMess}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{ytdData}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#854d0e' }}>{ytdMess > 0 ? Math.round(ytdCp / ytdMess / 1000) + 'k' : '—'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>{ytdData > 0 ? Math.round(ytdCp / ytdData / 1000) + 'k' : '—'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>{ytdDs > 0 ? (ytdDs / ytdCp).toFixed(2) + 'x' : '—'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>{fmt(ytdDs)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>—</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#854d0e' }}>{ytdDs > 0 ? (ytdCp / ytdDs * 100).toFixed(1) + '%' : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Chi tiết nền tảng */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Phần 2 — Chi tiết theo nền tảng</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['fb','📘 Facebook'],['tiktok','🎵 TikTok'],['ig','📸 Instagram'],['zalo','💬 Zalo']].map(([v, l]) => (
              <button key={v} onClick={() => setPlatTab(v)}
                style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${platTab === v ? '#0284c7' : '#dde3ef'}`, background: platTab === v ? '#eff6ff' : '#f8fafc', color: platTab === v ? '#0284c7' : '#374151' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 700 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6' }}>Chỉ số</th>
                {DEMO_FB_MONTHS.map(m => (
                  <th key={m.t} style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: m.t === 'T5' ? '#0284c7' : '#64748b', borderBottom: '1px solid #eef1f6' }}>{m.t}</th>
                ))}
                {Array.from({ length: 7 }).map((_, i) => (
                  <th key={i} style={{ padding: '7px 10px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: '#94a3b8', borderBottom: '1px solid #eef1f6' }}>T{DEMO_FB_MONTHS.length + i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { lbl: 'Chi phí MKT', key: 'cp', bg: undefined, c: undefined },
                { lbl: 'Tổng Mess', key: 'mess', bg: undefined, c: undefined },
                { lbl: 'Tổng Data', key: 'data', bg: undefined, c: undefined },
                { lbl: 'CP/Mess', key: 'cp_mess', bg: '#eff6ff', c: '#0284c7' },
                { lbl: 'CPL', key: 'cpl', bg: '#eff6ff', c: '#0284c7' },
                { lbl: 'ROAS', key: 'roas', bg: '#eff6ff', c: '#15803d' },
                { lbl: 'DS thực', key: 'ds', bg: undefined, c: undefined },
                { lbl: 'CP MKT/DT', key: 'cpdt', bg: '#fef9f0', c: '#854d0e' },
              ].map(row => (
                <tr key={row.lbl} style={{ borderBottom: '1px solid #f1f5f9', background: row.bg }}>
                  <td style={{ padding: '7px 10px', fontWeight: 500, color: row.c ?? '#374151' }}>{row.lbl}</td>
                  {DEMO_FB_MONTHS.map(m => {
                    const v = m[row.key]
                    let color = row.c ?? '#334155'
                    if (row.key === 'roas') color = kpiRoas(v)
                    if (row.key === 'cpdt') color = kpiCpdt(v)
                    return (
                      <td key={m.t} style={{ padding: '7px 10px', textAlign: 'right', color, fontWeight: row.bg ? 600 : 400 }}>
                        {row.key === 'roas' ? v + 'x' : row.key === 'cpdt' ? v + '%' : typeof v === 'string' ? v : v}
                      </td>
                    )
                  })}
                  {Array.from({ length: 7 }).map((_, i) => (
                    <td key={i} style={{ padding: '7px 10px', textAlign: 'center', color: '#94a3b8', fontSize: 10 }}>—</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
