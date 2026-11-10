import { useState, useEffect, useCallback, useMemo } from 'react'
import { IconRefresh, IconAlertTriangle, IconSearch, IconFilter, IconX } from '@tabler/icons-react'
import { getTuaAllocations } from '../../../api/ketoan'

const ACCENT = '#b45309'
const EMPTY = <span style={{ color: '#cbd5e1' }}>—</span>

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function shiftDate(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00'); d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtPhone(p) {
  if (!p) return '—'
  const s = String(p).replace(/\D/g, '')
  if (s.length === 10) return `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}`
  return p
}

// Le tan CHI theo doi trang thai — KHONG hien so tien tua
const ST = {
  cho_xac_nhan: { bg: '#fef9c3', c: '#854d0e', s: 'Chờ' },
  da_xac_nhan:  { bg: '#dcfce7', c: '#15803d', s: 'Đã xác nhận' },
  tu_choi:      { bg: '#fee2e2', c: '#991b1b', s: 'Từ chối' },
  huy:          { bg: '#f1f5f9', c: '#64748b', s: 'Đã hủy' },
}
const ROLE_LABELS = { BS_TU_VAN: 'BS tư vấn', BS_DIEU_TRI: 'BS điều trị', KTV: 'KTV', SALE: 'Sale' }

// Dong bo voi bang Khach hang / Lich hen
const SOURCES = [
  { value: 'facebook', label: 'Facebook' }, { value: 'zalo', label: 'Zalo' },
  { value: 'google', label: 'Google/Maps' }, { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' }, { value: 'gioi_thieu', label: 'Giới thiệu' },
  { value: 'walkin', label: 'Walk-in' }, { value: 'khac', label: 'Khác' },
]
const CUSTOMER_GROUPS = ['Khách mới', 'Khách thường', 'Khách thân thiết', 'VIP', 'VVIP', 'Khách giới thiệu', 'Khách nội bộ']
const PROVINCES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Hải Phòng', 'Đà Nẵng', 'Cần Thơ', 'Huế', 'Tuyên Quang', 'Lào Cai', 'Thái Nguyên', 'Phú Thọ', 'Bắc Ninh', 'Hưng Yên', 'Ninh Bình', 'Quảng Trị', 'Quảng Ngãi', 'Gia Lai', 'Khánh Hòa', 'Lâm Đồng', 'Đắk Lắk', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long', 'Đồng Tháp', 'Cà Mau', 'An Giang', 'Cao Bằng', 'Điện Biên', 'Hà Tĩnh', 'Lai Châu', 'Lạng Sơn', 'Nghệ An', 'Quảng Ninh', 'Thanh Hóa', 'Sơn La']
const DATA_TYPE_LABELS = { nong: '🔥 Nóng', am: '🌤 Ấm', thuong: '❄ Thường' }
const DATA_TYPE_COLORS = { nong: { bg: '#fee2e2', c: '#991b1b' }, am: { bg: '#fef9c3', c: '#854d0e' }, thuong: { bg: '#f1f5f9', c: '#475569' } }
// Loai lich — dong bo tu bang Lich hen; phan biet khach moi (tu van) vs khach lieu trinh (dieu tri/tai kham)
const VISIT_LABELS = { tu_van: 'Tư vấn', dieu_tri: 'Điều trị', tai_kham: 'Tái khám', khieu_nai: 'Khiếu nại' }
const VISIT_COLORS = { tu_van: { bg: '#dbeafe', c: '#1d4ed8' }, dieu_tri: { bg: '#dcfce7', c: '#15803d' }, tai_kham: { bg: '#ede9fe', c: '#6d28d9' }, khieu_nai: { bg: '#fee2e2', c: '#991b1b' } }

const navBtnStyle = { border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }
const selectStyle = { padding: '7px 10px', border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit', background: '#fff' }
const pgBtnStyle = (d) => ({ padding: '6px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: d ? 'default' : 'pointer', fontFamily: 'inherit', opacity: d ? 0.4 : 1 })
const th = { padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', background: '#f8fafc' }
const td = { padding: '9px 12px', whiteSpace: 'nowrap' }

function StatCard({ label, value, accent, active, onClick }) {
  return (
    <div onClick={onClick} style={{ background: active ? '#fff7ed' : '#fff', borderRadius: 10, border: active ? `1px solid ${accent}` : '1px solid #dde3ef', padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,.06)', cursor: onClick ? 'pointer' : 'default' }}>
      <p style={{ fontSize: 22, fontWeight: 700, color: accent, lineHeight: 1.1, margin: 0 }}>{value ?? 0}</p>
      <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>{label}</p>
    </div>
  )
}
function RoleCell({ a }) {
  if (!a) return EMPTY
  const st = ST[a.status] || ST.cho_xac_nhan
  return (
    <div style={{ opacity: a.status === 'huy' ? 0.5 : 1 }}>
      <div style={{ fontWeight: 600, color: '#0f2044', fontSize: 12 }}>{a.user_name}</div>
      <span style={{ display: 'inline-block', background: st.bg, color: st.c, padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 600, marginTop: 2 }}>{st.s}</span>
    </div>
  )
}
function Pill({ children, bg = '#f1f5f9', c = '#475569' }) {
  return <span style={{ display: 'inline-block', background: bg, color: c, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500 }}>{children}</span>
}

const EMPTY_F = { q: '', role: '', person: '', status: '', source: '', group: '', province: '', data_type: '', visit_type: '' }

export default function ChiaTuaTab() {
  const [date, setDate]   = useState(todayStr())
  const [data, setData]   = useState({ results: [], cho_xac_nhan: 0, da_xac_nhan: 0, tu_choi: 0, huy: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage]   = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [f, setF] = useState(EMPTY_F)
  const [showPanel, setShowPanel] = useState(false)
  const isToday = date === todayStr()
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await getTuaAllocations({ date })
      const d = r.data || {}
      setData({ results: d.results || [], cho_xac_nhan: d.cho_xac_nhan || 0, da_xac_nhan: d.da_xac_nhan || 0, tu_choi: d.tu_choi || 0, huy: d.huy || 0 })
    } catch { setData({ results: [], cho_xac_nhan: 0, da_xac_nhan: 0, tu_choi: 0, huy: 0 }) }
    finally { setLoading(false) }
  }, [date])
  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [date, pageSize, f])

  const allocs = data.results || []
  const groups = useMemo(() => Object.values(allocs.reduce((m, a) => {
    const k = a.appointment
    if (!m[k]) m[k] = {
      appointment: k, customer: a.customer, phone: a.phone, source: a.source, source_display: a.source_display,
      customer_group: a.customer_group, province: a.province, data_type: a.data_type,
      visit_type: a.visit_type, visit_type_display: a.visit_type_display, service: a.service, roles: {},
    }
    m[k].roles[a.role] = a
    return m
  }, {})), [allocs])

  const persons = useMemo(() => {
    const s = new Set()
    allocs.forEach(a => { if (a.user_name) s.add(a.user_name) })
    return Array.from(s).sort((x, y) => x.localeCompare(y, 'vi'))
  }, [allocs])

  const filtered = useMemo(() => {
    const q = f.q.trim().toLowerCase()
    return groups.filter(g => {
      const rs = Object.values(g.roles)
      if (q) {
        const hay = `${g.customer || ''} ${g.phone || ''} ${g.service || ''} ${rs.map(a => a.user_name || '').join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (f.role && !g.roles[f.role]) return false
      if (f.person && !rs.some(a => a.user_name === f.person)) return false
      if (f.status && !rs.some(a => a.status === f.status)) return false
      if (f.source && g.source !== f.source) return false
      if (f.group && g.customer_group !== f.group) return false
      if (f.province && g.province !== f.province) return false
      if (f.data_type && g.data_type !== f.data_type) return false
      if (f.visit_type && g.visit_type !== f.visit_type) return false
      return true
    })
  }, [groups, f])

  const setStatus = (s) => setF(x => ({ ...x, status: x.status === s ? '' : s }))
  const clearFilter = () => setF(EMPTY_F)
  const hasBasic = f.q || f.role || f.person || f.status
  const hasAdv = f.source || f.group || f.province || f.data_type || f.visit_type
  const hasFilter = hasBasic || hasAdv

  const rejected = useMemo(() => allocs.filter(a => a.status === 'tu_choi'), [allocs])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {rejected.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '9px 14px', marginBottom: 12, flexShrink: 0 }}>
          <IconAlertTriangle size={16} color="#dc2626" />
          <span style={{ fontSize: 12, color: '#991b1b' }}>
            <b>{rejected.length} phần tua bị từ chối</b> — cần chia lại: {rejected.map(r => `${r.user_name} (${r.role_display})`).join(', ')}. Vào bảng Lịch hẹn đổi người.
          </span>
        </div>
      )}

      {/* Stat cards — KHÔNG có tiền tua, bấm để lọc theo trạng thái */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14, flexShrink: 0 }}>
        <StatCard label="Chờ xác nhận" value={data.cho_xac_nhan} accent={ACCENT} active={f.status === 'cho_xac_nhan'} onClick={() => setStatus('cho_xac_nhan')} />
        <StatCard label="Đã xác nhận" value={data.da_xac_nhan} accent="#15803d" active={f.status === 'da_xac_nhan'} onClick={() => setStatus('da_xac_nhan')} />
        <StatCard label="Từ chối" value={data.tu_choi} accent="#dc2626" active={f.status === 'tu_choi'} onClick={() => setStatus('tu_choi')} />
        <StatCard label="Đã hủy" value={data.huy} accent="#64748b" active={f.status === 'huy'} onClick={() => setStatus('huy')} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minHeight: 0 }}>
        {/* Bộ lọc — 1 hàng: điều hướng ngày + tìm kiếm + vai trò/trạng thái + Bộ lọc */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setDate(d => shiftDate(d, -1))} style={navBtnStyle}>←</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '6px 10px', fontSize: 12, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }} />
          <button onClick={() => setDate(d => shiftDate(d, 1))} style={navBtnStyle}>→</button>
          <button onClick={() => setDate(todayStr())} disabled={isToday}
            style={{ ...navBtnStyle, opacity: isToday ? 0.4 : 1, cursor: isToday ? 'default' : 'pointer', fontWeight: 600, color: ACCENT, borderColor: isToday ? '#dde3ef' : ACCENT }}>Hôm nay</button>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            <IconRefresh size={13} /> Làm mới
          </button>
          <div style={{ position: 'relative', width: 220 }}>
            <IconSearch size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input placeholder="Tìm tên, SĐT, dịch vụ, người nhận..." value={f.q} onChange={e => set('q', e.target.value)}
              style={{ width: '100%', paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: '1px solid #dde3ef', borderRadius: 7, fontSize: 12, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <select value={f.role} onChange={e => set('role', e.target.value)} style={selectStyle}>
            <option value="">Tất cả vai trò</option>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={f.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
            <option value="">Tất cả trạng thái</option>
            <option value="cho_xac_nhan">Chờ xác nhận</option>
            <option value="da_xac_nhan">Đã xác nhận</option>
            <option value="tu_choi">Từ chối</option>
            <option value="huy">Đã hủy</option>
          </select>
          <button onClick={() => setShowPanel(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              border: (showPanel || hasAdv) ? `1px solid ${ACCENT}` : '1px solid #dde3ef', background: (showPanel || hasAdv) ? '#fff7ed' : '#fff', color: (showPanel || hasAdv) ? ACCENT : '#64748b' }}>
            <IconFilter size={13} stroke={2} /> Bộ lọc{hasAdv ? ' •' : ''}
          </button>
          {hasFilter && (
            <button onClick={clearFilter}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' }}>
              <IconX size={13} stroke={2} /> Xóa lọc
            </button>
          )}
        </div>

        {/* Panel loc nang cao */}
        {showPanel && (
          <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <select value={f.visit_type} onChange={e => set('visit_type', e.target.value)} style={selectStyle}>
                <option value="">Tất cả loại lượt</option>
                {Object.entries(VISIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={f.person} onChange={e => set('person', e.target.value)} style={selectStyle}>
                <option value="">Tất cả người nhận</option>
                {persons.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={f.source} onChange={e => set('source', e.target.value)} style={selectStyle}>
                <option value="">Tất cả nguồn</option>
                {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select value={f.group} onChange={e => set('group', e.target.value)} style={selectStyle}>
                <option value="">Tất cả nhóm KH</option>
                {CUSTOMER_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={f.province} onChange={e => set('province', e.target.value)} style={selectStyle}>
                <option value="">Tất cả tỉnh/thành</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={f.data_type} onChange={e => set('data_type', e.target.value)} style={selectStyle}>
                <option value="">Tất cả loại data</option>
                <option value="nong">🔥 Nóng</option>
                <option value="am">🌤 Ấm</option>
                <option value="thuong">❄ Thường</option>
              </select>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60, color: '#9ca3af', fontSize: 13 }}>Đang tải...</div>
          ) : (
            <div style={{ overflowX: 'auto', overflowY: 'scroll', flex: 1, minHeight: 0, marginBottom: 30 }}>
              <table style={{ width: '100%', minWidth: 1480, borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={th}>Khách hàng</th><th style={th}>Loại lượt</th><th style={th}>SĐT</th><th style={th}>Nguồn</th>
                    <th style={th}>Nhóm KH</th><th style={th}>Tỉnh/thành</th><th style={th}>Loại data</th><th style={th}>Dịch vụ</th>
                    <th style={th}>BS tư vấn</th><th style={th}>BS điều trị</th><th style={th}>KTV</th><th style={th}>Sale</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr><td colSpan={12} style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                      {hasFilter ? 'Không có kết quả khớp bộ lọc.' : 'Chưa có chia tua ngày này. Gán BS/KTV/Sale trên bảng Lịch hẹn để bắt đầu.'}
                    </td></tr>
                  ) : paged.map(g => {
                    const dt = DATA_TYPE_COLORS[g.data_type]
                    const vt = VISIT_COLORS[g.visit_type]
                    return (
                      <tr key={g.appointment} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}><b style={{ color: '#0f2044' }}>{g.customer || '—'}</b></td>
                        <td style={td}>{vt ? <Pill bg={vt.bg} c={vt.c}>{g.visit_type_display || VISIT_LABELS[g.visit_type]}</Pill> : EMPTY}</td>
                        <td style={{ ...td, fontFamily: 'monospace', color: '#374151' }}>{fmtPhone(g.phone)}</td>
                        <td style={{ ...td, color: '#64748b' }}>{g.source_display || '—'}</td>
                        <td style={{ ...td, color: '#64748b' }}>{g.customer_group || '—'}</td>
                        <td style={{ ...td, color: '#64748b' }}>{g.province || '—'}</td>
                        <td style={td}>{dt ? <Pill bg={dt.bg} c={dt.c}>{DATA_TYPE_LABELS[g.data_type]}</Pill> : EMPTY}</td>
                        <td style={td}>{g.service || '—'}</td>
                        <td style={td}><RoleCell a={g.roles.BS_TU_VAN} /></td>
                        <td style={td}><RoleCell a={g.roles.BS_DIEU_TRI} /></td>
                        <td style={td}><RoleCell a={g.roles.KTV} /></td>
                        <td style={td}><RoleCell a={g.roles.SALE} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ position: 'fixed', bottom: 0, left: 'var(--sidebar-w)', right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 24px', background: '#fff', borderTop: '1px solid #dde3ef' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Trang {safePage} / {totalPages} ({filtered.length} buổi{hasFilter ? ` / ${groups.length}` : ''})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} style={selectStyle}>
              {[20, 50, 100, 200, 500, 1000].map(n => <option key={n} value={n}>Hiển thị {n}/trang</option>)}
            </select>
            <button disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={pgBtnStyle(safePage <= 1)}>← Trước</button>
            <button disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={pgBtnStyle(safePage >= totalPages)}>Tiếp →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
