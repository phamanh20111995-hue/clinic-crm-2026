import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconRefresh, IconSearch, IconEye, IconBrandWhatsapp, IconAlertTriangle } from '@tabler/icons-react'
import { getCskhCustomers } from '../../../api/cskh'
import NhacZaloModal from '../modals/NhacZaloModal'

const ACCENT = '#be185d'

const STATUS_CFG = {
  'dang-chay':   { label: 'Đang chạy',   bg: '#fce7f3', color: '#be185d' },
  'can-nhac':    { label: 'Cần nhắc',    bg: '#fef9c3', color: '#854d0e' },
  'tre-lich':    { label: 'Trễ lịch',    bg: '#fee2e2', color: '#dc2626' },
  'hoan-thanh':  { label: 'Hoàn thành',  bg: '#dcfce7', color: '#15803d' },
  'da-xac-nhan': { label: 'Đã xác nhận', bg: '#dbeafe', color: '#1d4ed8' },
  'dang_cham_soc':{ label: 'Đang chăm sóc', bg: '#fce7f3', color: '#be185d' },
}

function ProgressBar({ done, total, isLate }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 80, height: 5, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: isLate ? '#dc2626' : ACCENT, borderRadius: 10 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: isLate ? '#dc2626' : ACCENT }}>{done}/{total}</span>
    </div>
  )
}

function Badge({ status }) {
  const cfg = STATUS_CFG[status] ?? { label: status, bg: '#f1f5f9', color: '#64748b' }
  return (
    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
      {cfg.label}
    </span>
  )
}

export default function LieuTrinhTab() {
  const navigate = useNavigate()
  const [rows, setRows]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filterSt, setFilterSt] = useState('')
  const [modal, setModal]       = useState(null)
  const [selRow, setSelRow]     = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCskhCustomers({ status: 'dang_cham_soc' })
      const data = res.data?.results ?? res.data ?? []
      setRows(Array.isArray(data) ? data : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const visible = rows.filter(r => {
    if (filterSt && r.status !== filterSt) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.full_name?.toLowerCase().includes(q) && !r.phone?.includes(q)) return false
    }
    return true
  })

  const canNhac   = rows.filter(r => r.status === 'can-nhac').length
  const treLich   = rows.filter(r => r.status === 'tre-lich').length
  const hoanThanh = rows.filter(r => r.status === 'hoan-thanh').length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{ padding: '10px 16px', background: '#fff', borderBottom: '1px solid #eef1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f2044' }}>KH đang chăm sóc</span>
        <button onClick={load} style={btnOutline}><IconRefresh size={13} /> Làm mới</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[
            { label: 'Đang chăm sóc', val: rows.length,  color: ACCENT },
            { label: 'Cần nhắc HN',   val: canNhac,      color: '#854d0e' },
            { label: 'Trễ lịch',       val: treLich,      color: '#dc2626' },
            { label: 'Hoàn thành T5',  val: hoanThanh,    color: '#15803d' },
          ].map(s => (
            <div key={s.label} style={statCard}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <IconSearch size={12} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input placeholder="Tên KH / SĐT..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ border: '1px solid #dde3ef', borderRadius: 7, padding: '5px 8px 5px 26px', fontSize: 12, outline: 'none', width: 170 }} />
          </div>
          {['', 'dang-chay', 'can-nhac', 'tre-lich', 'hoan-thanh'].map(s => (
            <button key={s} onClick={() => setFilterSt(s)}
              style={{ padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${filterSt === s ? ACCENT : '#dde3ef'}`, background: filterSt === s ? ACCENT : '#fff', color: filterSt === s ? '#fff' : '#64748b', transition: 'all .12s' }}>
              {s === '' ? 'Tất cả' : STATUS_CFG[s]?.label}
              {' '}({s === '' ? rows.length : rows.filter(r => r.status === s).length})
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #dde3ef', overflow: 'hidden', flex: 1 }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #eef1f6', background: '#f8fafc' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f2044' }}>Danh sách liệu trình</span>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Đang tải...</div>
          ) : visible.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <div>Chưa có KH đang chăm sóc</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Khách hàng', 'Dịch vụ', 'Tiến độ', 'Buổi tiếp theo', 'Nhân viên CS', 'Trạng thái', 'Hành động'].map(h => (
                      <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => {
                    const isLate = r.status === 'tre-lich'
                    return (
                      <tr key={r.id} style={{ background: isLate ? '#fef2f2' : '#fff' }}>
                        <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ fontWeight: 600, color: isLate ? '#dc2626' : '#111827' }}>{r.full_name}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>{r.phone}</div>
                        </td>
                        <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: '#374151', maxWidth: 140 }}>
                          {r.service ?? r.data_type_display ?? '—'}
                        </td>
                        <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                          <ProgressBar done={r.done ?? 0} total={r.total ?? 0} isLate={isLate} />
                        </td>
                        <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10, color: isLate ? '#dc2626' : '#374151', whiteSpace: 'nowrap' }}>
                          {r.next_date ?? '—'}
                        </td>
                        <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9', fontSize: 10 }}>
                          {r.cskh_name ?? '—'}
                        </td>
                        <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                          <Badge status={r.status} />
                        </td>
                        <td style={{ padding: '8px 11px', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {(r.status === 'can-nhac' || r.status === 'tre-lich') && (
                              <button onClick={() => { setSelRow(r); setModal('nhac-zalo') }}
                                style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: 'none', background: isLate ? ACCENT : '#00b259', color: '#fff', fontSize: 9, fontWeight: 600, cursor: 'pointer' }}>
                                {isLate ? <IconAlertTriangle size={11} /> : <IconBrandWhatsapp size={11} />}
                                {isLate ? 'Nhắc gấp' : 'Nhắc Zalo'}
                              </button>
                            )}
                            <button onClick={() => navigate(`/customers/${r.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 9, cursor: 'pointer' }}>
                              <IconEye size={11} /> Xem hồ sơ
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal === 'nhac-zalo' && selRow && (
        <NhacZaloModal
          appt={{ id: selRow.id, customer_name: selRow.full_name, service: selRow.service }}
          onClose={() => { setModal(null); setSelRow(null) }}
        />
      )}
    </div>
  )
}

const btnOutline = { display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1px solid #dde3ef', background: '#fff', color: '#374151', fontSize: 11, cursor: 'pointer' }
const statCard   = { background: '#fff', borderRadius: 9, border: '1px solid #dde3ef', padding: '11px 13px' }
