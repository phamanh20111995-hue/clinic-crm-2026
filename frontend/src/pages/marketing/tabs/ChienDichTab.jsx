import { useState, useEffect } from 'react'
import { IconSearch, IconPlus } from '@tabler/icons-react'
import { getMktCampaigns } from '../../../api/marketing'
import TaoCdModal from '../modals/TaoCdModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')
const fmtK = n => n > 0 ? Math.round(n / 1000).toLocaleString('vi-VN') + 'k' : '—'

const PLATFORM_ICON = {
  fb:    { icon: '📘', label: 'Facebook' },
  tiktok:{ icon: '🎵', label: 'TikTok' },
  ig:    { icon: '📸', label: 'Instagram' },
  zalo:  { icon: '💬', label: 'Zalo' },
  web:   { icon: '🌐', label: 'Website' },
  seed:  { icon: '⭐', label: 'Seeding' },
}

const DEMO = [
  { id: 1, name: 'Sẹo rỗ AirFusion - T05', platform: 'fb', service: 'Sẹo rỗ BS Kiên', staff: 'NV1', date_from: '01/05', date_to: '31/05', budget: 25000000, spent: 23500000, mess: 98, data: 26, cpl: 904000, ds: 32000000, roas: 1.36, status: 'active' },
  { id: 2, name: 'Trẻ hoá Thermage TikTok', platform: 'tiktok', service: 'Trẻ hoá BS Hưng', staff: 'NV2', date_from: '05/05', date_to: '25/05', budget: 15000000, spent: 14200000, mess: 67, data: 18, cpl: 789000, ds: 23000000, roas: 1.62, status: 'active' },
  { id: 3, name: 'SEO rỗ IG retarget', platform: 'ig', service: 'Sẹo rỗ BS Kiên', staff: 'NV1', date_from: '10/05', date_to: '20/05', budget: 5000000, spent: 4800000, mess: 18, data: 4, cpl: 1200000, ds: 5500000, roas: 1.15, status: 'ended' },
]

export default function ChienDichTab({ month }) {
  const [campaigns, setCampaigns] = useState([])
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [taoCdTarget, setTaoCdTarget] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const load = () => getMktCampaigns({ month }).then(r => {
    const d = r.data?.results ?? r.data ?? []
    setCampaigns(Array.isArray(d) && d.length > 0 ? d : DEMO)
  })

  useEffect(() => { load() }, [month])

  const filtered = campaigns.filter(c => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false
    if (filterPlatform && c.platform !== filterPlatform) return false
    return true
  })

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #dde3ef', borderRadius: 7, padding: '4px 9px', background: '#f8fafc' }}>
          <IconSearch size={13} color="#94a3b8" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm chiến dịch..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 11, width: 160, fontFamily: 'inherit' }} />
        </div>
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
          style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '5px 9px', fontSize: 11, background: '#fff', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
          <option value="">Tất cả nền tảng</option>
          <option value="fb">Facebook</option>
          <option value="tiktok">TikTok</option>
          <option value="ig">Instagram</option>
          <option value="zalo">Zalo</option>
          <option value="web">Website</option>
          <option value="seed">Seeding</option>
        </select>
        <button onClick={() => setCreateOpen(true)}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', border: 'none', borderRadius: 7, background: '#0284c7', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          <IconPlus size={13} /> Tạo chiến dịch
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, minWidth: 900 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Tên chiến dịch', 'Nền tảng', 'Dịch vụ', 'NV phụ trách', 'Ngày chạy', 'Ngân sách', 'Đã chi', 'Mess', 'Data', 'CPL', 'DS thực', 'ROAS', 'Trạng thái'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: ['Tên chiến dịch', 'Nền tảng', 'Dịch vụ', 'NV phụ trách'].includes(h) ? 'left' : 'right', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} style={{ padding: 28, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Không có chiến dịch</td></tr>
              ) : filtered.map(c => {
                const pl = PLATFORM_ICON[c.platform] ?? { icon: '📊', label: c.platform }
                const roas = Number(c.roas ?? 0)
                const cpl = Number(c.cpl ?? 0)
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                    onClick={() => setTaoCdTarget(c)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '8px 10px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                        {pl.icon} {pl.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 10, color: '#64748b' }}>{c.service}</td>
                    <td style={{ padding: '8px 10px', fontSize: 10 }}>{c.staff}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10 }}>{c.date_from} → {c.date_to}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(c.budget)}đ</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#ea580c' }}>{fmt(c.spent)}đ</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{c.mess}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{c.data}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: cpl <= 900000 ? '#15803d' : cpl <= 1100000 ? '#854d0e' : '#dc2626', fontWeight: 600 }}>{fmt(cpl)}đ</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#15803d' }}>{fmt(c.ds)}đ</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: roas >= 1.5 ? '#15803d' : roas >= 1.3 ? '#854d0e' : '#dc2626', fontWeight: 600 }}>{roas.toFixed(2)}x</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      <span style={{ background: c.status === 'active' ? '#dcfce7' : '#f1f5f9', color: c.status === 'active' ? '#15803d' : '#475569', padding: '1px 8px', borderRadius: 10, fontSize: 9, fontWeight: 600 }}>
                        {c.status === 'active' ? 'Đang chạy' : 'Đã kết thúc'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && <TaoCdModal onClose={() => setCreateOpen(false)} onDone={load} />}
      {taoCdTarget && <TaoCdModal campaign={taoCdTarget} onClose={() => setTaoCdTarget(null)} onDone={load} />}
    </div>
  )
}
