import { useState, useEffect } from 'react'
import { IconTrendingUp, IconReceipt, IconPercentage, IconUpload, IconAlertTriangle } from '@tabler/icons-react'
import { getContracts, getKpiDashboard } from '../../../api/ketoan'
import KetoanListShell from '../components/KetoanListShell'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

const PM_ICON = { transfer: '🏦 CK', cash: '💵 TM', combined: '🔀 CK+TM' }
const PM_LABEL = { transfer: 'Chuyển khoản', cash: 'Tiền mặt', combined: 'CK + TM' }

export default function DoanhThuTab() {
  const [contracts, setContracts] = useState([])
  const [kpi, setKpi] = useState(null)
  const [filterLoai, setFilterLoai] = useState('')
  const [filterSale, setFilterSale] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

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
  const totalThucThu = filtered.reduce((s, c) => s + Number(c.thuc_thu ?? 0), 0)
  const totalChoGN = filtered.reduce((s, c) => s + Number(c.cho_giai_ngan ?? 0), 0)
  const totalConNo = filtered.reduce((s, c) => s + Number(c.con_no ?? 0), 0)
  const totalPhi = filtered.reduce((s, c) => s + Number(c.phi ?? 0), 0)
  const totalNet = filtered.reduce((s, c) => s + Number(c.thuc_ve_bank ?? 0), 0)
  const totalDiff = totalKTDuyet - totalSaleNhap

  const pending = [] // derived from pending_kt contracts — just use 0 for now
  const revenue = kpi?.revenue ?? totalKTDuyet
  const target = kpi?.target ?? 0
  const pct = target ? Math.round((revenue / target) * 100) : 0

  const nConNo = filtered.filter(c => Number(c.con_no ?? 0) > 0).length
  const salesList = [...new Set(contracts.map(c => c.created_by_name).filter(Boolean))]
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  useEffect(() => { setPage(1) }, [filterLoai, filterSale, pageSize])

  const stats = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { icon: <IconTrendingUp size={13} color="#15803d" />, label: 'DT đã duyệt (chính thức)', val: fmt(totalKTDuyet) + 'đ', sub: `Sale nhập ${fmt(totalSaleNhap)}đ · Chênh KT ${totalDiff === 0 ? '0đ (khớp)' : (totalDiff > 0 ? '+' : '') + fmt(totalDiff) + 'đ'}`, c: '#15803d', bc: '#15803d' },
          { icon: <IconReceipt size={13} color="#0f766e" />, label: 'Khách đã trả', val: fmt(totalThucThu) + 'đ', sub: totalPhi > 0 ? `Phí ${fmt(totalPhi)}đ · Net về bank ${fmt(totalNet)}đ` : (totalChoGN > 0 ? `Chờ giải ngân ${fmt(totalChoGN)}đ` : `${filtered.length - nConNo}/${filtered.length} HĐ đã thu đủ`), c: '#0f766e', bc: '#0f766e' },
          { icon: <IconAlertTriangle size={13} color="#dc2626" />, label: 'Còn nợ', val: fmt(totalConNo) + 'đ', sub: nConNo ? `${nConNo} HĐ còn nợ` : 'Đã thu đủ tất cả', c: '#dc2626', bc: totalConNo > 0 ? '#dc2626' : undefined },
          { icon: <IconPercentage size={13} color="#5b21b6" />, label: 'Thuế VAT (tạm tính)', val: fmt(Math.round(totalKTDuyet * 0.1)) + 'đ', sub: 'Thẩm mỹ 10% · BL miễn VAT', c: '#5b21b6', bc: undefined },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: `1px solid ${s.bc ?? '#dde3ef'}`, borderRadius: 9, padding: '11px 13px' }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{s.icon}{s.label}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>
  )

  const toolbar = (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
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
  )

  return (
    <KetoanListShell stats={stats} toolbar={toolbar} pagination={{ page, pageSize, count: filtered.length, onPage: setPage, onPageSize: setPageSize }}>
        <div style={{ minWidth: 1900 }}>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', fontSize: 11 }}>
            <colgroup>
              <col style={{ width: '7%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Số HĐ', 'KH', 'Dịch vụ', 'Loại', 'Sale nhập', 'KT duyệt', 'Khách đã trả', 'Chờ giải ngân', 'Còn nợ', 'Hình thức TT', 'Nhận tiền', 'HĐ điện tử'].map(h => (
                  <th key={h} style={{ padding: '7px 11px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={12} style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>Không có dữ liệu</td></tr>
              ) : paged.map(c => {
                const isBL = c.loai_dv === 'benh_ly'
                const conNo = Number(c.con_no ?? 0)
                const thucThu = Number(c.thuc_thu ?? 0)
                const choGN = Number(c.cho_giai_ngan ?? 0)
                const thu = conNo <= 0 ? { bg: '#dcfce7', c: '#15803d', t: '✓ Đã đủ' }
                  : thucThu > 0 ? { bg: '#fef9c3', c: '#854d0e', t: '◐ Một phần' }
                  : { bg: '#f1f5f9', c: '#64748b', t: '⏳ Chưa thu' }
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 11px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.contract_no}</td>
                    <td style={{ padding: '7px 11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.customer_name}</td>
                    <td style={{ padding: '7px 11px', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.items?.[0]?.name ?? '—'}</td>
                    <td style={{ padding: '7px 11px' }}>
                      <span style={{ background: isBL ? '#dbeafe' : '#fef9c3', color: isBL ? '#1e40af' : '#854d0e', padding: '1px 6px', borderRadius: 10, fontSize: 8, fontWeight: 600 }}>
                        {isBL ? 'Bệnh lý · KCT' : 'Thẩm mỹ'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 11px' }}>{fmt(c.total_amount)}đ</td>
                    <td style={{ padding: '7px 11px', color: '#15803d', fontWeight: 600 }}>{fmt(c.final_amount)}đ</td>
                    <td style={{ padding: '7px 11px', color: '#0f766e', fontWeight: 600 }}>{fmt(thucThu)}đ</td>
                    <td style={{ padding: '7px 11px', color: choGN > 0 ? '#1e40af' : '#94a3b8', fontWeight: choGN > 0 ? 700 : 400 }}>{choGN > 0 ? fmt(choGN) + 'đ' : '—'}</td>
                    <td style={{ padding: '7px 11px', color: conNo > 0 ? '#dc2626' : '#94a3b8', fontWeight: conNo > 0 ? 700 : 400 }}>{fmt(conNo)}đ</td>
                    <td style={{ padding: '7px 11px', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.httt_thuc_te ?? PM_LABEL[c.payment_method] ?? c.payment_method}</td>
                    <td style={{ padding: '7px 11px' }}>
                      <span style={{ background: thu.bg, color: thu.c, padding: '1px 6px', borderRadius: 10, fontSize: 8, fontWeight: 600 }}>
                        {thu.t}
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
          </table>
        </div>
    </KetoanListShell>
  )
}
