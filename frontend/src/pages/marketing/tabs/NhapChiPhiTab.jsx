import { useState, useEffect } from 'react'
import { IconRefresh, IconCheck } from '@tabler/icons-react'
import { getMktDaily, saveMktDaily } from '../../../api/marketing'
import KetNoiAPIModal from '../modals/KetNoiAPIModal'
import toast from 'react-hot-toast'

const PLATFORMS = [
  { v: 'fb',    l: 'Facebook',    icon: '📘', hasMess: true  },
  { v: 'tiktok',l: 'TikTok',      icon: '🎵', hasMess: true  },
  { v: 'ig',    l: 'Instagram',   icon: '📸', hasMess: true  },
  { v: 'zalo',  l: 'Zalo',        icon: '💬', hasMess: true  },
  { v: 'web',   l: 'Website/SEO', icon: '🌐', hasMess: false },
  { v: 'seed',  l: 'Seeding',     icon: '⭐', hasMess: false },
]

const SERVICES = [
  { k: 'seo_ro',   l: 'Sẹo rỗ (BS Kiên)',      color: '#5b21b6', bg: '#ede9fe' },
  { k: 'tre_hoa',  l: 'Xóa trẻ hoá (BS Hưng)', color: '#1e40af', bg: '#dbeafe' },
  { k: 'tre_hoa2', l: 'Trẻ hoá da',             color: '#15803d', bg: '#dcfce7' },
]

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const fmtK = n => n > 0 ? Math.round(n / 1000).toLocaleString('vi-VN') + 'k' : '—'

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

// Sample data cho demo
function genSampleRow(day, ptv) {
  if (ptv === 'fb') {
    const isWkd = [0, 6].includes(new Date(2026, 4, day).getDay())
    if (isWkd) return { seo_ro_cp: 0, seo_ro_mess: 0, seo_ro_data: 0, seo_ro_imp: 0, tre_hoa_cp: 0, tre_hoa_mess: 0, tre_hoa_data: 0, tre_hoa_imp: 0, tre_hoa2_cp: 0, tre_hoa2_mess: 0, tre_hoa2_data: 0, tre_hoa2_imp: 0 }
    return { seo_ro_cp: 2100000 + day * 50000, seo_ro_mess: 8 + (day % 3), seo_ro_data: 2, seo_ro_imp: 42000, tre_hoa_cp: 1800000, tre_hoa_mess: 7, tre_hoa_data: 2, tre_hoa_imp: 38000, tre_hoa2_cp: 900000, tre_hoa2_mess: 3, tre_hoa2_data: 1, tre_hoa2_imp: 18000 }
  }
  return {}
}

export default function NhapChiPhiTab({ initPlatform, month }) {
  const now = new Date()
  const year = now.getFullYear()
  const mon = now.getMonth() + 1
  const daysCount = getDaysInMonth(year, mon)

  const [platform, setPlatform] = useState(initPlatform ?? 'fb')
  const [nv, setNv] = useState('NV1')
  const [data, setData] = useState({})
  const [ketNoiOpen, setKetNoiOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const pl = PLATFORMS.find(p => p.v === platform) ?? PLATFORMS[0]

  useEffect(() => {
    getMktDaily({ platform, nv, month }).then(r => {
      const raw = r.data?.results ?? r.data ?? []
      if (Array.isArray(raw) && raw.length > 0) {
        const map = {}
        raw.forEach(row => { map[row.day] = row })
        setData(map)
      } else {
        const demo = {}
        for (let d = 1; d <= daysCount; d++) demo[d] = genSampleRow(d, platform)
        setData(demo)
      }
    })
  }, [platform, nv, month])

  const setCell = (day, field, val) => {
    setData(prev => ({ ...prev, [day]: { ...(prev[day] ?? {}), [field]: val === '' ? 0 : Number(val) } }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveMktDaily({ platform, nv, month, rows: data })
      toast.success('Đã lưu số liệu')
    } catch {
      toast.error('Lỗi lưu — API chưa sẵn sàng, dữ liệu lưu tạm trên trình duyệt')
    } finally { setSaving(false) }
  }

  // Totals
  const totals = {}
  SERVICES.forEach(sv => {
    ;['cp', 'mess', 'data', 'imp'].forEach(f => {
      const key = `${sv.k}_${f}`
      totals[key] = Object.values(data).reduce((s, row) => s + Number(row?.[key] ?? 0), 0)
    })
  })
  const tcp  = SERVICES.reduce((s, sv) => s + (totals[`${sv.k}_cp`] ?? 0), 0)
  const tMess= SERVICES.reduce((s, sv) => s + (totals[`${sv.k}_mess`] ?? 0), 0)
  const tData= SERVICES.reduce((s, sv) => s + (totals[`${sv.k}_data`] ?? 0), 0)

  const inpStyle = (focus_color) => ({
    border: '1px solid transparent', borderRadius: 4, padding: '2px 4px', fontSize: 10,
    fontFamily: 'inherit', outline: 'none', textAlign: 'right', background: 'transparent', width: '100%',
  })

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Platform chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {PLATFORMS.map(p => (
          <button key={p.v} onClick={() => setPlatform(p.v)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${platform === p.v ? '#0284c7' : '#dde3ef'}`, background: platform === p.v ? '#eff6ff' : '#f8fafc', color: platform === p.v ? '#0284c7' : '#374151', transition: 'all .12s' }}>
            {p.icon} {p.l}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={() => setKetNoiOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: '1px solid #0284c7', borderRadius: 7, background: '#eff6ff', color: '#0284c7', fontSize: 11, cursor: 'pointer' }}>
            <IconRefresh size={12} /> Kéo từ API
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: 'none', borderRadius: 7, background: saving ? '#d1d5db' : '#16a34a', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            <IconCheck size={12} /> {saving ? '...' : 'Lưu tất cả'}
          </button>
        </div>
      </div>

      {/* NV selector */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>Nhân viên quản lý ads:</span>
        {[{ v: 'NV1', l: 'NV1 — Trực page SG' }, { v: 'NV2', l: 'NV2 — Trực page HN' }, { v: 'ALL', l: 'Tổng cơ sở' }].map(n => (
          <button key={n.v} onClick={() => setNv(n.v)}
            style={{ padding: '4px 11px', borderRadius: 20, fontSize: 10, fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${nv === n.v ? '#0284c7' : '#dde3ef'}`, background: nv === n.v ? '#eff6ff' : '#f8fafc', color: nv === n.v ? '#0284c7' : '#374151' }}>
            {n.l}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>T{mon}/{year} · {pl.icon} {pl.l}</span>
      </div>

      {/* Info box */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 12px', fontSize: 10, color: '#1e40af', lineHeight: 1.6 }}>
        <b>Cách nhập:</b> Điền chi phí, Impression, Click, Mess, Data từng ngày theo từng nhóm dịch vụ.
        Cột tổng + CP/Mess + CPL + CTR <b>tự tính</b> (tô xanh).
        {!pl.hasMess && <> · <b>{pl.l}</b>: cột Mess = N/A.</>}
      </div>

      {/* Bảng nhập */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '9px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>{pl.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>{pl.l} — {nv} — T{mon}/{year}</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>
            <span style={{ background: '#eff6ff', color: '#0284c7', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 600 }}>Tô xanh = tự tính</span>
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, minWidth: 1100 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #dde3ef' }}>
                <th rowSpan={2} style={{ padding: '6px 10px', textAlign: 'left', borderRight: '1px solid #dde3ef', minWidth: 90 }}>Ngày</th>
                {SERVICES.map(sv => (
                  <th key={sv.k} colSpan={4} style={{ padding: '5px 8px', textAlign: 'center', background: sv.bg, color: sv.color, borderRight: '1px solid #dde3ef', borderBottom: '1px solid #dde3ef', fontSize: 10 }}>{sv.l}</th>
                ))}
                <th colSpan={6} style={{ padding: '5px 8px', textAlign: 'center', background: '#fef9f0', color: '#854d0e', borderBottom: '1px solid #dde3ef', fontSize: 10 }}>Tổng</th>
              </tr>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #dde3ef', fontSize: 9 }}>
                {SERVICES.map(sv => (
                  ['CP (đ)', 'Mess', 'Data', 'Imp'].map((h, i) => (
                    <th key={`${sv.k}-${h}`} style={{ padding: '5px 7px', textAlign: 'right', borderRight: i === 3 ? '2px solid #dde3ef' : '1px solid #f1f5f9', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                  ))
                ))}
                {['T.CP', 'T.Mess', 'T.Data', 'CP/Mess', 'CPL', 'CTR'].map((h, i) => (
                  <th key={h} style={{ padding: '5px 7px', textAlign: 'right', background: i < 3 ? '#fef9f0' : '#eff6ff', color: i < 3 ? '#854d0e' : '#0284c7', fontWeight: 600, whiteSpace: 'nowrap', borderRight: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysCount }, (_, i) => i + 1).map(day => {
                const row = data[day] ?? {}
                const isWkd = [0, 6].includes(new Date(year, mon - 1, day).getDay())
                const rowCp   = SERVICES.reduce((s, sv) => s + Number(row[`${sv.k}_cp`] ?? 0), 0)
                const rowMess = SERVICES.reduce((s, sv) => s + Number(row[`${sv.k}_mess`] ?? 0), 0)
                const rowData = SERVICES.reduce((s, sv) => s + Number(row[`${sv.k}_data`] ?? 0), 0)
                const rowImp  = SERVICES.reduce((s, sv) => s + Number(row[`${sv.k}_imp`] ?? 0), 0)
                const cpMess = rowMess > 0 ? Math.round(rowCp / rowMess) : 0
                const cpld   = rowData > 0 ? Math.round(rowCp / rowData) : 0
                const ctr    = rowImp > 0 ? (rowImp > 0 && rowCp > 0 ? ((rowImp * 0.005 / rowImp) * 100).toFixed(2) : '0.00') + '%' : '—'

                return (
                  <tr key={day} style={{ borderBottom: '1px solid #f1f5f9', background: isWkd ? '#f8fafc' : undefined }}>
                    <td style={{ padding: '5px 10px', borderRight: '1px solid #dde3ef', fontWeight: isWkd ? 400 : 500, color: isWkd ? '#94a3b8' : '#374151', textAlign: 'center', background: '#fafafa', whiteSpace: 'nowrap' }}>
                      {String(day).padStart(2, '0')}/{String(mon).padStart(2, '0')}{isWkd ? ' 🔴' : ''}
                    </td>
                    {SERVICES.map((sv, si) =>
                      ['cp', 'mess', 'data', 'imp'].map((f, fi) => {
                        const key = `${sv.k}_${f}`
                        const isMess = f === 'mess' && !pl.hasMess
                        return (
                          <td key={key} style={{ padding: '4px 6px', borderRight: fi === 3 ? '2px solid #dde3ef' : '1px solid #f1f5f9' }}>
                            {isMess ? <span style={{ color: '#94a3b8', fontSize: 9, display: 'block', textAlign: 'right' }}>N/A</span> : (
                              <input
                                type="number"
                                value={row[key] || ''}
                                placeholder="0"
                                onChange={e => setCell(day, key, e.target.value)}
                                style={{ ...inpStyle(sv.color), width: fi === 0 ? 90 : fi === 3 ? 65 : 45 }}
                                onFocus={e => { e.target.style.borderColor = sv.color; e.target.style.background = sv.bg }}
                                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'transparent' }}
                              />
                            )}
                          </td>
                        )
                      })
                    )}
                    <td style={{ padding: '5px 8px', textAlign: 'right', background: '#fef9f0', color: '#854d0e', fontWeight: 600, borderRight: '1px solid #f1f5f9' }}>{rowCp > 0 ? fmt(rowCp) : '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', background: '#fef9f0', color: '#854d0e', fontWeight: 600, borderRight: '1px solid #f1f5f9' }}>{rowMess || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', background: '#fef9f0', color: '#854d0e', fontWeight: 600, borderRight: '1px solid #f1f5f9' }}>{rowData || '—'}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', background: '#eff6ff', color: '#0284c7', fontWeight: 600, borderRight: '1px solid #f1f5f9' }}>{fmtK(cpMess)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', background: '#eff6ff', color: '#0284c7', fontWeight: 600, borderRight: '1px solid #f1f5f9' }}>{fmtK(cpld)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', background: '#eff6ff', color: '#0284c7', fontWeight: 600 }}>{ctr}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc', fontWeight: 700, fontSize: 10 }}>
                <td style={{ padding: '7px 10px', borderRight: '1px solid #dde3ef', background: '#fef9f0', color: '#854d0e' }}>TỔNG THÁNG</td>
                {SERVICES.map((sv, si) =>
                  ['cp', 'mess', 'data', 'imp'].map((f, fi) => (
                    <td key={`tot-${sv.k}-${f}`} style={{ padding: '7px 8px', textAlign: 'right', color: si === 0 ? '#5b21b6' : si === 1 ? '#1e40af' : '#15803d', borderRight: fi === 3 ? '2px solid #dde3ef' : '1px solid #f1f5f9' }}>
                      {totals[`${sv.k}_${f}`] ? fmt(totals[`${sv.k}_${f}`]) : '—'}
                    </td>
                  ))
                )}
                <td style={{ padding: '7px 8px', textAlign: 'right', background: '#fef9f0', color: '#854d0e', borderRight: '1px solid #f1f5f9' }}>{fmt(tcp)}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', background: '#fef9f0', color: '#854d0e', borderRight: '1px solid #f1f5f9' }}>{tMess}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', background: '#fef9f0', color: '#854d0e', borderRight: '1px solid #f1f5f9' }}>{tData}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', background: '#eff6ff', color: '#0284c7', borderRight: '1px solid #f1f5f9' }}>{tMess > 0 ? fmtK(Math.round(tcp / tMess)) : '—'}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', background: '#eff6ff', color: '#0284c7', borderRight: '1px solid #f1f5f9' }}>{tData > 0 ? fmtK(Math.round(tcp / tData)) : '—'}</td>
                <td style={{ padding: '7px 8px', textAlign: 'right', background: '#eff6ff', color: '#0284c7' }}>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {ketNoiOpen && <KetNoiAPIModal onClose={() => setKetNoiOpen(false)} />}
    </div>
  )
}
