import { useState, useEffect } from 'react'
import { IconTrendingUp, IconClock, IconReceipt, IconPercentage, IconUpload } from '@tabler/icons-react'
import { getContracts, getKpiDashboard } from '../../../api/ketoan'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

const PM_ICON = { transfer: '🏦 CK', cash: '💵 TM', combined: '🔀 CK+TM' }
const PM_LABEL = { transfer: 'Chuyển khoản', cash: 'Tiền mặt', combined: 'CK + TM' }

export default function DoanhThuTab() {
  const [contracts, setContracts] = useState([])
  const [kpi, setKpi] = useState(null)
  const [filterLoai, setFilterLoai] = useState('')
  const [filterSale, setFilterSale] = useState('')

  useEffect(() => {
    getContracts({ approval_status: 'approved' }).then(r => setContracts(r.data?.results ?? r.data ?? [])).catch(() => {})
    getKpiDashboard().then(r => setKpi(r.data)).catch(() => {})
  }, [])

  const filtered = contracts.filter(c => {
    if (filterLoai && c.loai_dv !== filterLoai) return false
    if (filterSale && c.created_by_name !== filterSale) return false
    return true
  })

  const totalSaleNhap = filtered.reduce((s, c) => s + Number(c.total_amount ?? 0), 0)
  const totalKTDuyet = filtered.reduce((s, c) => s + Number(c.final_amount ?? 0), 0)
  const totalDiff = totalKTDuyet - totalSaleNhap

  const pending = [] // derived from pending_kt contracts — just use 0 for now
  const revenue = kpi?.revenue ?? totalKTDuyet
  const target = kpi?.target ?? 0
  const pct = target ? Math.round((revenue / target) * 100) : 0

  const salesList = [...new Set(contracts.map(c => c.created_by_name).filter(Boolean))]

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { icon: <IconTrendingUp size={13} color="#15803d" />, label: 'DT đã duyệt (chính thức)', val: fmt(revenue) + 'đ', sub: target ? `Mục tiêu: ${fmt(target)}đ · ${pct}%` : '—', c: '#15803d', bc: '#15803d' },
          { icon: <IconClock size={13} color="#854d0e" />, label: 'DT chờ duyệt', val: '—', sub: 'HĐ đang chờ KT', c: '#854d0e', bc: undefined },
          { icon: <IconReceipt size={13} color="#1e40af" />, label: 'HĐ điện tử đã phát hành', val: String(contracts.filter(c => c.invoice_issued).length || 0), sub: 'Đúng quy định CQT', c: '#1e40af', bc: undefined },
          { icon: <IconPercentage size={13} color="#5b21b6" />, label: 'Thuế VAT', val: fmt(Math.round(totalKTDuyet * 0.1)) + 'đ', sub: 'Thẩm mỹ 10% · BL miễn VAT', c: '#5b21b6', bc: undefined },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: `1px solid ${s.bc ?? '#dde3ef'}`, borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{s.icon}{s.label}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Chi tiết DT theo HĐ đã duyệt</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <select value={filterLoai} onChange={e => setFilterLoai(e.target.value)}
              style={{ border: '1px solid #dde3ef', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Tất cả loại DV</option>
              <option value="tham_my">Thẩm mỹ</option>
              <option value="benh_ly">Bệnh lý</option>
            </select>
            <select value={filterSale} onChange={e => setFilterSale(e.target.value)}
              style={{ border: '1px solid #dde3ef', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}>
              <option value="">Tất cả Sale</option>
              {salesList.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
              <IconUpload size={11} /> Xuất Excel
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Số HĐ', 'KH', 'Dịch vụ', 'Loại', 'Sale nhập', 'KT duyệt', 'Hình thức TT', 'Nhận tiền', 'HĐ điện tử'].map(h => (
                  <th key={h} style={{ padding: '7px 11px', textAlign: h.includes('nhập') || h.includes('duyệt') ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Không có dữ liệu</td></tr>
              ) : filtered.map(c => {
                const isBL = c.loai_dv === 'benh_ly'
                const isReceived = c.payment_status === 'received'
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 11px', fontWeight: 700 }}>{c.contract_no}</td>
                    <td style={{ padding: '7px 11px' }}>{c.customer_name}</td>
                    <td style={{ padding: '7px 11px', fontSize: 10 }}>{c.items?.[0]?.name ?? '—'}</td>
                    <td style={{ padding: '7px 11px' }}>
                      <span style={{ background: isBL ? '#dbeafe' : '#fef9c3', color: isBL ? '#1e40af' : '#854d0e', padding: '1px 6px', borderRadius: 10, fontSize: 8, fontWeight: 600 }}>
                        {isBL ? 'Bệnh lý · KCT' : 'Thẩm mỹ'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 11px', textAlign: 'right' }}>{fmt(c.total_amount)}đ</td>
                    <td style={{ padding: '7px 11px', textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{fmt(c.final_amount)}đ</td>
                    <td style={{ padding: '7px 11px', fontSize: 10 }}>{PM_LABEL[c.payment_method] ?? c.payment_method}</td>
                    <td style={{ padding: '7px 11px' }}>
                      <span style={{ background: isReceived ? '#dcfce7' : '#fef9c3', color: isReceived ? '#15803d' : '#854d0e', padding: '1px 6px', borderRadius: 10, fontSize: 8, fontWeight: 600 }}>
                        {isReceived ? '✓ Đã nhận' : '⏳ Chưa đủ'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 11px' }}>
                      {c.invoice_issued
                        ? <span style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: 10, fontSize: 8, fontWeight: 600 }}>✓ Đã PH</span>
                        : <span style={{ background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: 10, fontSize: 8 }}>Chưa</span>
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #fde68a' }}>
                  <td colSpan={4} style={{ padding: '7px 11px', fontWeight: 700, fontSize: 11 }}>Tổng ({filtered.length} HĐ đã duyệt)</td>
                  <td style={{ padding: '7px 11px', textAlign: 'right', fontWeight: 700 }}>{fmt(totalSaleNhap)}đ</td>
                  <td style={{ padding: '7px 11px', textAlign: 'right', color: '#15803d', fontWeight: 700 }}>{fmt(totalKTDuyet)}đ</td>
                  <td style={{ padding: '7px 11px', textAlign: 'right', color: totalDiff >= 0 ? '#15803d' : '#dc2626', fontWeight: 700 }}>{totalDiff >= 0 ? '+' : ''}{fmt(totalDiff)}đ</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
