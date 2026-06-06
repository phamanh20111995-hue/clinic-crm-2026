import { useState, useEffect } from 'react'
import { IconClockDollar, IconAlertTriangle, IconCheck, IconBuildingBank, IconUpload } from '@tabler/icons-react'
import { getContracts } from '../../../api/ketoan'
import ThuNoKTModal from '../modals/ThuNoKTModal'
import XacNhanCKModal from '../modals/XacNhanCKModal'

const fmt = n => Number(n ?? 0).toLocaleString('vi-VN')

export default function CongNoTab() {
  const [contracts, setContracts] = useState([])
  const [thuNoTarget, setThuNoTarget] = useState(null)
  const [xnCKTarget, setXnCKTarget] = useState(null)

  const load = async () => {
    try {
      const r = await getContracts({ approval_status: 'approved' })
      const all = r.data?.results ?? r.data ?? []
      const withDebt = all.map(c => ({
        ...c,
        con_no: Number(c.final_amount ?? 0) - Number(c.paid_amount ?? 0),
      })).filter(c => c.con_no > 0)
      setContracts(withDebt)
    } catch { }
  }

  useEffect(() => { load() }, [])

  const totalDebt = contracts.reduce((s, c) => s + c.con_no, 0)
  const overdue = contracts.filter(c => c.due_date && new Date(c.due_date) < new Date())
  const ckPending = contracts.filter(c => c.payment_method === 'transfer' && c.payment_status !== 'received')
  const ckTotal = ckPending.reduce((s, c) => s + c.con_no, 0)

  const isOverdue = c => c.due_date && new Date(c.due_date) < new Date()

  return (
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        <div style={{ background: '#fff', border: '1px solid #dc2626', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconClockDollar size={13} color="#dc2626" />Tổng còn nợ</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#dc2626' }}>{fmt(totalDebt)}đ</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{contracts.length} KH</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconAlertTriangle size={13} color="#854d0e" />Quá hạn</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#854d0e' }}>{overdue.length} KH</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Tổng: {fmt(overdue.reduce((s, c) => s + c.con_no, 0))}đ</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconCheck size={13} color="#15803d" />Thu nợ tháng</div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#15803d' }}>—</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Theo sổ thu</div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}><IconBuildingBank size={12} color="#1e40af" />CK chưa xác nhận</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1e40af' }}>{fmt(ckTotal)}đ</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{ckPending.length} giao dịch</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>💵 TM chưa kiểm đếm</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#854d0e' }}>—</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Két cần đối soát</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 9, padding: '11px 13px' }}>
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>💰 KH còn nợ</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#dc2626' }}>{fmt(totalDebt)}đ</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{contracts.length} KH</div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #dde3ef', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f2044' }}>Danh sách công nợ</span>
          <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px solid #dde3ef', borderRadius: 6, background: '#fff', fontSize: 11, cursor: 'pointer' }}>
            <IconUpload size={11} /> Xuất Excel
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['KH', 'Sale phụ trách', 'Tổng HĐ', 'Đã thu', 'Còn nợ', 'Hình thức TT', 'Trạng thái', ''].map(h => (
                  <th key={h} style={{ padding: '7px 11px', textAlign: ['Tổng HĐ', 'Đã thu', 'Còn nợ'].includes(h) ? 'right' : 'left', fontSize: 10, fontWeight: 600, color: '#64748b', borderBottom: '1px solid #eef1f6', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#15803d', fontSize: 12 }}>Không có công nợ</td></tr>
              ) : contracts.map(c => {
                const od = isOverdue(c)
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: od ? '#fef2f2' : undefined }}>
                    <td style={{ padding: '7px 11px', fontWeight: 700 }}>{c.customer_name}</td>
                    <td style={{ padding: '7px 11px', fontSize: 10 }}>{c.created_by_name}</td>
                    <td style={{ padding: '7px 11px', textAlign: 'right' }}>{fmt(c.final_amount)}đ</td>
                    <td style={{ padding: '7px 11px', textAlign: 'right', color: '#15803d' }}>{fmt(c.paid_amount)}đ</td>
                    <td style={{ padding: '7px 11px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>{fmt(c.con_no)}đ</td>
                    <td style={{ padding: '7px 11px', fontSize: 10, color: od ? '#dc2626' : '#854d0e' }}>
                      {c.due_date ? (od ? `${c.due_date} · QUÁ HẠN` : c.due_date) : c.payment_method}
                    </td>
                    <td style={{ padding: '7px 11px' }}>
                      <span style={{ background: od ? '#fee2e2' : '#fef9c3', color: od ? '#991b1b' : '#854d0e', padding: '1px 6px', borderRadius: 10, fontSize: 9, fontWeight: 600 }}>
                        {od ? 'Quá hạn' : 'Chưa đến hạn'}
                      </span>
                    </td>
                    <td style={{ padding: '7px 11px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {c.payment_method === 'transfer' && (
                          <button onClick={() => setXnCKTarget(c)}
                            style={{ padding: '2px 7px', border: '1px solid #1e40af', borderRadius: 5, background: '#fff', color: '#1e40af', fontSize: 9, cursor: 'pointer', fontWeight: 600 }}>
                            XN CK
                          </button>
                        )}
                        <button onClick={() => setThuNoTarget(c)}
                          style={{ padding: '2px 7px', border: `1px solid ${od ? '#dc2626' : '#dde3ef'}`, borderRadius: 5, background: '#fff', color: od ? '#dc2626' : '#374151', fontSize: 9, cursor: 'pointer', fontWeight: od ? 600 : 400 }}>
                          Thu nợ
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {contracts.length > 0 && (
              <tfoot>
                <tr style={{ background: '#f8fafc', borderTop: '2px solid #fecaca' }}>
                  <td colSpan={4} style={{ padding: '7px 11px', fontSize: 11, color: '#991b1b' }}>Tổng</td>
                  <td style={{ padding: '7px 11px', textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>{fmt(totalDebt)}đ</td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {thuNoTarget && <ThuNoKTModal contract={thuNoTarget} onClose={() => setThuNoTarget(null)} onDone={() => { setThuNoTarget(null); load() }} />}
      {xnCKTarget && <XacNhanCKModal contract={xnCKTarget} onClose={() => setXnCKTarget(null)} onDone={() => { setXnCKTarget(null); load() }} />}
    </div>
  )
}
