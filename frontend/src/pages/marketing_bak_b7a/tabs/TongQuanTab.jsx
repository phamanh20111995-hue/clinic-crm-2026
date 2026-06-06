import { useState, useEffect } from 'react'
import { IconUpload, IconRefresh } from '@tabler/icons-react'
import { getMktByPlatform } from '../../../api/marketing'
import KetNoiAPIModal from '../modals/KetNoiAPIModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const fmtK = n => n > 0 ? Math.round(n / 1000).toLocaleString('vi-VN') + 'k' : '—'
const pct = (a, b) => b > 0 ? (a / b * 100).toFixed(1) + '%' : '—'

const KPI = {
  ok:   { color: '#15803d', fw: 600 },
  warn: { color: '#854d0e', fw: 600 },
  bad:  { color: '#dc2626', fw: 600 },
  none: { color: '#334155', fw: 400 },
}

function kpiCpmMess(v) { return v <= 220000 ? 'ok' : v <= 280000 ? 'warn' : 'bad' }
function kpiCpl(v)     { return v <= 900000 ? 'ok' : v <= 1100000 ? 'warn' : 'bad' }
function kpiRoas(v)    { return v >= 1.5 ? 'ok' : v >= 1.3 ? 'warn' : 'bad' }
function kpiCpdt(v)    { return v <= 60 ? 'ok' : v <= 75 ? 'warn' : 'bad' }

const PLATFORM_ICON = {
  fb:    { icon: '📘', label: 'Facebook',     color: '#1877f2' },
  tiktok:{ icon: '🎵', label: 'TikTok',        color: '#010101' },
  ig:    { icon: '📸', label: 'Instagram',     color: '#e1306c' },
  zalo:  { icon: '💬', label: 'Zalo',          color: '#0068ff' },
  web:   { icon: '🌐', label: 'Website / SEO', color: '#64748b' },
  seed:  { icon: '⭐', label: 'Ads Seeding',   color: '#f59e0b' },
}

// demo data khi API chưa có
const DEMO_ROWS = [
  { key: 'fb',    cp: 45200000, imp: 1240000, click: 6800, mess: 189, data: 48, ds: 62000000 },
  { key: 'tiktok',cp: 22300000, imp: 980000,  click: 4200, mess: 98,  data: 27, ds: 35500000 },
  { key: 'ig',    cp: 8500000,  imp: 320000,  click: 1100, mess: 32,  data: 8,  ds: 9500000 },
  { key: 'zalo',  cp: 5500000,  imp: 0,       click: 0,    mess: 18,  data: 5,  ds: 8000000 },
  { key: 'web',   cp: 2000000,  imp: 85000,   click: 920,  mess: 0,   data: 1,  ds: 3500000 },
  { key: 'seed',  cp: 2000000,  imp: 0,       click: 0,    mess: 5,   data: 0,  ds: 2000000 },
]

export default function TongQuanTab({ onGoNhap, month }) {
  const [rows, setRows] = useState([])
  const [ketNoiOpen, setKetNoiOpen] = useState(false)

  useEffect(() => {
    getMktByPlatform({ month }).then(r => {
      const d = r.data?.results ?? r.data ?? []
      setRows(Array.isArray(d) && d.length > 0 ? d : DEMO_ROWS)
    })
  }, [month])

  const totCp   = rows.reduce((s, r) => s + Number(r.cp ?? 0), 0)
  const totMess = rows.reduce((s, r) => s + Number(r.mess ?? 0), 0)
  const totData = rows.reduce((s, r) => s + Number(r.data ?? 0), 0)
  const totDs   = rows.reduce((s, r) => s + Number(r.ds ?? 0), 0)
  const totCPM  = rows.reduce((s, r) => s + Number(r.imp ?? 0), 0)
  const avgRoas = totCp > 0 ? (totDs / totCp) : 0
  const cpdt    = totDs > 0 ? totCp / totDs * 100 : 0
  const cpMess  = totMess > 0 ? Math.round(totCp / totMess) : 0
  const cpl     = totData > 0 ? Math.round(totCp / totData) : 0

  const stats = [
    { lbl: 'Tổng chi phí MKT', val: fmt(totCp) + 'đ', sub: '+12% vs tháng trước', c: '#0284c7', subc: '#dc2626' },
    { lbl: 'Tổng Mess',         val: fmt(totMess),       sub: '+8% vs tháng trước', c: '#7c3aed', subc: '#15803d' },
    { lbl: 'Tổng Data / Lead',  val: fmt(totData),        sub: `CPL: ${fmt(cpl)}đ`,  c: '#ea580c', subc: '#64748b' },
    { lbl: 'ROAS',               val: avgRoas.toFixed(2) + 'x', sub: `DT: ${fmt(totDs)}đ`, c: '#15803d', subc: '#64748b' },
    { lbl: 'CP MKT / DT %',     val: cpdt.toFixed(1) + '%', sub: 'Mục tiêu: ≤60%', c: '#854d0e', subc: '#dc2626' },
  ]

  const cell = (v, n = 0) => ({ color: KPI[n].color, fontWeight: KPI[n].fw })

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
        {stats.map(s => (
          <div key={s.lbl} style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 5 }}>{s.lbl}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 10, color: s.subc, marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bảng nền tảng */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Hiệu quả theo nền tảng</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setKetNoiOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
              <IconRefresh size={11} /> Kéo từ Meta/TikTok
            </button>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
              <IconUpload size={11} /> Xuất Excel
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Nền tảng', 'Chi phí (đ)', 'Impression', 'Click', 'Mess', 'Data', 'CPM', 'CPC', 'CP/Mess', 'CPL', 'CTR', 'DS thực', 'ROAS', 'CP/DT%'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: h === 'Nền tảng' ? 'left' : 'right', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const pl = PLATFORM_ICON[r.key] ?? { icon: '📊', label: r.key, color: '#64748b' }
                const cp = Number(r.cp ?? 0), imp = Number(r.imp ?? 0), click = Number(r.click ?? 0)
                const mess = Number(r.mess ?? 0), data = Number(r.data ?? 0), ds = Number(r.ds ?? 0)
                const cpm    = imp > 0 ? Math.round(cp / imp * 1000) : 0
                const cpc    = click > 0 ? Math.round(cp / click) : 0
                const cpms   = mess > 0 ? Math.round(cp / mess) : 0
                const cpld   = data > 0 ? Math.round(cp / data) : 0
                const ctr    = imp > 0 ? (click / imp * 100).toFixed(2) + '%' : '—'
                const roas   = cp > 0 ? (ds / cp) : 0
                const cpdt2  = ds > 0 ? cp / ds * 100 : 0

                return (
                  <tr key={r.key} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onClick={() => onGoNhap?.(r.key)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{pl.icon}</span>
                        <b style={{ color: pl.color }}>{pl.label}</b>
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(cp)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{imp > 0 ? fmt(imp) : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{click > 0 ? fmt(click) : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{mess > 0 ? mess : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{data > 0 ? data : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtK(cpm)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmtK(cpc)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', ...cell(cpms, kpiCpmMess(cpms)) }}>{fmtK(cpms)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', ...cell(cpld, kpiCpl(cpld)) }}>{fmtK(cpld)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{ctr}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>{fmt(ds)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', ...cell(roas, kpiRoas(roas)) }}>{roas > 0 ? roas.toFixed(2) + 'x' : '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', ...cell(cpdt2, kpiCpdt(cpdt2)) }}>{cpdt2 > 0 ? cpdt2.toFixed(1) + '%' : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', borderTop: '2px solid #e9eef6' }}>
                <td style={{ padding: '7px 10px', fontWeight: 700 }}>TỔNG</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>{fmt(totCp)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(totCPM)}</td>
                <td colSpan={2} style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{fmt(totMess)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700 }}>{totData}</td>
                <td colSpan={2} style={{ padding: '7px 10px' }} />
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#854d0e' }}>{fmtK(cpMess)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#854d0e' }}>{fmtK(cpl)}</td>
                <td style={{ padding: '7px 10px' }} />
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#15803d' }}>{fmt(totDs)}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: avgRoas >= 1.3 ? '#15803d' : '#dc2626' }}>{avgRoas > 0 ? avgRoas.toFixed(2) + 'x' : '—'}</td>
                <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: cpdt <= 60 ? '#15803d' : '#854d0e' }}>{cpdt > 0 ? cpdt.toFixed(1) + '%' : '—'}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {ketNoiOpen && <KetNoiAPIModal onClose={() => setKetNoiOpen(false)} />}
    </div>
  )
}
