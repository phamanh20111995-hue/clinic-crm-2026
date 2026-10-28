import { useState, useEffect } from 'react'
import { IconClockDollar, IconUsers, IconBuildingBank, IconCheck } from '@tabler/icons-react'
import { getCongNo, getInstallments, confirmInstallment } from '../../../api/payments'
import KetoanListShell from '../components/KetoanListShell'
import ThuNoKTModal from '../modals/ThuNoKTModal'
import toast from 'react-hot-toast'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

const NO_COLS = ['Số HĐ', 'KH', 'SĐT', 'Tổng HĐ', 'Đã thu', 'Còn nợ', '']
const TG_COLS = ['Số HĐ', 'KH', 'Nhà tài trợ', 'Loại', 'Gốc', 'PK thực nhận', 'Chi phí PK', 'Ngày dự kiến', '']

export default function CongNoTab() {
  const [view, setView] = useState('no') // 'no' = công nợ | 'tragop' = trả góp chờ về két
  const [congno, setCongno] = useState([])
  const [installments, setInstallments] = useState([])
  const [thuNoTarget, setThuNoTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const loadCongNo = () => getCongNo().then(r => setCongno(r.data ?? [])).catch(() => {})
  const loadInstallments = () => getInstallments({ status: 'cho_giai_ngan' }).then(r => setInstallments(r.data ?? [])).catch(() => {})
  useEffect(() => { loadCongNo(); loadInstallments() }, [])
  useEffect(() => { setPage(1) }, [view, pageSize])

  const totalDebt = congno.reduce((s, c) => s + Number(c.remaining ?? 0), 0)
  const choVeKetSum = installments.reduce((s, i) => s + Number(i.pk_net ?? 0), 0)

  const confirmVe = async (inst) => {
    try {
      await confirmInstallment(inst.id, {})
      toast.success('Đã xác nhận tiền về két')
      loadInstallments()
    } catch (err) { toast.error(err.response?.data?.detail ?? 'Lỗi xác nhận') }
  }

  const rows = view === 'no' ? congno : installments
  const paged = rows.slice((page - 1) * pageSize, page * pageSize)

  const card = (icon, label, value, sub, color, border) => (
    <div style={{ background: '#fff', border: `1px solid ${border ?? '#dde3ef'}`, borderRadius: 9, padding: '11px 13px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
    </div>
  )

  const stats = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
      {card(<IconClockDollar size={13} color="#dc2626" />, 'Tổng còn nợ', fmt(totalDebt) + 'đ', `${congno.length} hợp đồng`, '#dc2626', '#dc2626')}
      {card(<IconUsers size={13} color="#854d0e" />, 'Số HĐ còn nợ', String(congno.length), 'Khách chưa thu đủ', '#854d0e')}
      {card(<IconBuildingBank size={13} color="#1e40af" />, 'Trả góp chờ về két', fmt(choVeKetSum) + 'đ', `${installments.length} khoản`, '#1e40af')}
    </div>
  )

  const tabBtn = (k, txt) => (
    <button onClick={() => setView(k)}
      style={{ padding: '6px 14px', border: 'none', borderBottom: `2px solid ${view === k ? '#b45309' : 'transparent'}`, background: 'transparent', color: view === k ? '#b45309' : '#64748b', fontWeight: view === k ? 700 : 500, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
      {txt}
    </button>
  )

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: '1px solid #eef1f6' }}>
      {tabBtn('no', 'Danh sách công nợ')}
      {tabBtn('tragop', `Trả góp chờ về két${installments.length ? ` (${installments.length})` : ''}`)}
    </div>
  )

  const thStyle = align => ({ padding: '7px 11px', textAlign: align, fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 })
  const tdR = { padding: '7px 11px', textAlign: 'right' }
  // Ghim cột nút ở mép phải để không bị khuất khi cuộn ngang
  const thAction = { padding: '7px 11px', textAlign: 'right', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap', position: 'sticky', top: 0, right: 0, background: '#f8fafc', zIndex: 3, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }
  const tdAction = { padding: '7px 11px', textAlign: 'right', position: 'sticky', right: 0, background: '#fff', zIndex: 2, boxShadow: '-6px 0 6px -4px rgba(15,23,42,0.08)' }

  return (
    <>
      <KetoanListShell
        stats={stats}
        toolbar={toolbar}
        pagination={{ page, pageSize, count: rows.length, onPage: setPage, onPageSize: setPageSize }}
      >
        <div style={{ minWidth: 1900 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            {view === 'no' ? (
              <>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {NO_COLS.map((h, i) => <th key={i} style={i === NO_COLS.length - 1 ? thAction : thStyle(['Tổng HĐ', 'Đã thu', 'Còn nợ'].includes(h) ? 'right' : 'left')}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#15803d', fontSize: 12 }}>Không có công nợ</td></tr>
                  ) : paged.map(c => (
                    <tr key={c.contract_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 11px', fontWeight: 700 }}>{c.contract_no}</td>
                      <td style={{ padding: '7px 11px' }}>{c.customer_name}</td>
                      <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{c.customer_phone}</td>
                      <td style={tdR}>{fmt(c.final_amount)}đ</td>
                      <td style={{ ...tdR, color: '#15803d' }}>{fmt(c.paid)}đ</td>
                      <td style={{ ...tdR, color: '#dc2626', fontWeight: 700 }}>{fmt(c.remaining)}đ</td>
                      <td style={tdAction}>
                        <button onClick={() => setThuNoTarget({ id: c.contract_id, customer_name: c.customer_name, final_amount: c.final_amount, paid: c.paid, remaining: c.remaining })}
                          style={{ padding: '3px 11px', border: 'none', borderRadius: 6, background: '#15803d', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Thu nợ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {TG_COLS.map((h, i) => <th key={i} style={i === TG_COLS.length - 1 ? thAction : thStyle(['Gốc', 'PK thực nhận', 'Chi phí PK'].includes(h) ? 'right' : 'left')}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#15803d', fontSize: 12 }}>Không có khoản trả góp chờ về két</td></tr>
                  ) : paged.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 11px', fontWeight: 700 }}>{i.contract_no}</td>
                      <td style={{ padding: '7px 11px' }}>{i.customer_name}</td>
                      <td style={{ padding: '7px 11px' }}>{i.provider}</td>
                      <td style={{ padding: '7px 11px', fontSize: 10, color: '#64748b' }}>{i.provider_type_display}</td>
                      <td style={tdR}>{fmt(i.principal)}đ</td>
                      <td style={{ ...tdR, color: '#15803d', fontWeight: 600 }}>{fmt(i.pk_net)}đ</td>
                      <td style={{ ...tdR, color: '#854d0e' }}>{fmt(i.pk_cost)}đ</td>
                      <td style={{ padding: '7px 11px', color: '#1e40af', fontWeight: 600 }}>{i.expected_date ?? '—'}</td>
                      <td style={tdAction}>
                        <button onClick={() => confirmVe(i)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 11px', border: 'none', borderRadius: 6, background: '#1e40af', color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <IconCheck size={11} /> Về két
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      </KetoanListShell>

      {thuNoTarget && <ThuNoKTModal contract={thuNoTarget} onClose={() => setThuNoTarget(null)} onDone={() => { setThuNoTarget(null); loadCongNo(); loadInstallments() }} />}
    </>
  )
}
